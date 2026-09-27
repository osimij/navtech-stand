import type {GameContext} from './live-game';
import type {VoiceLanguage,VoiceSelection} from './voice-catalog';
import type {LiveState} from './live-client';
import type {SpeechFrame} from './invitation-player';
type Callbacks={onState?:(s:LiveState)=>void;onSpeech?:(f:SpeechFrame)=>void;onCaption?:(s:string)=>void;onDiagnostic?:(event:string,details?:Record<string,string|number|boolean>)=>void};
type Environment={context:()=>AudioContext;node:(c:AudioContext)=>AudioWorkletNode;fetch:typeof fetch};
const browser:Environment={context:()=>new AudioContext({sampleRate:24000}),node:c=>new AudioWorkletNode(c,'navi-pcm',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]}),fetch:(...args)=>fetch(...args)};
type Run={context:AudioContext;node?:AudioWorkletNode;language:VoiceLanguage;selection:VoiceSelection;request?:AbortController;revision:number;ready:boolean;lastTap:number;taps:number;timer?:ReturnType<typeof setTimeout>};
export function createTtsNarration(callbacks:Callbacks={},env:Environment=browser){
 let run:Run|null=null,disposed=false,game:GameContext={phase:'welcome',step:0,answers:[],selected:null,interest:''};
 const silence=()=>callbacks.onSpeech?.({speaking:false,level:0});
 function emit(phase:LiveState['phase'],error=''){if(!disposed)callbacks.onState?.({phase,error,playbackBlocked:Boolean(run&&run.context.state!=='running')});}
 function stop(error=''){
  const r=run;if(!r)return;run=null;r.request?.abort();clearTimeout(r.timer);r.node?.port.postMessage({type:'clear'});r.node?.disconnect();r.node?.port.close();void r.context.close().catch(()=>{});callbacks.onCaption?.('');silence();emit(error?'error':'idle',error);
 }
 async function speak(cue:'screen'|'tap'='screen',variant=0){
  const r=run;if(!r?.ready)return;
  r.request?.abort();const request=new AbortController();r.request=request;const revision=++r.revision;
  const current=()=>run===r&&r.revision===revision&&!request.signal.aborted;
  r.node?.port.postMessage({type:'clear'});callbacks.onCaption?.('');silence();
  try{
   const response=await env.fetch('/api/voice-lab/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({selection:r.selection,language:r.language,game,cue,variant}),signal:request.signal});
   if(!current())return;
   if(!response.ok){const data=await response.json() as {error?:string};throw Error(data.error||'Не удалось получить звук.');}
   if(!response.body)throw Error('Пустой аудиопоток.');
   callbacks.onCaption?.(decodeURIComponent(response.headers.get('X-Navi-Text')||''));
   const reader=response.body.getReader();let carry=new Uint8Array(0),received=0;
   while(current()){
    const {done,value}=await reader.read();if(!current()){await reader.cancel();return;}if(done)break;
    const joined=new Uint8Array(carry.length+value.length);joined.set(carry);joined.set(value,carry.length);
    const length=joined.length-joined.length%2;carry=joined.slice(length);
    if(length){const buffer=joined.slice(0,length).buffer;r.node?.port.postMessage({type:'audio',buffer},[buffer]);received+=length;}
   }
   if(current()&&(!received||carry.length))throw Error('Некорректный аудиопоток.');
  }catch(error){if(current())stop(error instanceof Error?error.message:'Не удалось получить звук.');}
 }
 async function start(language:VoiceLanguage,selection:VoiceSelection){
  if(run||disposed)return;
  let r:Run|undefined;
  try{
   r={context:env.context(),language,selection,revision:0,ready:false,lastTap:-Infinity,taps:0};run=r;const current=r;emit('connecting');
   r.timer=setTimeout(()=>{if(run===current)stop('Подключение заняло слишком много времени.');},30000);
   await r.context.resume();if(run!==r)return;
   await r.context.audioWorklet.addModule('/audio/live-pcm-worklet.js');if(run!==r)return;
   if(r.context.sampleRate!==24000)throw Error('Нужна частота звука 24 кГц.');
   r.node=env.node(r.context);r.node.connect(r.context.destination);
   r.node.port.onmessage=({data})=>{
    if(run!==current)return;
    if(data.type==='level'){const level=current.context.state==='running'?data.level||0:0;callbacks.onSpeech?.({speaking:level>.009,level:Math.min(1,level*7)});}
    if(data.type==='overflow')stop('Реплика слишком длинная. Попробуйте ещё раз.');
   };
   r.node.addEventListener?.('processorerror',()=>{if(run===current)stop('Ошибка воспроизведения.');});
   r.context.addEventListener('statechange',()=>{if(run===current)emit('ready');});
   r.ready=true;clearTimeout(r.timer);r.timer=setTimeout(()=>stop(),600000);emit('ready');
   callbacks.onDiagnostic?.('tts.started',{model:selection.model});void speak();
  }catch(error){if(r&&run!==r)return;if(run)stop(error instanceof Error?error.message:'Не удалось включить голос.');else emit('error','Не удалось включить звук.');}
 }
 function updateGame(next:GameContext){
  if(JSON.stringify(next)===JSON.stringify(game))return;
  const screenChanged=next.phase!==game.phase||next.step!==game.step;
  const answersChanged=JSON.stringify(next.answers)!==JSON.stringify(game.answers);
  const changed=screenChanged||answersChanged;
  game=next;
  if(changed&&run){run.request?.abort();run.revision++;run.node?.port.postMessage({type:'clear'});callbacks.onCaption?.('');silence();if(run.ready&&(screenChanged||next.phase==='result'))void speak();}
 }
 return {start,stop:()=>stop(),updateGame,greet:()=>{const r=run;if(!r?.ready||Date.now()-r.lastTap<6500||r.taps>=12)return;r.lastTap=Date.now();void speak('tap',r.taps++%3);},resumePlayback:()=>{const r=run;if(r)void r.context.resume().then(()=>{if(run===r)emit('ready');}).catch(()=>{if(run===r)stop('Не удалось включить звук.');});},dispose:()=>{stop();disposed=true;}};
}
