// Spoken answers (opt-in in booth settings): microphone → 16 kHz PCM → ElevenLabs realtime recognition.
// The browser connects straight to ElevenLabs with a single-use token from /api/listen, so the API key stays on the
// server and no audio passes through the site. Nothing is stored by the booth. While Navi speaks (and briefly after),
// silence is sent instead of the microphone, so Navi's own voice is never taken for an answer.
// No automatic reconnects: a failure turns listening off with the reason, and touch keeps working.
import type {VoiceLanguage} from './voice-catalog';

export type ListenState='off'|'connecting'|'listening'|'error';
type Callbacks={onState?:(state:ListenState,error:string)=>void;onPartial?:(text:string)=>void;onFinal?:(text:string)=>void;onLevel?:(level:number)=>void};
type Environment={
 token:()=>Promise<string>;
 microphone:()=>Promise<MediaStream>;
 context:(native?:boolean)=>AudioContext;
 node:(context:AudioContext)=>AudioWorkletNode;
 socket:(url:string)=>WebSocket;
 now:()=>number;
};
const text=(language:VoiceLanguage,ru:string,en:string)=>language==='en'?en:ru;
const browser:Environment={
 async token(){
  const response=await fetch('/api/listen',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  const data=await response.json().catch(()=>({})) as {token?:string;error?:string};
  if(!response.ok||!data.token)throw Error(data.error||'Не удалось включить микрофон.');
  return data.token;
 },
 microphone:()=>navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}}),
 // 16 kHz lets the browser resample the microphone itself; Firefox refuses that, so it gets its native rate.
 context:native=>native?new AudioContext():new AudioContext({sampleRate:16000}),
 node:context=>new AudioWorkletNode(context,'navi-mic-pcm',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]}),
 socket:url=>new WebSocket(url),
 now:()=>Date.now(),
};
// Navi's voice can linger in the room for a moment after playback ends.
const echoTail=700;
const endpoint='wss://api.elevenlabs.io/v1/speech-to-text/realtime';
export const listenLimit=600000;

function base64(bytes:Uint8Array){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}

type Run={language:VoiceLanguage;stream?:MediaStream;context?:AudioContext;node?:AudioWorkletNode;socket?:WebSocket;timer?:ReturnType<typeof setTimeout>};
export function createVoiceAnswers(callbacks:Callbacks={},env:Environment=browser){
 let run:Run|null=null,naviAt=-Infinity,disposed=false;
 const emit=(state:ListenState,error='')=>{if(!disposed)callbacks.onState?.(state,error);};
 function stop(error=''){
  const r=run;if(!r)return;run=null;clearTimeout(r.timer);
  if(r.node){r.node.port.onmessage=null;r.node.disconnect();}
  r.stream?.getTracks().forEach(track=>track.stop());
  if(r.socket){r.socket.onmessage=null;r.socket.onclose=null;r.socket.onerror=null;try{r.socket.close();}catch{}}
  void r.context?.close().catch(()=>{});
  callbacks.onLevel?.(0);emit(error?'error':'off',error);
 }
 async function start(language:VoiceLanguage,keyterms:string[]=[]){
  if(run||disposed)return;
  const r:Run={language};run=r;emit('connecting');
  const live=()=>run===r;
  try{
   // Both requests run together; if either fails, an already granted microphone is released at once.
   const [issued,granted]=await Promise.allSettled([env.token(),env.microphone()]);
   if(granted.status==='fulfilled'&&(issued.status==='rejected'||!live()))granted.value.getTracks().forEach(track=>track.stop());
   if(!live())return;
   if(issued.status==='rejected')throw issued.reason;
   if(granted.status==='rejected')throw granted.reason;
   const token=issued.value,stream=granted.value;
   r.stream=stream;
   const open=async(native:boolean)=>{
    const context=env.context(native);r.context=context;await context.resume();
    await context.audioWorklet.addModule('/audio/mic-pcm-worklet.js');
    return context.createMediaStreamSource(stream);
   };
   let source:MediaStreamAudioSourceNode;
   try{source=await open(false);}catch{void r.context?.close().catch(()=>{});if(!live())return;source=await open(true);}
   if(!live()||!r.context)return;
   const node=env.node(r.context),mute=r.context.createGain();
   // The worklet only reads the microphone; a silent path to the output keeps it running in every browser.
   mute.gain.value=0;source.connect(node);node.connect(mute);mute.connect(r.context.destination);r.node=node;
   const params=new URLSearchParams({model_id:'scribe_v2_realtime',language_code:language,audio_format:'pcm_16000',commit_strategy:'vad',vad_silence_threshold_secs:'0.7',filter_background_audio:'true',token});
   // The answer headings help recognition with product words («BI», «Telegram», "checkout"). The service accepts
   // hints of up to 20 characters and refuses the whole session otherwise, so longer headings are left out.
   for(const term of keyterms.filter(term=>term.length<=20).slice(0,50))params.append('keyterms',term);
   const socket=env.socket(`${endpoint}?${params}`);r.socket=socket;
   socket.onopen=()=>{if(live())emit('listening');};
   socket.onmessage=({data})=>{
    if(!live())return;
    let message:{message_type?:string;text?:string;error?:string};try{message=JSON.parse(String(data));}catch{return;}
    const type=message.message_type||'';
    if(type==='partial_transcript')callbacks.onPartial?.(message.text||'');
    else if(type==='committed_transcript'){const said=(message.text||'').trim();if(said)callbacks.onFinal?.(said);}
    else if(type==='quota_exceeded')stop(text(language,'Закончились кредиты распознавания речи.','Speech recognition credits are exhausted.'));
    else if(type.endsWith('error')||['rate_limited','resource_exhausted','session_time_limit_exceeded','invalid_request','unaccepted_terms'].includes(type))stop(text(language,'Распознавание речи остановлено. Отвечайте касанием.','Speech recognition stopped. Tap to answer.'));
   };
   socket.onerror=()=>{if(live())stop(text(language,'Нет связи с распознаванием речи. Отвечайте касанием.','Speech recognition is unreachable. Tap to answer.'));};
   socket.onclose=()=>{if(live())stop(text(language,'Распознавание речи отключилось. Отвечайте касанием.','Speech recognition disconnected. Tap to answer.'));};
   let silence='';
   node.port.onmessage=({data})=>{
    if(!live()||data.type!=='audio')return;
    const quiet=env.now()-naviAt<echoTail;
    callbacks.onLevel?.(quiet?0:data.level||0);
    if(socket.readyState!==1)return;
    const bytes=new Uint8Array(data.buffer);
    if(quiet&&silence.length===0)silence=base64(new Uint8Array(bytes.length));
    socket.send(JSON.stringify({message_type:'input_audio_chunk',audio_base_64:quiet?silence:base64(bytes),commit:false,sample_rate:16000}));
   };
   r.timer=setTimeout(()=>{if(live())stop();},listenLimit);
  }catch(error){
   if(!live())return;
   const denied=error instanceof DOMException&&['NotAllowedError','SecurityError'].includes(error.name);
   stop(denied?text(language,'Нет доступа к микрофону. Разрешите его в браузере.','Microphone access is blocked. Allow it in the browser.'):error instanceof Error&&error.message?error.message:text(language,'Не удалось включить микрофон.','Could not start the microphone.'));
  }
 }
 return {
  start,stop:()=>stop(),
  // Called with every playback frame of Navi's narration.
  naviSpeaking(speaking:boolean){if(speaking)naviAt=env.now();},
  dispose(){stop();disposed=true;},
 };
}
