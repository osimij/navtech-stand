import type {MotionPoint} from './motion';
export type FaceStatus='off'|'loading'|'ready'|'unavailable';
// One worker/frame in flight. Disposing an epoch rejects both late positions and bitmaps.
export function createFaceTracker(callbacks:{status:(value:FaceStatus)=>void;face:(point:MotionPoint|null)=>void;paused:()=>boolean;video:()=>HTMLVideoElement|null},environment:{worker:()=>Worker;bitmap:(source:HTMLVideoElement)=>Promise<ImageBitmap>;now:()=>number;timestamp:()=>number}){
 let active=true,ready=false,pending=false,failed=false,lastFace=0;
 callbacks.status('loading');let worker:Worker;
 try{worker=environment.worker();}catch{callbacks.status('unavailable');callbacks.face(null);return {dispose(){active=false;}};}
 const fail=()=>{if(active&&!failed){failed=true;ready=false;pending=false;callbacks.status('unavailable');callbacks.face(null);worker.terminate();}};
 const timeout=setTimeout(fail,45000);
 worker.onerror=fail;
 worker.onmessage=({data})=>{
  if(!active||failed)return;
  if(data.type==='ready'){clearTimeout(timeout);ready=true;callbacks.status('ready');}
  if(data.type==='error'){clearTimeout(timeout);fail();}
  if(data.type==='position'){
   pending=false;if(callbacks.paused())return;
   if(data.point){lastFace=environment.now();callbacks.face(data.point);}
   else if(environment.now()-lastFace>900)callbacks.face(null);
  }
 };
 try{worker.postMessage({type:'init'});}catch{clearTimeout(timeout);fail();}
 const timer=setInterval(async()=>{
  const source=callbacks.video();
  if(!active||!ready||pending||callbacks.paused()||!source||source.readyState<2||!source.videoWidth)return;
  pending=true;let bitmap:ImageBitmap|null=null;
  try{
   bitmap=await environment.bitmap(source);
   if(!active||failed||callbacks.paused()){bitmap.close();pending=false;return;}
   worker.postMessage({type:'frame',bitmap,timestamp:environment.timestamp()},[bitmap]);bitmap=null;
  }catch{bitmap?.close();fail();}
 },125);
 return {dispose(){
  if(!active)return;active=false;clearTimeout(timeout);clearInterval(timer);callbacks.face(null);
  try{worker.postMessage({type:'dispose'});}catch{worker.terminate();}
  worker.onmessage=()=>worker.terminate();setTimeout(()=>worker.terminate(),200);
 }};
}
