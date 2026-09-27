"use client";

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { preload } from "react-dom";
import type { CreativeAction } from "@/lib/live";
import type { MotionPoint } from "@/lib/motion";
import type { SpeechFrame } from "@/lib/use-invitation-audio";
import { boundGaze, faceCanLead, smoothGaze, touchGazeHold } from '@/lib/mascot-gaze';
import { createShuffleBag } from "@/lib/engagement";

type Mood="neutral"|"thinking"|"acknowledge"|"celebrate"|"reassuring";
type Gesture="wave"|"bow"|"lean"|"nod"|"pop"|"peek"|"celebrate"|"rise"|"pleased"|"stretch"|"ponder"|"swoop"|"shuffle"|"wink"|"boop"|"delight"|"shy"|"curious";
const pools={greet:['wave','wink','boop','shy'],answer:['nod','pop','wink','delight','peek'],result:['celebrate','rise','delight'],idle:['curious','stretch','peek','shy'],riddle:['ponder','peek'],story:['swoop','wave'],words:['shuffle','pop']} as const;
const atlas='/mascot/navi-speaking.png';
export type MascotHandle={reset:()=>void;play:(action:CreativeAction)=>void;notice:(point:MotionPoint|null)=>void;trackFace:(point:MotionPoint|null)=>void;reactTo:(x:number,y:number,bounds:DOMRect)=>void;speak:(frame:SpeechFrame)=>void};

function Piece({source,x,y,width,height,className=''}:{source:number[];x:number;y:number;width:number;height:number;className?:string}){
  const [sx,sy,sw,sh]=source;
  return <span className={`navi-eye-piece ${className}`} style={{left:`${x/512*100}%`,top:`${y/512*100}%`,width:`${width/512*100}%`,height:`${height/512*100}%`} as CSSProperties}><span className="navi-eye-crop"><img src={atlas} alt="" draggable={false} style={{width:`${1536/sw*100}%`,height:`${1024/sh*100}%`,left:`${-sx/sw*100}%`,top:`${-sy/sh*100}%`}}/></span></span>;
}

