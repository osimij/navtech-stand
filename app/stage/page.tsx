"use client";
import {useEffect,useRef,useState} from 'react';
import { NavTechLogo } from '@/components/brand';
import Link from 'next/link';
import {ArrowRight,Hand,Pause,Play,RotateCcw,SlidersHorizontal} from 'lucide-react';
import Mascot from '../mascot';
import {demoQueue,caseStage,type DemoLanguage} from '@/lib/hiring-demo';
import {stageCopy} from '@/lib/stage-copy';
import {createStageLoop,watchStageEnvironment} from '@/lib/stage-loop';
import './stage.css';

const before=demoQueue(null),after=demoQueue('week');
export default function Stage(){
 const [language,setLanguage]=useState<DemoLanguage>('ru'),[beat,setBeat]=useState(0),[playing,setPlaying]=useState(false),[manual,setManual]=useState(false),[reduced,setReduced]=useState(false),[controls,setControls]=useState(false);
 const loop=useRef<ReturnType<typeof createStageLoop>|null>(null);
 const c=stageCopy[language],still=manual||reduced;
 useEffect(()=>{
  const player=createStageLoop(state=>{setBeat(state.beat);setPlaying(state.playing);});loop.current=player;
  const query=matchMedia('(prefers-reduced-motion: reduce)');
  const release=watchStageEnvironment(player,document,query,value=>{setReduced(value);if(value)setControls(true);});
  return()=>{loop.current=null;release();player.dispose();};
 },[]);
 return <div className={`stage-page ${controls?'stage-controls-open':''} ${still?'stage-still':''}`} lang={language}>
  <header className="stage-header"><div className="stage-brand"><NavTechLogo/><span className="visually-hidden">NavTech</span></div><span className="stage-sample">{c.sample}</span></header>
  <main className={`stage-scene stage-beat-${beat}`} aria-label={c.beats[beat]}>
   <div className="stage-copy" key={`${beat}-${language}`}>
    <p className="stage-product">{beat===0?'HR-Agent × Prism':beat===1?'HR-Agent':beat===2?'Prism':'HR-Agent × Prism'}</p>
    <h1>{beat===0?c.question:beat===1?c.action:beat===2?c.metric:c.try}</h1>
    {beat===0&&<p className="stage-support">{c.missing}</p>}
    {beat===2&&<p className="stage-support">{c.insight}</p>}
    {beat===3&&<p className="stage-invite"><Hand aria-hidden="true"/>{c.invite}</p>}
   </div>
   <div className="stage-proof" key={beat}>
    {beat===0?<div className="stage-unknown"><span className="stage-count">{before.counts.clarify}<small>{c.of} {before.total}</small></span><p>{c.metric}</p></div>:beat===1?<div className="stage-clarification"><span className="stage-case">HR-04</span><span className="stage-week">{c.answer}</span><span className="stage-rule-line">{c.beats[1]}</span></div>:beat===2?<div className="stage-insight"><div className="stage-count-change"><span><small>{c.before}</small>{before.counts.clarify}</span><ArrowRight aria-hidden="true"/><span><small>{c.after}</small>{after.counts.clarify}<em>{c.of} {after.total}</em></span></div><div className="stage-six" aria-hidden="true">{after.rows.map(row=><i className={caseStage(row)==='clarify'?'needs-answer':''} key={row.id}/>)}</div></div>:<div className="stage-navi" aria-hidden="true"><Mascot active={false} hint="" label="Navi"/></div>}
   </div>
  </main>
  <footer className="stage-footer"><span>{beat===3?'HR-Agent × Prism':c.invite}</span><div className="stage-dots" aria-label={c.settings}>{c.beats.map((label,i)=><button key={label} aria-label={label} aria-pressed={i===beat} onClick={()=>loop.current?.select(i)}><span/>{i+1}</button>)}</div><button className="stage-control-toggle" aria-expanded={controls} onClick={()=>setControls(v=>!v)}><SlidersHorizontal size={18}/>{c.settings}</button></footer>
  {controls&&<section className="stage-controls" aria-label={c.settings}>
   <p>{c.preview}</p><p role="status">{reduced?c.reduced:playing?c.running:c.paused}</p>
   <div className="stage-control-row"><button disabled={still} onClick={()=>playing?loop.current?.pause():loop.current?.play()}>{playing?<Pause size={18}/>:<Play size={18}/>} {playing?c.pause:c.play}</button><button onClick={()=>loop.current?.replay(!still&&!document.hidden)}><RotateCcw size={18}/>{c.replay}</button><label><input type="checkbox" checked={manual} onChange={e=>{setManual(e.target.checked);loop.current?.pause();}}/>{c.manual}</label><label>{c.language}<select value={language} onChange={e=>{loop.current?.pause();setLanguage(e.target.value === 'en' ? 'en' : 'ru');}}><option value="ru">Русский</option><option value="en">English</option></select></label></div>
   <p className="stage-operator-fact">{c.notBooked.replace('5',String(after.total-after.counts.scheduled)).replace('6',String(after.total))}</p><nav><Link href="/demo" prefetch={false}>{c.demo}</Link><Link href="/screen" prefetch={false}>{c.analytics}</Link></nav>
  </section>}
 </div>;
}
