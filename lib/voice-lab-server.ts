import {readFileSync} from 'node:fs';
import {readFile,writeFile,mkdir,rename,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {auditionTexts,modelById,parseVoiceSelection,providerKeys,type VoiceProvider} from './voice-catalog.ts';
import {speechRequest,voiceListRequest,parseVoiceList,providerFailure,pcmWav} from './voice-provider.ts';
import {createGameGuide} from './live-game.ts';
import {questions,profiles,scoreAnswers,interestLabels} from './quiz.ts';
import {narrationText} from './narration-text.ts';
const guide=createGameGuide({questions,profiles,scoreAnswers,interestLabels});
const hosts=new Set(['localhost:5173','127.0.0.1:5173']);
export function trustedVoiceRequest(request:Pick<IncomingMessage,'headers'|'method'>){
 const host=request.headers.host||'';
 return hosts.has(host)&&(!request.headers.origin||request.headers.origin===`http://${host}`)&&(!request.headers['sec-fetch-site']||['same-origin','none'].includes(String(request.headers['sec-fetch-site'])))&&(request.method==='GET'||request.headers.origin===`http://${host}`);
}
export function readVoiceKeys(root:string){
 let lines:string[]=[];try{lines=readFileSync(resolve(root,'.dev.vars'),'utf8').split('\n');}catch{}
 return Object.fromEntries(Object.entries(providerKeys).map(([provider,name])=>{
   const line=lines.find(l=>l.startsWith(name+'=')||l.startsWith(name+' ='));
   return [provider,line?.slice(line.indexOf('=')+1).trim().replace(/^(["'])(.*)\1$/,'$2')||process.env[name]||''];
 })) as Record<VoiceProvider,string>;
}
const json=(res:ServerResponse,status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req:IncomingMessage){let text='';for await(const part of req){text+=part;if(text.length>8000)throw Error('request_too_large');}return JSON.parse(text);}
export function createVoiceLab(root:string,fetcher:typeof fetch=fetch){
 const cache=resolve(root,'.sites-runtime/voice-lab');
 const pending=new Set<string>();let active=0;
 let keyWrites:Promise<void>=Promise.resolve();
 return async function handle(req:IncomingMessage,res:ServerResponse,next:()=>void){
  const url=new URL(req.url||'/', 'http://localhost:5173');
  if(!url.pathname.startsWith('/api/voice-lab/')){next();return;}
  if(!trustedVoiceRequest(req)){json(res,403,{error:'Local same-origin requests only.'});return;}
  const keys=readVoiceKeys(root), language=url.searchParams.get('language')==='en'?'en':'ru';
  const abort=new AbortController();res.on('close',()=>{if(!res.writableEnded)abort.abort();});
  try{
   if(url.pathname==='/api/voice-lab/status'&&req.method==='GET'){
    json(res,200,{providers:Object.fromEntries(Object.entries(keys).map(([k,v])=>[k,Boolean(v)]))});return;
   }
   if(url.pathname==='/api/voice-lab/samples'&&req.method==='GET'){
    let files:string[]=[];try{files=await readdir(cache);}catch{}
    const samples=await Promise.all(files.filter(f=>/^[a-f0-9]{64}\.json$/.test(f)).map(async f=>{try{return JSON.parse(await readFile(resolve(cache,f),'utf8'));}catch{return null;}}));
    // Old ElevenLabs entries omitted the voice URL from their cache identity.
    // Do not offer those ambiguous samples as proof of a successful audition.
    json(res,200,{samples:samples.filter(s=>s&&(modelById(s.selection?.model)?.provider!=='elevenlabs'||s.cacheVersion===2))});return;
   }
   if(url.pathname==='/api/voice-lab/key'&&req.method==='POST'){
    const data=await body(req),provider=data.provider as VoiceProvider;
    if(!Object.hasOwn(providerKeys,provider)||typeof data.key!=='string'||!/^[\x21-\x7E]{16,512}$/.test(data.key)||/["'`\\]/.test(data.key)){json(res,400,{error:'Проверьте ключ / Check the key format.'});return;}
    const save=keyWrites.catch(()=>{}).then(async()=>{
     const file=resolve(root,'.dev.vars'),name=providerKeys[provider];let content='';try{content=await readFile(file,'utf8');}catch{}
     const lines=content.split('\n').filter(line=>!new RegExp(`^${name}\\s*=`).test(line));
     const temporary=file+'.voice-tmp';await writeFile(temporary,lines.join('\n').trimEnd()+`\n${name}=${data.key}\n`,{mode:0o600});await rename(temporary,file);
    });keyWrites=save;await save;
    json(res,200,{saved:true});return;
   }
   if(url.pathname==='/api/voice-lab/voices'&&req.method==='GET'){
    const provider=url.searchParams.get('provider') as VoiceProvider;
    if(!['elevenlabs','cartesia'].includes(provider)){json(res,400,{error:'Unknown provider.'});return;}
    if(!keys[provider]){json(res,503,{error:`Добавьте ${providerKeys[provider]} в .dev.vars / Add the provider key.`});return;}
    const r=voiceListRequest(provider,language,keys[provider],(url.searchParams.get('cursor')||'').slice(0,200),(url.searchParams.get('search')||'').slice(0,100));
    const response=await fetcher(r.url,{headers:r.headers,signal:AbortSignal.any([abort.signal,AbortSignal.timeout(15000)])});
    if(!response.ok){json(res,502,await providerFailure(response,language));return;}
    json(res,200,parseVoiceList(provider,await response.json(),language));return;
   }
   if(req.method==='GET'&&/^\/api\/voice-lab\/audio\/[a-f0-9]{64}\.wav$/.test(url.pathname)){
    const id=url.pathname.split('/').pop()!.slice(0,-4);let audio:Buffer;
    try{audio=await readFile(resolve(cache,id+'.pcm'));}catch{json(res,404,{error:'Sample not generated.'});return;}
    res.writeHead(200,{'Content-Type':'audio/wav','Cache-Control':'private, max-age=86400'});res.end(pcmWav(audio));return;
   }
   if(url.pathname!=='/api/voice-lab/speech'||req.method!=='POST'){json(res,404,{error:'Not found.'});return;}
   const data=await body(req), selection=parseVoiceSelection(data.selection),model=modelById(selection?.model),lang=data.language;
   if(!selection||!model||model.kind!=='tts'||!['ru','en'].includes(lang)){json(res,400,{error:'Invalid voice selection.'});return;}
   let text:string;
   if(data.sample&&Object.hasOwn(auditionTexts,data.sample))text=auditionTexts[data.sample as keyof typeof auditionTexts][lang as 'ru'|'en'];
   else {
    const game=guide.parse(data.game),cue=data.cue??'screen',variant=data.variant??0;
    if(!game||!['screen','tap'].includes(cue)||!Number.isInteger(variant)||variant<0||variant>2){json(res,400,{error:'Invalid narration cue.'});return;}
    text=narrationText(game,lang,cue,variant);
   }
   const request=speechRequest(selection,lang,text,keys[model.provider]);
   // Versioned synthesis settings, text and provider/voice all participate in the cache identity.
   const id=createHash('sha256').update(JSON.stringify({v:2,provider:model.provider,url:request.url,body:request.init.body})).digest('hex');
   let cached:Buffer|undefined;try{cached=await readFile(resolve(cache,id+'.pcm'));}catch{}
   const result={url:`/api/voice-lab/audio/${id}.wav`,text};
   if(cached){if(data.sample)json(res,200,{...result,cached:true,seconds:cached.length/48000});else{res.writeHead(200,{'Content-Type':'application/octet-stream','X-Navi-Text':encodeURIComponent(text),'X-Navi-Cache':'hit'});res.end(cached);}return;}
   if(!keys[model.provider]){json(res,503,{error:`Добавьте ${providerKeys[model.provider]} в .dev.vars / Provider key is missing.`});return;}
   if(active>=2||pending.has(id)){json(res,429,{error:'Дождитесь текущего образца / Please wait for the current sample.'});return;}
   if(abort.signal.aborted)return;
   active++;pending.add(id);
   try{
    const response=await fetcher(request.url,{...request.init,signal:AbortSignal.any([abort.signal,AbortSignal.timeout(45000)])});
    if(!response.ok||!response.body||response.headers.get('Content-Type')?.includes('json')){json(res,502,await providerFailure(response,lang));return;}
    if(!data.sample)res.writeHead(200,{'Content-Type':'application/octet-stream','X-Navi-Text':encodeURIComponent(text),'Cache-Control':'no-store'});
    const chunks:Buffer[]=[];let size=0;
    for await(const value of response.body as unknown as AsyncIterable<Uint8Array>){
      const chunk=Buffer.from(value);size+=chunk.length;if(size>1440000)throw Error('audio_too_long');
      chunks.push(chunk);if(!data.sample)res.write(chunk);
    }
    if(!size||size%2)throw Error('invalid_pcm');
    if(abort.signal.aborted)return;
    const pcm=Buffer.concat(chunks);await mkdir(cache,{recursive:true});await writeFile(resolve(cache,id+'.pcm'),pcm);
    if(data.sample)await writeFile(resolve(cache,id+'.json'),JSON.stringify({...result,cacheVersion:2,selection,language:lang,sample:data.sample,seconds:size/48000,cached:true}));
    if(data.sample)json(res,200,{...result,cached:false,seconds:size/48000});else res.end();
   }finally{active--;pending.delete(id);}
  }catch{
   if(res.destroyed)return;
   if(res.headersSent){res.destroy();return;}
   json(res,502,{error:'Не удалось получить звук. Проверьте подключение и настройки провайдера. / Could not generate audio.'});
  }
 };
}
