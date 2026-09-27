export type LocalCameraState={phase:'off'|'requesting'|'active'|'error';error?:'denied'|'missing'|'unavailable'};
// Owns video resources only. No microphone, networking, recording or visitor data.
export function createLocalCamera(callbacks:{state:(state:LocalCameraState)=>void;clear:()=>void},environment:{request:()=>Promise<MediaStream>;attach:(stream:MediaStream|null)=>Promise<void>|void}){
 let stream:MediaStream|null=null,generation=0,disposed=false,phase:LocalCameraState['phase']='off';
 const emit=(state:LocalCameraState)=>{phase=state.phase;if(!disposed)callbacks.state(state);};
 const release=()=>{const old=stream;stream=null;old?.getTracks().forEach(track=>track.stop());void environment.attach(null);callbacks.clear();};
 const stop=()=>{generation++;release();emit({phase:'off'});};
 async function enable(){
  if(disposed||phase==='active'||phase==='requesting')return;
  const request=++generation;emit({phase:'requesting'});
  try{
   const media=await environment.request();
   if(disposed||request!==generation){media.getTracks().forEach(track=>track.stop());return;}
   stream=media;
   media.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>{
    if(disposed||request!==generation)return;generation++;release();emit({phase:'error',error:'missing'});
   }));
   await environment.attach(media);
   if(disposed||request!==generation)return;
   emit({phase:'active'});
  }catch(error){
   if(disposed||request!==generation)return;
   generation++;release();
   emit({phase:'error',error:error instanceof Error&&error.name==='NotAllowedError'?'denied':error instanceof Error&&error.name==='NotFoundError'?'missing':'unavailable'});
  }
 }
 return {enable,stop,resetVisitor(){callbacks.clear();if(phase==='requesting')stop();},dispose(){stop();disposed=true;}};
}
