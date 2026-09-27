import {createLiveVoice} from './live-pcm-client.ts';
import {createTtsNarration} from './tts-narration-client.ts';
import {savedNarrator} from './voice-catalog.ts';
import type {VoiceOptions} from './voice-options';
import type {VoiceLanguage,CreativeAction} from './live';
import type {GameContext} from './live-game';
import type {DemoContext} from './live-demo';
export function createBoothVoice(callbacks:Parameters<typeof createLiveVoice>[0],factories={live:createLiveVoice,tts:createTtsNarration}){
 const live=factories.live(callbacks),tts=factories.tts(callbacks);let useTts=false;
 return {
  start(language:VoiceLanguage,action?:CreativeAction,options?:VoiceOptions){
   const selection=savedNarrator(language);useTts=Boolean(options?.narration);
   return useTts?tts.start(language,selection):live.start(language,action,options);
  },
  updateGame(game:GameContext){live.updateGame(game);tts.updateGame(game);},
  updateDemo(demo:DemoContext){live.updateDemo(demo);},
  stop(){if(useTts)tts.stop();else live.stop();},
  greet(){if(useTts)tts.greet();else live.greet();},
  creative(action:CreativeAction){if(!useTts)live.creative(action);},
  resumePlayback(){if(useTts)tts.resumePlayback();else live.resumePlayback();},
  dispose(){live.dispose();tts.dispose();},
 };
}
