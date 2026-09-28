'use client';
// Booth setting and React binding for spoken answers. The setting belongs to this device, like the camera: the team
// switches it on in booth settings, where the browser asks for the microphone once, so a visitor never sees that prompt.
import {useCallback,useEffect,useLayoutEffect,useRef,useState,useSyncExternalStore} from 'react';
import {createVoiceAnswers,type ListenState} from './voice-answers-client';
import type {VoiceLanguage} from './voice-catalog';

const key='navi-voice-answers-v1',change='navi-voice-answers-change';
function subscribe(notify:()=>void){window.addEventListener('storage',notify);window.addEventListener(change,notify);return()=>{window.removeEventListener('storage',notify);window.removeEventListener(change,notify);};}
function saved(){try{return localStorage.getItem(key)==='on';}catch{return false;}}
export function useVoiceAnswersSetting(){
 const enabled=useSyncExternalStore(subscribe,saved,()=>false);
 const setEnabled=useCallback(async(on:boolean)=>{
  if(on){const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(track=>track.stop());}
  try{localStorage.setItem(key,on?'on':'off');}catch{}
  window.dispatchEvent(new Event(change));
 },[]);
 return [enabled,setEnabled] as const;
}

type Options={active:boolean;language:VoiceLanguage;keyterms:string[];onFinal:(text:string)=>void;onPartial?:(text:string)=>void};
export function useVoiceAnswers({active,language,keyterms,onFinal,onPartial}:Options){
 const [state,setState]=useState<ListenState>('off'),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const indicator=useRef<HTMLElement|null>(null);
 const output=useRef({onFinal,onPartial});
 useLayoutEffect(()=>{output.current={onFinal,onPartial};},[onFinal,onPartial]);
 const controller=useRef<ReturnType<typeof createVoiceAnswers>|null>(null);
 const client=useCallback(()=>controller.current||=createVoiceAnswers({
  onState:(next,reason)=>{setState(next);setError(reason);},
  onFinal:text=>output.current.onFinal(text),
  onPartial:text=>output.current.onPartial?.(text),
  // The level goes straight to the indicator's style, without re-rendering the page ten times a second.
  onLevel:level=>indicator.current?.style.setProperty('--listen-level',Math.min(1,level*8).toFixed(2)),
 }),[]);
 const terms=keyterms.join('\n');
 useEffect(()=>{
  if(!active)return;
  const current=client();
  void current.start(language,terms.split('\n').filter(Boolean));
  // Leaving the questions, closing settings or unmounting stops the microphone. Development remounts reuse the client.
  return()=>current.stop();
 },[active,language,terms,client,attempt]);
 const bindIndicator=useCallback((node:HTMLElement|null)=>{indicator.current=node;},[]);
 const naviSpeaking=useCallback((speaking:boolean)=>controller.current?.naviSpeaking(speaking),[]);
 // After a failure, only an explicit tap starts listening again; there are no automatic reconnects.
 const restart=useCallback(()=>setAttempt(value=>value+1),[]);
 return {state,error,bindIndicator,naviSpeaking,restart};
}
