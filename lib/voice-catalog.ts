import {realtimeVoices} from './voice-options.ts';

export type VoiceProvider = 'openai' | 'elevenlabs' | 'cartesia';
export type VoiceLanguage = 'ru' | 'en';
export type VoiceSelection = {model: string; voice: string; name: string};
export type CatalogVoice = {id: string; name: string; description?: string; native?: boolean; standard?: boolean};
export const speechVoices = ['alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer','verse','marin','cedar'];
export const classicVoices = ['alloy','ash','coral','echo','fable','onyx','nova','sage','shimmer'];
export const voiceModels: {id:string; provider:VoiceProvider; name:string; kind:'realtime'|'tts'; note:string; voices?:readonly string[]}[] = [
  {id:'eleven_multilingual_v2',provider:'elevenlabs',name:'Multilingual v2',kind:'tts',note:'Начните здесь: спокойная, связная речь. Подберите голос с родным русским акцентом.'},
  {id:'eleven_v3',provider:'elevenlabs',name:'Eleven v3',kind:'tts',note:'Больше выразительности. Проверьте, не звучит ли короткая реплика слишком театрально.'},
  {id:'eleven_flash_v2_5',provider:'elevenlabs',name:'Flash v2.5',kind:'tts',note:'Вариант для сравнения скорости и естественности на касаниях.'},
  {id:'sonic-3.6',provider:'cartesia',name:'Sonic 3.6',kind:'tts',note:'Кандидат для живой разговорной подачи. Голоса загружаются по выбранному языку.'},
  {id:'sonic-3',provider:'cartesia',name:'Sonic 3',kind:'tts',note:'Предыдущее поколение для сравнения тембра и интонаций.'},
  {id:'gpt-4o-mini-tts-2025-12-15',provider:'openai',name:'GPT-4o mini TTS · Dec 2025',kind:'tts',note:'Управляемая разговорная подача. 13 голосов, включая Fable, Nova и Onyx.',voices:speechVoices},
  {id:'gpt-4o-mini-tts-2025-03-20',provider:'openai',name:'GPT-4o mini TTS · Mar 2025',kind:'tts',note:'Ранняя версия. Доступность и сочетание с голосом проверяются при генерации.',voices:speechVoices},
  {id:'tts-1-hd',provider:'openai',name:'TTS-1 HD',kind:'tts',note:'Старое семейство высокого качества. Сравните Fable, Nova и Onyx.',voices:classicVoices},
  {id:'tts-1',provider:'openai',name:'TTS-1',kind:'tts',note:'Базовое старое семейство — контрольный вариант для сравнения.',voices:classicVoices},
  {id:'gpt-realtime-1.5',provider:'openai',name:'GPT-Realtime-1.5',kind:'realtime',note:'Текущий разговорный движок. 20 ранее записанных образцов.',voices:realtimeVoices},
];
export const providerNames:Record<VoiceProvider,string>={openai:'OpenAI',elevenlabs:'ElevenLabs',cartesia:'Cartesia'};
export const providerKeys:Record<VoiceProvider,string>={openai:'OPENAI_API_KEY',elevenlabs:'ELEVENLABS_API_KEY',cartesia:'CARTESIA_API_KEY'};
export const auditionTexts = {
  welcome: {ru:'Привет! Я Нави. Здесь нет правильных ответов — просто выберите, как вы подошли бы к задаче. Интересно, что получится.',en:'Hi, I’m Navi. There are no right answers here — just choose how you would approach the task. Let’s see what comes up.'},
  reaction: {ru:'Вы решили сначала разобраться в цифрах. А теперь другая ситуация: отчёт каждый раз собирают вручную. Что бы вы изменили?',en:'You chose to start with the numbers. Now, a different situation: the team puts this report together by hand every week. What would you change?'},
  result: {ru:'Вот что получилось. Ваши ответы ближе к работе с данными и поиску причин. Посмотрите на эти роли — какая задача вам интереснее?',en:'Here’s what came through. Your choices lean toward working with data and finding out why things happen. Take a look at these roles. Which task catches your interest?'},
};
export function modelById(id:unknown){return voiceModels.find(m=>m.id===id);}
export function parseVoiceSelection(value:unknown):VoiceSelection|null {
  if(!value||typeof value!=='object')return null;
  const v=value as Partial<VoiceSelection>, model=modelById(v.model);
  if(!model||typeof v.voice!=='string'||!v.voice||v.voice.length>100)return null;
  if(model.voices ? !model.voices.includes(v.voice) : !/^[a-zA-Z0-9_-]{8,100}$/.test(v.voice))return null;
  return {model:model.id,voice:v.voice,name:typeof v.name==='string'?v.name.slice(0,100):v.voice};
}
export const siennaNarrator:VoiceSelection={model:'eleven_v3',voice:'oGZR5g7rlFABaB1ZfWkI',name:'Sienna'};
export function savedNarrator(language:VoiceLanguage):VoiceSelection {
  // The scripted booth gets fresh preferences; historical Realtime choices
  // remain available to the separate conversation demo, never as a fallback.
  try {const value=JSON.parse(localStorage.getItem(`navi-scripted-voice-v1-${language}`)||'null');const parsed=parseVoiceSelection(value);if(parsed&&modelById(parsed.model)?.kind==='tts')return parsed;}catch{}
  return {...siennaNarrator};
}
export function narratorSnapshot(language:VoiceLanguage){return JSON.stringify(savedNarrator(language));}
export const defaultNarratorSnapshot=JSON.stringify(siennaNarrator);
export function saveNarrator(language:VoiceLanguage,selection:VoiceSelection){
  const valid=parseVoiceSelection(selection);if(!valid||modelById(valid.model)?.kind!=='tts')return;
  try{localStorage.setItem(`navi-scripted-voice-v1-${language}`,JSON.stringify(valid));window.dispatchEvent(new Event('navi-voice-change'));}catch{}
}
