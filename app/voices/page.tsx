'use client';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import Link from 'next/link';
import {Header} from '../shell';
import {auditionTexts,voiceModels,providerNames,providerKeys,modelById,saveNarrator,type CatalogVoice,type VoiceLanguage,type VoiceProvider} from '@/lib/voice-catalog';
import {useNarratorPreference} from '@/lib/use-voice-preference';

type Sample={url:string;seconds?:number;cached?:boolean};
type Providers=Record<VoiceProvider,boolean>;
const englishNotes:Record<string,string>={
 eleven_multilingual_v2:'Start here: steady, expressive speech. Choose a voice native to the target language.',
 eleven_v4_turbo:'Booth voice: fast response with lively intonation. Russian and English.',
 eleven_v3:'More expressive. Listen for warmth without theatrical delivery.',
 eleven_flash_v2_5:'Compare responsiveness and natural delivery during touch interactions.',
 'sonic-3.6':'A candidate for conversational pacing. Load voices for the selected language.',
 'sonic-3':'An earlier generation for comparing tone and intonation.',
 'gpt-4o-mini-tts-2025-12-15':'Prompted conversational delivery. 13 voices, including Fable, Nova and Onyx.',
 'gpt-4o-mini-tts-2025-03-20':'Early snapshot. Model and voice access is checked when you generate a sample.',
 'tts-1-hd':'Classic high-quality family. Compare Fable, Nova and Onyx.',
 'tts-1':'Classic base family as another point of comparison.',
 'gpt-realtime-1.5':'The existing Realtime engine. 20 previously recorded samples.',
};
const initialProviders:Providers={openai:false,elevenlabs:false,cartesia:false};
const providers:VoiceProvider[]=['elevenlabs','cartesia','openai'];
function subscribeRatings(notify:()=>void){window.addEventListener('storage',notify);window.addEventListener('navi-ratings',notify);return()=>{window.removeEventListener('storage',notify);window.removeEventListener('navi-ratings',notify);};}
const ratingSnapshot=()=>{try{return localStorage.getItem('navi-voice-ratings-v1')||'{}';}catch{return '{}';}};
const emptyRatings=()=>'{}';
const titleCase=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
export default function Voices(){
 const [language,setLanguage]=useState<VoiceLanguage>('ru');
 const [provider,setProvider]=useState<VoiceProvider>('elevenlabs');
 const [modelId,setModelId]=useState('eleven_multilingual_v2');
 const [phrase,setPhrase]=useState<keyof typeof auditionTexts>('welcome');
 const [configured,setConfigured]=useState<Providers>(initialProviders);
 const [checked,setChecked]=useState(false),[error,setError]=useState('');
 const [remoteVoices,setRemoteVoices]=useState<CatalogVoice[]>([]),[cursor,setCursor]=useState(''),[query,setQuery]=useState('');
 const [loading,setLoading]=useState(false),[pending,setPending]=useState('');
 const [samples,setSamples]=useState<Record<string,Sample>>({});
 const [failedVoices,setFailedVoices]=useState<Record<string,boolean>>({});
 const [playing,setPlaying]=useState(''),[loaded,setLoaded]=useState(false);
 const [customVoice,setCustomVoice]=useState('');
 const [keyValue,setKeyValue]=useState(''),[savingKey,setSavingKey]=useState(false),[keyNotice,setKeyNotice]=useState('');
 const ratingStore=useSyncExternalStore(subscribeRatings,ratingSnapshot,emptyRatings);
 let ratings:Record<string,string>={};try{ratings=JSON.parse(ratingStore)||{};}catch{}
 const player=useRef<HTMLAudioElement>(null),request=useRef<AbortController|null>(null),listing=useRef<AbortController|null>(null),objectEpoch=useRef(0);
 const selected=useNarratorPreference(language),model=modelById(modelId)!,en=language==='en';
 const localModels=voiceModels.filter(m=>m.provider===provider);
 const voices:CatalogVoice[]=model.voices?model.voices.map(id=>({id,name:titleCase(id)})):remoteVoices;
 const sampleKey=(v:string)=>`${language}|${modelId}|${v}|${phrase}`;
 const ratingKey=(v:string)=>`${language}|${modelId}|${v}`;
 async function refresh(){
  try{const r=await fetch('/api/voice-lab/status');if(!r.ok)throw Error();const d=await r.json() as {providers:Providers};setConfigured(d.providers);setChecked(true);}catch{setError('Локальный голосовой сервер недоступен / Local voice server unavailable.');}
 }
 useEffect(()=>{const abort=new AbortController();fetch('/api/voice-lab/status',{signal:abort.signal}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<{providers:Providers}>;}).then(d=>{setConfigured(d.providers);setChecked(true);}).catch(()=>{if(!abort.signal.aborted)setError('Local voice server unavailable.');});fetch('/audio/voice-comparison/manifest.json',{signal:abort.signal}).then(r=>r.json() as Promise<{samples:{voice:string;language:string;file:string;seconds:number;status:string}[]}>).then(d=>{setSamples(old=>({...old,...Object.fromEntries((d.samples||[]).filter(s=>s.status==='ready').map(s=>[`${s.language}|gpt-realtime-1.5|${s.voice}|welcome`,{url:s.file,seconds:s.seconds,cached:true}]))}));}).catch(()=>{});
  fetch('/api/voice-lab/samples',{signal:abort.signal}).then(r=>r.json() as Promise<{samples:(Sample&{selection:{model:string;voice:string};language:string;sample:string})[]}>).then(d=>setSamples(old=>({...old,...Object.fromEntries((d.samples||[]).map(s=>[`${s.language}|${s.selection.model}|${s.selection.voice}|${s.sample}`,s]))}))).catch(()=>{});
  return()=>{abort.abort();request.current?.abort();listing.current?.abort();};
 },[]);
 function stop(){objectEpoch.current++;request.current?.abort();request.current=null;setPending('');player.current?.pause();setPlaying('');}
 function change(languageNext=language,modelNext=modelId){stop();listing.current?.abort();setLoading(false);setLanguage(languageNext);setModelId(modelNext);if(modelById(modelNext)?.kind==='realtime')setPhrase('welcome');setProvider(modelById(modelNext)!.provider);setRemoteVoices([]);setCursor('');setQuery('');setCustomVoice('');setError('');setLoaded(false);setKeyValue('');setKeyNotice('');}
 async function loadVoices(more=false){
  listing.current?.abort();const abort=new AbortController();listing.current=abort;setLoading(true);setError('');
  try{const params=new URLSearchParams({provider,language,search:query,...(more?{cursor}:{})});const r=await fetch(`/api/voice-lab/voices?${params}`,{signal:abort.signal});const d=await r.json() as {voices:CatalogVoice[];cursor:string;error?:string};if(!r.ok)throw Error(d.error);if(abort.signal.aborted)return;setRemoteVoices(old=>more?[...old,...d.voices.filter(v=>!old.some(o=>o.id===v.id))]:d.voices);setCursor(d.cursor);}catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Не удалось загрузить голоса.');}finally{if(!abort.signal.aborted)setLoading(false);}
 }
 async function listen(v:CatalogVoice){
  stop();const epoch=objectEpoch.current,key=sampleKey(v.id),abort=new AbortController();request.current=abort;setError('');
  try{
   let sample=samples[key];
   if(!sample){setPending(key);const r=await fetch('/api/voice-lab/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({selection:{model:modelId,voice:v.id,name:v.name},language,sample:phrase}),signal:abort.signal});const d=await r.json() as Sample&{error?:string};if(!r.ok){if(epoch===objectEpoch.current)setFailedVoices(old=>({...old,[ratingKey(v.id)]:true}));throw Error(d.error);}sample=d;if(epoch!==objectEpoch.current)return;setSamples(old=>({...old,[key]:sample}));}
   if(epoch!==objectEpoch.current||!player.current)return;
   setFailedVoices(old=>({...old,[ratingKey(v.id)]:false}));
   player.current.src=sample.url;setLoaded(true);setPlaying(key);await player.current.play();
  }catch(e){if(!abort.signal.aborted&&epoch===objectEpoch.current){setError(e instanceof Error?e.message:'Не удалось воспроизвести.');setPlaying('');}}finally{if(epoch===objectEpoch.current)setPending('');}
 }
 function hasSample(v:string,l:VoiceLanguage=language){return Object.keys(samples).some(k=>k.startsWith(`${l}|${modelId}|${v}|`));}
 function select(v:CatalogVoice){if(model.kind!=='tts')return;if(!hasSample(v.id)||failedVoices[ratingKey(v.id)])return;saveNarrator(language,{model:modelId,voice:v.id,name:v.name});}
 function rate(v:CatalogVoice,value:string){const next={...ratings,[ratingKey(v.id)]:ratings[ratingKey(v.id)]===value?'':value};try{localStorage.setItem('navi-voice-ratings-v1',JSON.stringify(next));window.dispatchEvent(new Event('navi-ratings'));}catch{}}
 async function saveKey(){setSavingKey(true);setKeyNotice('');setError('');try{const r=await fetch('/api/voice-lab/key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider,key:keyValue.trim()})});const d=await r.json() as {error?:string};if(!r.ok)throw Error(d.error);setKeyValue('');setKeyNotice(en?'Saved on this computer. Load the voices to check access.':'Сохранён на этом компьютере. Загрузите голоса, чтобы проверить доступ.');await refresh();}catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить ключ.');}finally{setSavingKey(false);}}
 const chosenModel=modelById(selected.model);
 return <div className="app-shell"><Header language={language}/><main className="voice-library voice-lab">
  <Link href="/">← {en?'Back to the booth':'К стенду'}</Link>
  <p className="demo-product-label">{en?'Navi · voice casting':'Нави · подбор голоса'}</p>
  <h1>{en?'A voice you want to hear.':'Голос, который хочется слушать.'}</h1>
  <p className="voice-lab-intro">{en?'Listen for a person talking beside you: relaxed rhythm, natural pauses, no presenter voice. Pick Russian and English separately.':'Ищем звучание живого собеседника: свободный ритм, естественные паузы, без дикторской подачи. Русский и английский выбираем отдельно.'}</p>
  <div className="welcome-language" role="group" aria-label="Язык / Language">{(['ru','en'] as const).map(l=><button key={l} aria-pressed={language===l} onClick={()=>change(l)}>{l==='ru'?'Русский':'English'}</button>)}</div>
  <div className="voice-active" role="status"><span>{en?'On the booth':'На стенде'} · {en?'English':'Русский'}</span><strong>{selected.name} <span>· {chosenModel?.name}</span></strong></div>
  <div className="voice-provider-tabs" role="group" aria-label={en?'Voice provider':'Провайдер голоса'}>{providers.map(p=><button key={p} aria-pressed={provider===p} onClick={()=>change(language,voiceModels.find(m=>m.provider===p)!.id)}>{providerNames[p]}<span>{checked?(configured[p]?(en?'Key saved':'Ключ добавлен'):(en?'Add key':'Нужен ключ')):'…'}</span></button>)}</div>
  <div className="voice-lab-controls"><label>{en?'Model / generation':'Модель / поколение'}<select value={modelId} onChange={e=>change(language,e.target.value)}>{localModels.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label>{en?'Test line':'Реплика для сравнения'}<select value={phrase} onChange={e=>{stop();setLoaded(false);setPhrase(e.target.value as keyof typeof auditionTexts);}} disabled={model.kind==='realtime'}>{(['welcome','reaction','result'] as const).map(p=><option key={p} value={p}>{({welcome:en?'Invitation':'Приглашение',reaction:en?'During the game':'По ходу игры',result:en?'Result':'Результат'})[p]}</option>)}</select></label></div>
  <p className="voice-model-note">{en?englishNotes[modelId]:model.note}</p>
  <blockquote className="voice-script">{auditionTexts[model.kind==='realtime'?'welcome':phrase][language]}</blockquote>
  <p className="fine-print">{en?'The first generation uses provider credits; repeats use the saved sample. No bulk generation. New TTS voices read curated lines during the game; Realtime samples are for comparison only; the booth uses scripted TTS.':'Первое создание расходует баланс провайдера; повторное прослушивание — из сохранённого файла. Массовой генерации нет. TTS-голоса озвучивают подготовленные реплики по ходу игры; Образцы Realtime — только для сравнения; на стенде звучит озвученный сценарий.'}</p>
  {(!configured[provider]||provider!=='openai')&&<details className="voice-key-setup" open={!configured[provider]}><summary>{en?'Connect':'Подключить'} {providerNames[provider]}</summary><form onSubmit={e=>{e.preventDefault();void saveKey();}}><label>{providerKeys[provider]}<input type="password" autoComplete="off" value={keyValue} onChange={e=>setKeyValue(e.target.value)} placeholder={en?'Paste the API key':'Вставьте API-ключ'} aria-label={`${providerNames[provider]} API key`}/></label><button disabled={savingKey||!keyValue.trim()} type="submit">{savingKey?'…':en?'Save locally':'Сохранить локально'}</button></form><p className="fine-print">{en?'Saved in .dev.vars on this computer. Never included in the website or browser storage. The key is sent only to this provider.':'Сохраняется в .dev.vars на этом компьютере. Не попадает в код сайта или хранилище браузера. Ключ используется только выбранным провайдером.'}</p>{keyNotice&&<p role="status">{keyNotice}</p>}</details>}
  {!model.voices&&configured[provider]&&<div className="voice-search"><form onSubmit={e=>{e.preventDefault();void loadVoices();}}><input aria-label={en?'Find a voice':'Поиск голоса'} placeholder={en?'Name or description':'Имя или описание голоса'} value={query} onChange={e=>setQuery(e.target.value)}/><button disabled={loading}>{loading?'…':en?'Load voices':'Загрузить голоса'}</button></form><p className="fine-print">{en?(provider==='elevenlabs'?'These models speak Russian and English. Standard voices are included in both lists; native accent is shown separately. Library voices may require a paid plan.':'Voices from your provider account, filtered by language. “Native” reflects provider metadata, not a listening verdict.'):(provider==='elevenlabs'?'Эти модели говорят по-русски и по-английски. Стандартные голоса доступны в обоих списках; родной акцент отмечен отдельно. Для голосов из библиотеки может понадобиться платный тариф.':'Голоса из каталога провайдера с фильтром языка. «Родной язык» — данные провайдера, не результат прослушивания.')}</p></div>}
  {pending&&<p role="status">{en?'Creating one sample…':'Создаю один образец…'} <button onClick={stop}>{en?'Cancel':'Отменить'}</button></p>}
  {error&&<p className="inline-error" role="alert">{error}</p>}
  <audio ref={player} controls hidden={!loaded} aria-label={en?'Voice sample':'Образец голоса'} onEnded={()=>setPlaying('')} onError={()=>{setPlaying('');setError(en?'Sample playback failed.':'Не удалось воспроизвести образец.');}}/>
  <div className="voice-library-grid">{voices.map(v=>{
   const key=sampleKey(v.id),sample=samples[key],chosen=selected.model===modelId&&selected.voice===v.id,rating=ratings[ratingKey(v.id)],canUse=model.kind==='tts'&&hasSample(v.id)&&!failedVoices[ratingKey(v.id)];
   return <section key={v.id} className={chosen?'selected':''}><div className="voice-card-heading"><h2>{v.name}</h2>{(v.standard||v.native)&&<span>{[v.standard?(en?'Standard':'Стандартный'):'',v.native?(en?'Native accent':'Родной акцент'):''].filter(Boolean).join(' · ')}</span>}</div>{v.description&&<p>{v.description}</p>}
    <p className="voice-sample-state">{sample?`${en?'Saved':'Готов'} · ${sample.seconds?.toFixed(1)} ${en?'sec':'сек'}`:en?'Not auditioned yet':'Ещё не прослушан'}</p>
    <p className="fine-print">{en?'Samples ready':'Образцы готовы'}: RU {hasSample(v.id,'ru')?'✓':'—'} · EN {hasSample(v.id,'en')?'✓':'—'}</p>
    <div className="voice-card-actions"><button disabled={Boolean(pending)||(!sample&&(!configured[provider]||model.kind==='realtime'))} onClick={()=>void listen(v)}>{playing===key?(en?'Play again':'Ещё раз'):sample?(en?'Listen':'Послушать'):(en?'Create sample':'Создать образец')}</button><button aria-pressed={chosen} disabled={!canUse||(!configured[provider]&&model.kind!=='realtime')} title={!canUse?(en?'Create a successful sample in this language first.':'Сначала создайте образец на этом языке без ошибки.'):undefined} onClick={()=>select(v)}>{chosen?(en?'On the booth ✓':'На стенде ✓'):(en?'Use on booth':'На стенд')}</button></div>
    {!canUse&&<p className="fine-print">{model.kind==='realtime'?(en?'Audition only. The booth uses scripted speech.':'Только для сравнения. На стенде используется озвученный сценарий.'):(en?'Create a sample in English before using this voice on the booth.':'Сначала создайте русский образец, затем выберите голос для стенда.')}</p>}
    <div className="voice-rating" role="group" aria-label={`${en?'Your impression':'Ваше впечатление'}: ${v.name}`}><span>{en?'Your take':'На слух'}</span><button aria-pressed={rating==='natural'} onClick={()=>rate(v,'natural')}>{en?'Natural':'Живо'}</button><button aria-pressed={rating==='robotic'} onClick={()=>rate(v,'robotic')}>{en?'Robotic':'Робот'}</button></div></section>;
  })}</div>
  {!model.voices&&configured[provider]&&cursor&&<button disabled={loading} onClick={()=>void loadVoices(true)}>{en?'More voices':'Ещё голоса'}</button>}
  {!model.voices&&configured[provider]&&<details className="voice-key-setup"><summary>{en?'Use a voice ID from your account':'Указать ID голоса из своего аккаунта'}</summary><form onSubmit={e=>{e.preventDefault();const id=customVoice.trim();if(/^[a-zA-Z0-9_-]{8,100}$/.test(id))setRemoteVoices(old=>old.some(v=>v.id===id)?old:[{id,name:id},...old]);else setError('Проверьте ID голоса / Check the voice ID.');}}><input aria-label="Voice ID" placeholder="Voice ID" value={customVoice} onChange={e=>setCustomVoice(e.target.value)}/><button>{en?'Add to comparison':'Добавить к сравнению'}</button></form></details>}
  <p className="voice-library-sources">{en?'Provider documentation':'Документация'}: <a href="https://elevenlabs.io/docs/overview/models" target="_blank" rel="noreferrer">ElevenLabs</a> · <a href="https://docs.cartesia.ai/build-with-cartesia/tts-models/latest" target="_blank" rel="noreferrer">Cartesia</a> · <a href="https://developers.openai.com/api/docs/guides/text-to-speech" target="_blank" rel="noreferrer">OpenAI</a></p>
  <p className="fine-print">{en?'AI-generated voices. No microphone. The “least robotic” winner comes from listening, not brand or model age. Test on the booth speakers.':'Голоса созданы ИИ. Микрофон не используется. Самый естественный вариант выбираем на слух, а не по бренду или возрасту модели. Финальное сравнение — на колонках стенда.'}</p>
 </main></div>;
}
