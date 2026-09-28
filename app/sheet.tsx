'use client';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';

// A Siri-like card over the blurred page. Escape or a tap outside closes it, Tab stays inside, and focus starts on its
// first control whenever `view` changes. Children receive `dismiss`, which plays the closing motion first.
export function Sheet({labelledBy,view,style,onClose,children}:{labelledBy:string;view?:string;style?:CSSProperties;onClose:()=>void;children:(dismiss:()=>void)=>ReactNode}){
 const [closing,setClosing]=useState(false);
 const panel=useRef<HTMLElement>(null);
 useEffect(()=>{panel.current?.querySelector<HTMLElement>('button,summary,a[href]')?.focus();panel.current?.scrollTo({top:0});},[view]);
 function dismiss(){
  if(closing)return;
  setClosing(true);
  setTimeout(onClose,window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:180);
 }
 function keep(event:KeyboardEvent){
  if(event.key==='Escape'){event.stopPropagation();dismiss();return;}
  if(event.key!=='Tab'||!panel.current)return;
  const items=[...panel.current.querySelectorAll<HTMLElement>('button,summary,a[href]')];
  const edge=event.shiftKey?items[0]:items[items.length-1];
  if(document.activeElement===edge){event.preventDefault();(event.shiftKey?items[items.length-1]:items[0])?.focus();}
 }
 return <div className={`role-sheet-layer ${closing?'is-closing':''}`} onKeyDown={keep} onPointerDown={event=>{if(event.target===event.currentTarget)dismiss();}}>
  <section ref={panel} className="role-sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy} style={style}>{children(dismiss)}</section>
 </div>;
}
