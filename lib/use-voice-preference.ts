'use client';
import {useCallback,useSyncExternalStore} from 'react';
import {savedVoice,type RealtimeVoice} from './voice-options';
import {narratorSnapshot,defaultNarratorSnapshot,type VoiceSelection} from './voice-catalog';
const serverVoice=():RealtimeVoice=>'marin';
function subscribe(notify:()=>void){
 window.addEventListener('storage',notify);window.addEventListener('navi-voice-change',notify);
 return()=>{window.removeEventListener('storage',notify);window.removeEventListener('navi-voice-change',notify);};
}
export function useVoicePreference(language:'ru'|'en'){
 const snapshot=useCallback(()=>savedVoice(language),[language]);
 return useSyncExternalStore(subscribe,snapshot,serverVoice);
}
const serverNarrator=()=>defaultNarratorSnapshot;
export function useNarratorPreference(language:'ru'|'en'){
 const snapshot=useCallback(()=>narratorSnapshot(language),[language]);
 return JSON.parse(useSyncExternalStore(subscribe,snapshot,serverNarrator)) as VoiceSelection;
}
