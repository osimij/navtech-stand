'use client';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { profiles } from '@/lib/quiz';
import { workContexts } from '@/lib/work-context';
import { RoleIcon, roleStyle } from './career-visuals';

export const roleName = (index: number, en: boolean) => en ? profiles[index].name : workContexts[profiles[index].id].label;

// The eight roles as one ranked list, shared by the visitor's result and Prism. Rows arrive sorted; equal values share
// a place. Rows at or above `cutoff` keep their colour and the rest stay grey. Each bar is its value over `scale`.
// With `total`, a row also shows its count and, for screen readers, its denominator. A tinted capsule slides to the
// chosen row, including when live data reorders the rows.
export function RoleRanking({rows,scale,cutoff,selected,onSelect,en,label,total}:{rows:{index:number;value:number}[];scale:number;cutoff:number;selected:number;onSelect:(index:number)=>void;en:boolean;label:string;total?:number}){
 const list=useRef<HTMLDivElement>(null);
 const [thumb,setThumb]=useState<{y:number;h:number}|null>(null);
 const [ready,setReady]=useState(false);
 const order=rows.map(row=>row.index).join();
 useLayoutEffect(()=>{
  const element=list.current; if(!element) return;
  const place=()=>{const active=element.querySelector<HTMLElement>('[aria-pressed=true]');if(active)setThumb({y:active.offsetTop,h:active.offsetHeight});};
  place();
  const frame=requestAnimationFrame(()=>setReady(true)), observer=new ResizeObserver(place);
  observer.observe(element);
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[selected,order]);
 return <div ref={list} className="rank-list" data-ready={ready||undefined} role="group" aria-label={label}>
  {thumb&&<span className="rank-thumb" aria-hidden="true" style={{...roleStyle(profiles[selected].id),transform:`translateY(${thumb.y}px)`,height:thumb.h}}/>}
  {rows.map(({index,value},position)=>{
   const place=1+rows.filter(other=>other.value>value).length;
   return <button key={index} type="button" className="rank-row" aria-pressed={selected===index} data-close={(value>0&&value>=cutoff)||undefined} onClick={()=>onSelect(index)}
    style={{...roleStyle(profiles[index].id),'--bar':scale?value/scale:0,'--order':position} as CSSProperties}>
    <span className="rank-place">{place}</span>
    <RoleIcon id={profiles[index].id} size={20}/>
    <span className="rank-body">
     <span className="rank-line"><span className="rank-name">{roleName(index,en)}</span>{total!==undefined&&<span className="rank-count">{value}<span className="visually-hidden"> {en?'of':'из'} {total}</span></span>}</span>
     <span className="rank-bar" aria-hidden="true"><span/></span>
    </span>
   </button>;
  })}
 </div>;
}