export default function Mascot({ref,mood='neutral',compact=false,active=true,onGreet,label='Подсказка Нави',hint='Нажмите для подсказки'}:{ref?:Ref<MascotHandle>;mood?:Mood;compact?:boolean;active?:boolean;onGreet?:()=>void;label?:string;hint?:string}){
  preload(atlas,{as:'image',fetchPriority:'high'});
  const anchor=useRef<HTMLButtonElement>(null),body=useRef<HTMLSpanElement>(null);
  const [gesture,setGesture]=useState<{name:Gesture;id:number}|null>(null),[blinking,setBlinking]=useState(false),[hopping,setHopping]=useState(false),[mouth,setMouth]=useState(0),[speechActive,setSpeechActive]=useState(false);
  const reduced=useRef(false),lastInput=useRef(0),sequence=useRef(0),speaking=useRef(false),level=useRef(0),gestureUntil=useRef(0);
  const faceTarget=useRef<MotionPoint|null>(null),target=useRef({x:0,y:0}),current=useRef({x:0,y:0});
  const pick=useRef(createShuffleBag<Gesture>());
  const state=useRef({active,compact,mood});
  useLayoutEffect(()=>{state.current={active,compact,mood};},[active,compact,mood]);
  const timers=useRef<{gesture?:ReturnType<typeof setTimeout>;hop?:ReturnType<typeof setTimeout>;input?:ReturnType<typeof setTimeout>}>({});

  const setTarget=useCallback((point:MotionPoint|null)=>{target.current=boundGaze(point);},[]);
  const lookAt=useCallback((x:number,y:number)=>{const rect=body.current?.getBoundingClientRect();if(rect)setTarget({x:(x-rect.left-rect.width/2)/Math.max(160,window.innerWidth*.35),y:(y-rect.top-rect.height/2)/Math.max(160,window.innerHeight*.35)});},[setTarget]);
  const perform=useCallback((kind:keyof typeof pools)=>{
    if(!state.current.active||document.hidden||reduced.current||state.current.mood==='reassuring'||(kind==='idle'&&(reduced.current||speaking.current||Date.now()<gestureUntil.current)))return;
    if(kind==='greet'&&Date.now()<gestureUntil.current)return;
    if(kind!=='idle')lastInput.current=Date.now();
    const name=pick.current(pools[kind]);setGesture({name,id:++sequence.current});
    gestureUntil.current=Date.now()+(kind==='answer'?720:1600);
    clearTimeout(timers.current.gesture);timers.current.gesture=setTimeout(()=>setGesture(null),kind==='answer'?720:1600);
  },[]);
  const recentInput=useCallback(()=>{lastInput.current=Date.now();clearTimeout(timers.current.input);timers.current.input=setTimeout(()=>setTarget(faceTarget.current),touchGazeHold);},[setTarget]);
  const cancelMotion=useCallback(()=>{clearTimeout(timers.current.gesture);clearTimeout(timers.current.hop);clearTimeout(timers.current.input);gestureUntil.current=0;setGesture(null);setHopping(false);setBlinking(false);setTarget(null);},[setTarget]);

  useImperativeHandle(ref,()=>({
    reset(){faceTarget.current=null;current.current={x:0,y:0};lastInput.current=0;speaking.current=false;level.current=0;setSpeechActive(false);setMouth(0);cancelMotion();body.current?.style.setProperty('--gaze-x','0px');body.current?.style.setProperty('--gaze-y','0px');},
    play(action){perform(action);},
    notice(point){if(point&&!compact)perform('greet');},
    trackFace(point){faceTarget.current=point;if(active&&faceCanLead(Date.now(),lastInput.current))setTarget(point);},
    speak(frame){speaking.current=frame.speaking;setSpeechActive(frame.speaking);level.current=frame.speaking?level.current*.35+frame.level*.65:0;setMouth(!frame.speaking||reduced.current?0:level.current>.27?2:level.current>.055?1:0);},
    reactTo(x,y,bounds){
      if(!active)return;recentInput();lookAt(x,y);perform('answer');
      const origin=anchor.current?.getBoundingClientRect(),node=anchor.current;
      if(origin&&node&&!reduced.current){
        const right=window.innerWidth-bounds.right>origin.width+24,left=bounds.left>origin.width+24;
        const dx=right?bounds.right+origin.width/2+10:left?bounds.left-origin.width/2-10:origin.left+origin.width/2+(x>window.innerWidth/2?24:-10);
        const dy=right||left?bounds.top+bounds.height/2:origin.top+origin.height/2;
        const cx=Math.max(origin.width/2+10,Math.min(window.innerWidth-origin.width/2-10,dx));
        const cy=Math.max(origin.height/2+10,Math.min(window.innerHeight-origin.height/2-10,dy));
        // Only every other answer uses travel. Other choices get a smaller local response.
        if(sequence.current%2===0){node.style.setProperty('--hop-x',`${cx-origin.left-origin.width/2}px`);node.style.setProperty('--hop-y',`${cy-origin.top-origin.height/2}px`);setHopping(true);clearTimeout(timers.current.hop);timers.current.hop=setTimeout(()=>setHopping(false),440);}
      }
    },
  }),[active,compact,lookAt,perform,recentInput,setTarget,cancelMotion]);

  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{if(mood==='reassuring')cancelMotion();else if(mood==='celebrate')perform('result');});
    return()=>cancelAnimationFrame(frame);
  },[mood,perform,cancelMotion]);
  useEffect(()=>{
    if(active)return;
    const frame=requestAnimationFrame(cancelMotion);return()=>cancelAnimationFrame(frame);
  },[active,cancelMotion]);
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const change=()=>{reduced.current=query.matches;if(query.matches){current.current={x:0,y:0};body.current?.style.setProperty('--gaze-x','0px');body.current?.style.setProperty('--gaze-y','0px');cancelMotion();setMouth(0);}};
    change();query.addEventListener('change',change);return()=>query.removeEventListener('change',change);
  },[cancelMotion]);
  useEffect(()=>{
    if(!active)return;
    const move=(event:PointerEvent)=>{if(event.pointerType!=='touch'){recentInput();lookAt(event.clientX,event.clientY);}};
    const touch=(event:PointerEvent)=>{recentInput();lookAt(event.clientX,event.clientY);};const reset=()=>setTarget(faceTarget.current);
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerdown',touch,{passive:true});window.addEventListener('blur',reset);document.documentElement.addEventListener('pointerleave',reset);
    return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerdown',touch);window.removeEventListener('blur',reset);document.documentElement.removeEventListener('pointerleave',reset);};
  },[active,lookAt,recentInput,setTarget]);
  useEffect(()=>{
    let frame=0;
    const animate=()=>{if(!document.hidden&&!reduced.current&&body.current){current.current=smoothGaze(current.current,target.current);const width=body.current.offsetWidth;body.current.style.setProperty('--gaze-x',`${current.current.x*width*.02}px`);body.current.style.setProperty('--gaze-y',`${current.current.y*width*.025}px`);}frame=requestAnimationFrame(animate);};
    frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
  },[]);
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>,close:ReturnType<typeof setTimeout>,idle:ReturnType<typeof setTimeout>;
    const blink=()=>{timer=setTimeout(()=>{if(state.current.active&&!reduced.current&&!document.hidden){setBlinking(true);close=setTimeout(()=>setBlinking(false),110+Math.random()*50);}blink();},3500+Math.random()*3500);};
    const rest=()=>{idle=setTimeout(()=>{if(Date.now()-lastInput.current>10000)perform('idle');rest();},8500+Math.random()*6500);};
    const visibility=()=>{if(document.hidden){cancelMotion();setMouth(0);}};
    blink();rest();document.addEventListener('visibilitychange',visibility);
    return()=>{clearTimeout(timer);clearTimeout(close);clearTimeout(idle);document.removeEventListener('visibilitychange',visibility);};
  },[perform,cancelMotion]);
  useEffect(()=>()=>{Object.values(timers.current).forEach(clearTimeout);},[]);

  const expression=mood==='reassuring'?'reassuring':gesture?.name||(mood==='thinking'?'thinking':'neutral');
  const pose=expression==='celebrate'||expression==='delight'||expression==='stretch'?2:expression==='wave'?1:0;
  const centers=pose===2?[178,326]:[182,331];
  const mouthSources=[[1085,760,85,28],[1235,750,81,47],[1374,735,107,70]];
  const mouthIndex=speechActive?mouth:expression==='celebrate'||expression==='rise'||expression==='delight'?2:expression==='wave'?1:0;
  return <button ref={anchor} type="button" className={`mascot ${compact?'mascot-compact':'mascot-hero'} ${hopping?'mascot-travelling':''}`} aria-label={label} disabled={!active} onClick={()=>{recentInput();perform('greet');onGreet?.();}}>
    <span className="mascot-motion" data-mood={expression} data-gesture={gesture?.id} aria-hidden="true"><span ref={body} className="navi-body" data-speaking={speechActive} style={{'--body-frame':`${pose*50}%`} as CSSProperties}>
      <span className="navi-body-art"/>{centers.map((x,side)=>{const closed=blinking||(expression==='wink'&&side===1);return <Piece key={side} source={closed?(side?[803,682,110,135]:[625,681,110,137]):(side?[325,698,78,99]:[116,698,78,99])} x={x} y={260} width={closed?70:46} height={closed?90:59} className={closed?'navi-lid':'navi-pupil'}/>;})}
      <Piece source={mouthSources[mouthIndex]} x={256} y={315} width={mouthIndex===2?79:72} height={[24,42,56][mouthIndex]} className="navi-mouth"/>
    </span></span>
    {!compact&&<span className="mascot-hint" aria-hidden="true">{hint}</span>}
  </button>;
}
