// Explicitly requested bounded audition: one RU + one EN sample for each Realtime voice.
// Reuses existing successful samples; never captures a microphone or retries paid requests.
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';
import {liveSession, LIVE_MODEL} from '../lib/live.ts';
import {realtimeVoices} from '../lib/voice-options.ts';
const root='public/audio/voice-comparison';fs.mkdirSync(root,{recursive:true});
const file=path.join(root,'manifest.json');
const manifest=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{model:LIVE_MODEL,createdAt:new Date().toISOString(),samples:[]};
if(manifest.model!==LIVE_MODEL)throw Error('Existing comparison uses a different model; preserve it.');
const line=fs.readFileSync('.dev.vars','utf8').split('\n').find(s=>/^OPENAI_API_KEY\s*=/.test(s));
const key=line?.slice(line.indexOf('=')+1).trim().replace(/^(["'])(.*)\1$/,'$2');if(!key)throw Error('Missing local API key');
const texts={ru:'Привет! Я Нави. Здесь нет правильных ответов — просто выберите, как вы подошли бы к задаче. Интересно, что получится.',en:'Hi, I’m Navi. There are no right answers here — just choose how you would approach the task. Let’s see what comes up.'};
function wav(pcm){const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(24000,24);h.writeUInt32LE(48000,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);}
async function sample(voice,language){return new Promise((resolve,reject)=>{
 const started=Date.now(),chunks=[];let transcript='',requested=false,first=0,settled=false;
 const ws=new WebSocket(`wss://api.openai.com/v1/realtime?model=${LIVE_MODEL}`,{headers:{Authorization:`Bearer ${key}`},handshakeTimeout:15000});
 const end=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);ws.close();if(error)reject(error);else resolve(value);};
 const timer=setTimeout(()=>end(Error('sample_timeout')),45000);
 ws.on('open',()=>{const session=liveSession(language,'quiz',{narration:true,voice});session.max_output_tokens=1024;session.instructions=`Read the supplied sample exactly once in ${language==='ru'?'Russian':'English'}. Natural, relaxed, conversational delivery. No introduction, extra words, performance or commentary.`;ws.send(JSON.stringify({type:'session.update',session}));});
 ws.on('message',raw=>{let e;try{e=JSON.parse(raw.toString())}catch{return}
  if(e.type==='error')return end(Error(e.error?.code||'provider_error'));
  if(e.type==='session.updated'&&!requested){requested=true;ws.send(JSON.stringify({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:`Voice audition task. You are the SPEAKER, not the listener. Read the following text word for word as your own line. Do not reply to it, do not address Navi, and do not add anything. TEXT: ${texts[language]}`}]}}));ws.send(JSON.stringify({type:'response.create',response:{instructions:`You are reading a voice sample, not having a conversation. Say exactly this and nothing else: ${texts[language]}`}}));}
  if(e.type==='response.output_audio.delta'){if(!first)first=Date.now();chunks.push(Buffer.from(e.delta,'base64'));}
  if(e.type==='response.output_audio_transcript.delta')transcript+=e.delta;
  if(e.type==='response.done'){if(e.response?.status!=='completed'||!chunks.length)return end(Error(e.response?.status||'empty_audio'));const pcm=Buffer.concat(chunks);const name=`${voice}-${language}.wav`;fs.writeFileSync(path.join(root,name),wav(pcm));end(null,{voice,language,file:`/audio/voice-comparison/${name}`,transcript,text:texts[language],seconds:pcm.length/48000,firstAudioMs:first-started,bytes:pcm.length,status:'ready'});}
 });
 ws.on('error',()=>end(Error('connection_error')));ws.on('close',()=>{if(!settled)end(Error('closed_before_completion'));});
});}
for(const voice of (process.argv[2]?[process.argv[2]]:realtimeVoices))for(const language of (process.argv[3]?[process.argv[3]]:['ru','en'])){
 if(manifest.samples.some(s=>s.voice===voice&&s.language===language))continue;
 try{const result=await sample(voice,language);manifest.samples.push(result);console.log(voice,language,'ready',result.seconds.toFixed(1)+'s');}
 catch(error){manifest.samples.push({voice,language,status:'error',error:error.message});console.log(voice,language,error.message);if(/quota|model|auth|connection/.test(error.message)){fs.writeFileSync(file,JSON.stringify(manifest,null,2));process.exitCode=1;process.exit();}}
 fs.writeFileSync(file,JSON.stringify(manifest,null,2));
}
