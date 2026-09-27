export const stageDurations = [4000, 5000, 5000, 4000] as const;
export type StageState = {beat:number;playing:boolean};
// Local presentation clock only: no session, visitor or analytics events.
export function createStageLoop(onChange:(state:StageState)=>void, now=()=>performance.now()) {
  let beat=0,playing=false,disposed=false,remaining:number=stageDurations[0],startedAt=0;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const emit=()=>{if(!disposed)onChange({beat,playing});};
  const arm=()=>{startedAt=now();timer=setTimeout(()=>{if(disposed||!playing)return;beat=(beat+1)%stageDurations.length;remaining=stageDurations[beat];emit();arm();},remaining);};
  const pause=()=>{if(!playing)return;clearTimeout(timer);remaining=Math.max(0,remaining-(now()-startedAt));playing=false;emit();};
  const play=()=>{if(playing||disposed)return;playing=true;emit();arm();};
  const select=(index:number)=>{if(disposed||!Number.isInteger(index)||index<0||index>=stageDurations.length)return;pause();beat=index;remaining=stageDurations[beat];emit();};
  return {play,pause,select,replay(autoplay:boolean){select(0);if(autoplay)play();},dispose(){pause();disposed=true;clearTimeout(timer);}};
}

export function watchStageEnvironment(player:ReturnType<typeof createStageLoop>,visibility:EventTarget&{hidden:boolean},motion:EventTarget&{matches:boolean},onReduced:(value:boolean)=>void){
 const preference=()=>{onReduced(motion.matches);if(motion.matches){player.pause();player.select(2);}};
 const hide=()=>{if(visibility.hidden)player.pause();};
 preference();if(!motion.matches&&!visibility.hidden)player.play();
 visibility.addEventListener('visibilitychange',hide);motion.addEventListener('change',preference);
 return()=>{visibility.removeEventListener('visibilitychange',hide);motion.removeEventListener('change',preference);};
}
