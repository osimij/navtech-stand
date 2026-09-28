"use client";
import {useLayoutEffect,useRef,useState,type RefObject} from 'react';
import type {MotionPoint} from './motion';
import {createFaceTracker,type FaceStatus} from './face-tracker';

export function useFaceTracking(enabled:boolean,paused:boolean,video:RefObject<HTMLVideoElement|null>,onFace?:(point:MotionPoint|null)=>void,epoch=0){
 const callback=useRef(onFace),pausedRef=useRef(paused);
 useLayoutEffect(()=>{callback.current=onFace;pausedRef.current=paused;},[onFace,paused]);
 const [status,setStatus]=useState<FaceStatus>('off');
 useLayoutEffect(()=>{
  if(!enabled)return;
  const tracker=createFaceTracker({status:setStatus,face:point=>callback.current?.(point),paused:()=>pausedRef.current||document.hidden,video:()=>video.current},{
   worker:()=>{if(typeof Worker==='undefined'||typeof createImageBitmap==='undefined')throw new Error('unavailable');return new Worker('/mediapipe/face-worker.js',{type:'module'});},
   bitmap:source=>createImageBitmap(source,{resizeWidth:320,resizeHeight:Math.round(source.videoHeight/source.videoWidth*320)}),
   now:()=>Date.now(),timestamp:()=>performance.now(),
   // Low-power panels look five times a second instead of eight: gaze stays smooth through Navi's springs.
   interval:document.documentElement.dataset.perf==='lite'?200:125,
  });
  return()=>tracker.dispose();
 },[enabled,video,epoch]);
 return enabled?status:'off';
}
