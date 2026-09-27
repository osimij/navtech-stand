import {modelById, parseVoiceSelection, type VoiceLanguage, type VoiceSelection, type CatalogVoice, type VoiceProvider} from './voice-catalog.ts';

export function speechRequest(selection:VoiceSelection,language:VoiceLanguage,text:string,key:string){
 const s=parseVoiceSelection(selection),model=modelById(s?.model);
 if(!s||!model||model.kind!=='tts')throw Error('invalid_selection');
 const headers:Record<string,string>={'Content-Type':'application/json'};
 let url:string,body:Record<string,unknown>;
 if(model.provider==='openai'){
   url='https://api.openai.com/v1/audio/speech';headers.Authorization=`Bearer ${key}`;
   body={model:s.model,voice:s.voice,input:text,response_format:'pcm',speed:1};
   if(s.model.startsWith('gpt-4o'))body.instructions=`Speak ${language==='ru'?'native Russian':'natural English'}. You are talking to one person beside you, not presenting or selling. Relaxed everyday pacing, small natural pauses, understated warmth, varied intonation. No announcer cadence, sing-song delivery, exaggerated enthusiasm, or added words. Read the supplied words exactly.`;
 }else if(model.provider==='elevenlabs'){
   url=`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(s.voice)}/stream?output_format=pcm_24000`;headers['xi-api-key']=key;
   body={model_id:s.model,text,language_code:language,voice_settings:{stability:s.model==='eleven_v3'?0.5:0.45,similarity_boost:0.75}};
 }else{
   url='https://api.cartesia.ai/tts/bytes';headers.Authorization=`Bearer ${key}`;headers['Cartesia-Version']='2026-08-14';
   body={model_id:s.model,transcript:text,voice:s.voice,language,output_format:{container:'raw',encoding:'pcm_s16le',sample_rate:24000}};
 }
 return {url,init:{method:'POST',headers,body:JSON.stringify(body)}};
}
export function voiceListRequest(provider:VoiceProvider,language:VoiceLanguage,key:string,cursor='',search=''){
 const url=new URL(provider==='elevenlabs'?'https://api.elevenlabs.io/v2/voices':'https://api.cartesia.ai/voices');
 const headers:Record<string,string>={};
 if(provider==='elevenlabs'){
   // A voice's native accent is not its synthesis language. Filtering here hid
   // all standard voices in Russian, even though these models support Russian.
   headers['xi-api-key']=key;url.searchParams.set('page_size','50');
   if(cursor)url.searchParams.set('next_page_token',cursor);if(search)url.searchParams.set('search',search);
 }else{
   headers.Authorization=`Bearer ${key}`;headers['Cartesia-Version']='2026-08-14';url.searchParams.set('limit','50');url.searchParams.set('language',language);
   if(cursor)url.searchParams.set('starting_after',cursor);if(search)url.searchParams.set('q',search);
 }
 return {url:url.toString(),headers};
}
export function parseVoiceList(provider:VoiceProvider,data:unknown,language:VoiceLanguage):{voices:CatalogVoice[];cursor:string}{
 const d=data as {voices?:Record<string,unknown>[];data?:Record<string,unknown>[];has_more?:boolean;next_page_token?:string;next_page?:string};
 const voices=(provider==='elevenlabs'?d.voices:d.data)||[];
 return {voices:voices.flatMap(v=>{
   const id=provider==='elevenlabs'?v.voice_id:v.id;if(typeof id!=='string'||typeof v.name!=='string')return [];
   const labels=v.labels as Record<string,string>|undefined;
   const accents=Array.isArray(v.accents)?v.accents as {locale?:string;is_native?:boolean}[]:[];
   return [{id,name:v.name,standard:provider==='elevenlabs'&&v.category==='premade',description:typeof v.description==='string'?v.description.slice(0,180):'',native:provider==='cartesia'?accents.some(a=>a.is_native&&a.locale?.startsWith(language)):labels?.language===language||labels?.language===(language==='ru'?'russian':'english')}];
 }).sort((a,b)=>Number(b.native)-Number(a.native)),cursor:d.has_more?(provider==='elevenlabs'?d.next_page_token:d.next_page)||'':''};
}
export function providerError(status:number,language:VoiceLanguage='ru',code=''){
 const en=language==='en';
 if(['paid_plan_required','subscription_required'].includes(code))return en
  ? 'This voice requires a paid provider plan. Choose a standard voice from the list, or change your plan in the provider account. Adding credits alone may not unlock this voice.'
  : 'Для этого голоса нужен платный тариф провайдера. Выберите стандартный голос из списка или смените тариф в аккаунте провайдера. Одного пополнения баланса может быть недостаточно.';
 if(['quota_exceeded','insufficient_quota','insufficient_credits'].includes(code))return en?'Provider credits are exhausted. Check your balance or choose another provider.':'Закончились кредиты провайдера. Проверьте баланс или выберите другого провайдера.';
 if(status===402)return en?'The provider requires payment for this request (402). Check your plan and credit balance, or choose another voice.':'Провайдер требует оплату этого запроса (402). Проверьте тариф и баланс или выберите другой голос.';
 if(status===401||status===403)return en?'Key or voice access denied. Check the key permissions in your provider account.':'Ключ не принят или нет доступа к голосу. Проверьте права ключа в аккаунте провайдера.';
 if(status===429)return en?'Provider rate limit reached. Wait before trying again.':'Достигнут лимит запросов провайдера. Повторите попытку позже.';
 if(status===400||status===404||status===422)return en?'This model and voice combination is unavailable. Check the voice ID or choose another voice.':'Это сочетание модели и голоса недоступно. Проверьте ID или выберите другой голос.';
 return en?`Provider request failed (${status}). Try again later.`:`Провайдер не ответил успешно (${status}). Повторите попытку позже.`;
}
export async function providerFailure(response:Response,language:VoiceLanguage){
 // Only allowlisted codes leave the server. Provider messages may contain keys
 // or request content, and must never be forwarded to the browser.
 let data:Record<string,unknown>={};try{const parsed=await response.json();if(parsed&&typeof parsed==='object')data=parsed as Record<string,unknown>;}catch{}
 const value=data.detail||data.error;
 const detail=value&&typeof value==='object'?value as Record<string,unknown>:undefined;
 const candidates=[detail?.code,detail?.status,detail?.type,data?.code];
 const known=['paid_plan_required','subscription_required','quota_exceeded','insufficient_quota','insufficient_credits'];
 const code=candidates.find((c):c is string=>typeof c==='string'&&known.includes(c))||'provider_error';
 return {error:providerError(response.status,language,code),code,providerStatus:response.status};
}
export function pcmWav(pcm:Buffer){
 const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(24000,24);h.writeUInt32LE(48000,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);
}
