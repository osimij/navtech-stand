"use client";
import {useCallback,useEffect,useImperativeHandle,useLayoutEffect,useRef,useState,type Ref} from 'react';
import {Camera,CameraOff} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {useFaceTracking} from '@/lib/use-face-tracking';
import {createLocalCamera,type LocalCameraState} from '@/lib/local-camera';
import {createArrivalGate} from '@/lib/engagement';
import type {MotionPoint} from '@/lib/motion';
import type {DemoLanguage} from '@/lib/hiring-demo';

export type DemoCameraHandle={resetVisitor:()=>void};
const copy={
 ru:{settings:'Настройки камеры',label:'Камера',active:'Камера включена',off:'Камера выключена',enable:'Включить камеру',stop:'Выключить камеру',requesting:'Подключаем камеру…',cancel:'Отменить',loading:'Настраиваем взгляд…',ready:'Нави смотрит в сторону лица',fallback:'Взгляд по камере недоступен. Нави реагирует на касания.',denied:'Доступ к камере не разрешён. Касания и голос работают отдельно.',missing:'Камера не найдена или отключена. Продолжайте касаниями.',unavailable:'Не удалось включить камеру. Продолжайте касаниями.',description:'Только положение лица, на этом устройстве. Без записи, распознавания личности и передачи изображений.',lifecycle:'Камера остаётся включённой между посетителями. Скрытие страницы выключает её; повторный запуск — только кнопкой.',handoff:'Во время разговора с командой Нави остаётся спокойным.',done:'Готово'},
 en:{settings:'Camera settings',label:'Camera',active:'Camera on',off:'Camera off',enable:'Enable camera',stop:'Turn camera off',requesting:'Connecting camera…',cancel:'Cancel',loading:'Preparing gaze…',ready:'Navi follows face position',fallback:'Camera gaze unavailable. Navi still reacts to touch.',denied:'Camera permission denied. Touch and voice work separately.',missing:'Camera missing or disconnected. Continue by touch.',unavailable:'Could not start camera. Continue by touch.',description:'Face position only, on this device. No recording, identity recognition or image transmission.',lifecycle:'Camera stays on between visitors. Hiding this page turns it off; restart only with the button.',handoff:'Navi stays still during the staff conversation.',done:'Done'},
};
export default function DemoCamera({ref,language,paused,allowArrival,onFace,onArrival}:{ref?:Ref<DemoCameraHandle>;language:DemoLanguage;paused:boolean;allowArrival:boolean;onFace:(point:MotionPoint|null)=>void;onArrival:()=>void}){
 const video=useRef<HTMLVideoElement>(null),controller=useRef<ReturnType<typeof createLocalCamera>|null>(null);
 const [state,setState]=useState<LocalCameraState>({phase:'off'}),[open,setOpen]=useState(false),[epoch,setEpoch]=useState(0);
 const gate=useRef(createArrivalGate()),latest=useRef({onFace,onArrival,allowArrival,paused,open});
 useLayoutEffect(()=>{latest.current={onFace,onArrival,allowArrival,paused,open};},[onFace,onArrival,allowArrival,paused,open]);
 const clear=useCallback(()=>{gate.current.resetArrival();latest.current.onFace(null);},[]);
 const getCamera=useCallback(()=>controller.current||=createLocalCamera({state:setState,clear},{
  request:()=>navigator.mediaDevices?.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false})??Promise.reject(new Error('unavailable')),
  attach:async stream=>{if(video.current){video.current.srcObject=stream;if(stream)await video.current.play();}},
 }),[clear]);
 useEffect(()=>{
  const camera=getCamera(),hide=()=>{if(document.hidden)camera.stop();};document.addEventListener('visibilitychange',hide);
  return()=>{camera.dispose();controller.current=null;document.removeEventListener('visibilitychange',hide);};
 },[getCamera]);
 useImperativeHandle(ref,()=>({resetVisitor(){getCamera().resetVisitor();setEpoch(e=>e+1);}}),[getCamera]);
 useEffect(()=>{if(paused)clear();},[paused,clear]);
 const tracking=useFaceTracking(state.phase==='active',paused||open,video,point=>{
  if(latest.current.paused||latest.current.open)return;
  latest.current.onFace(point);
  if(gate.current.observe(Boolean(point),Date.now())&&latest.current.allowArrival){gate.current.invited(Date.now());latest.current.onArrival();}
 },epoch);
 const c=copy[language],active=state.phase==='active',busy=state.phase==='requesting';
 const status=state.phase==='error'?c[state.error||'unavailable']:busy?c.requesting:active?tracking==='loading'?c.loading:tracking==='ready'?paused?c.handoff:c.ready:c.fallback:c.off;
 return <>
  <video ref={video} muted playsInline className="camera-processing" aria-hidden="true"/>
  {(active||busy)&&<button className="demo-camera-active" onClick={()=>getCamera().stop()} aria-label={active?c.stop:c.cancel}><CameraOff size={15}/>{active?c.active:c.requesting}</button>}
  <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className="demo-camera-trigger" aria-label={c.settings} title={c.settings}><Camera size={18}/><span>{c.label}</span></button></DialogTrigger>
   <DialogContent className="demo-camera-settings"><DialogTitle>{c.settings}</DialogTitle><DialogDescription>{c.description}</DialogDescription>
    <p className="demo-camera-status" role="status">{status}</p><p>{c.lifecycle}</p>
    <div className="demo-camera-actions"><button onClick={()=>active||busy?getCamera().stop():void getCamera().enable()}>{active?<CameraOff size={18}/>:<Camera size={18}/>} {active?c.stop:busy?c.cancel:c.enable}</button><DialogClose asChild><button>{c.done}</button></DialogClose></div>
   </DialogContent>
  </Dialog>
 </>;
}
