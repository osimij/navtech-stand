"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { NavTechLogo } from '@/components/brand';
import { ArrowRight, Download, RotateCcw, Check, ChevronDown, Mic, Square, Volume2 } from 'lucide-react';
import Mascot, { type MascotHandle } from '../mascot';
import { demoCopy, demoQueue, caseStage, choices, stages, focalId, sampleBrief, type Availability, type DemoLanguage, type DemoOrigin } from '@/lib/hiring-demo';
import { createDemoRun, type RehearsalEvent } from '@/lib/demo-rehearsal';
import { useLiveVoice } from '@/lib/use-live-voice';
import DemoCamera, { type DemoCameraHandle } from './camera';
import './demo.css';

type Phase = 'intro' | 'case' | 'result';
type Run = ReturnType<typeof createDemoRun>;
const originNames = ['staff_rehearsal','visitor','automated_test'] as const;
const localFileCopy={ru:'Файл — на этом устройстве. Для передачи посетителю нужен сотрудник.',en:'File for this device. A staff member can arrange a visitor copy.',};
const voiceCopy={ru:{start:'Поговорить',stop:'Остановить',connecting:'Подключаем…',closing:'Отключаем…',disclosure:'Голос по желанию · микрофон и OpenAI',error:'Голос недоступен. Можно продолжить касаниями или включить его снова.',resume:'Включить звук'},en:{start:'Talk to Navi',stop:'Stop voice',connecting:'Connecting…',closing:'Stopping…',disclosure:'Optional voice · microphone and OpenAI',error:'Voice is unavailable. Continue by touch or start it again.',resume:'Enable sound'},};

function downloadFile(text:string,name:string,type:string) {
  const url=URL.createObjectURL(new Blob([text],{type}));
  const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
  // A pending browser download may still be reading the URL after the click returns.
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}

export default function HiringDemo() {
  const [language,setLanguage]=useState<DemoLanguage>('ru');
  const [phase,setPhase]=useState<Phase>('intro');
  const phaseRef=useRef<Phase>('intro');
  const [choice,setChoice]=useState<Availability|null>(null);
  const choiceRef=useRef<Availability|null>(null);
  const [revision,setRevision]=useState(0), revisionRef=useRef(0);
  const [origin,setOrigin]=useState<DemoOrigin>('staff_rehearsal');
  const [filter,setFilter]=useState(false),[handoff,setHandoff]=useState(false),[hint,setHint]=useState(false),[downloaded,setDownloaded]=useState(false);
  const [staff,setStaff]=useState(false),[events,setEvents]=useState<RehearsalEvent[]>([]);
  const eventCount=events.length;
  const journal=useRef<RehearsalEvent[]>([]),run=useRef<Run|null>(null);
  const camera=useRef<DemoCameraHandle>(null);
  const mascot=useRef<MascotHandle>(null),heading=useRef<HTMLHeadingElement>(null);
  const insight=useRef<HTMLParagraphElement>(null);
  const handoffTitle=useRef<HTMLHeadingElement>(null);
  const inputAt=useRef(0),frameOne=useRef(0),frameTwo=useRef(0);
  const [caption,setCaption]=useState('');
  const voiceOwner=useRef<{recorder:Run;attempt:number;startedAt:number;sequence:number}|null>(null),voiceAttempt=useRef(0);
  const voice=useLiveVoice(frame=>mascot.current?.speak(frame),setCaption,undefined,(event)=>{
    const owner=voiceOwner.current;if(!owner)return;
    const type=event==='session.started'?'voice_ready':event==='audio.signal'?'voice_first_audio':event==='audio.interrupted'?'voice_interrupted':event==='stop'?'voice_stop_requested':event==='provider.error'||event==='start.failed'?'voice_failed':null;
    if(type)owner.recorder.record(type,revisionRef.current,{voice_attempt:owner.attempt,...(type==='voice_interrupted'?{sequence:++owner.sequence}:{}),...(['voice_ready','voice_first_audio'].includes(type)?{duration_ms:Math.round(performance.now()-owner.startedAt)}:{})});
  });
  const stopVoice=voice.stop,updateDemo=voice.updateDemo;
  const c=demoCopy[language], queue=demoQueue(choice), currentStage=caseStage(queue.rows.find(row=>row.id===focalId)!);
  const v=voiceCopy[language];
  const cancelMeasurement=useCallback(()=>{cancelAnimationFrame(frameOne.current);cancelAnimationFrame(frameTwo.current);},[]);

  const reset=useCallback(()=>{
    stopVoice();voiceOwner.current=null;setCaption('');voiceAttempt.current=0;camera.current?.resetVisitor();mascot.current?.reset();
    cancelMeasurement();run.current?.end();run.current=null;
    phaseRef.current='intro';choiceRef.current=null;revisionRef.current=0;
    setPhase('intro');setChoice(null);setRevision(0);setFilter(false);setHandoff(false);setHint(false);setDownloaded(false);
  },[cancelMeasurement,stopVoice]);
  useEffect(()=>()=>{cancelMeasurement();run.current?.dispose();},[cancelMeasurement]);
  useEffect(()=>{updateDemo({kind:'hiring',phase:handoff?'handoff':phase,choice,revision,language});},[updateDemo,phase,choice,revision,language,handoff]);
  useEffect(()=>{const hide=()=>{if(document.hidden)stopVoice();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[stopVoice]);
  useEffect(()=>{if(voice.phase==='idle'||voice.phase==='error'){const owner=voiceOwner.current;if(voice.phase==='error')owner?.recorder.record('voice_failed',revisionRef.current,{voice_attempt:owner.attempt});owner?.recorder.record('voice_ended',revisionRef.current,{voice_attempt:owner.attempt});}},[voice.phase]);
  useEffect(()=>{if(handoff){handoffTitle.current?.focus({preventScroll:true});handoffTitle.current?.scrollIntoView({block:'center',behavior:'instant'});}},[handoff]);

  useEffect(()=>{
    heading.current?.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  },[phase]);

  useEffect(()=>{
    if(phase!=='result')return;
    const owner=run.current, measuredRevision=revision;
    const measure=()=>{
      cancelMeasurement();
      frameOne.current=requestAnimationFrame(()=>{
        frameTwo.current=requestAnimationFrame(()=>{
          const rect=heading.current?.getBoundingClientRect();
          if(document.hidden||owner!==run.current||phaseRef.current!=='result')return;
          const duration_ms=Math.round((performance.now()-inputAt.current)*100)/100;
          if(rect&&rect.top>=0&&rect.bottom<=window.innerHeight){
            owner?.record('first_value_visible',measuredRevision);
            owner?.record('result_visible',measuredRevision,{duration_ms,choice:choiceRef.current!});
          }
          const insightRect=insight.current?.getBoundingClientRect();
          if(insightRect&&insightRect.top>=0&&insightRect.bottom<=window.innerHeight)owner?.record('demo_completed',measuredRevision);
        });
      });
    };
    measure();document.addEventListener('visibilitychange',measure);window.addEventListener('scroll',measure,{passive:true});
    return()=>{cancelMeasurement();document.removeEventListener('visibilitychange',measure);window.removeEventListener('scroll',measure);};
  },[phase,revision,cancelMeasurement]);

  function ensureRun(){
    if(!run.current)run.current=createDemoRun({sessionId:crypto.randomUUID(),language,origin,now:()=>performance.now(),iso:()=>new Date().toISOString(),append:event=>{
      journal.current=[...journal.current,event].slice(-500);setEvents(journal.current);
    }});
    return run.current;
  }
  function toggleVoice(){
    if(voice.busy){stopVoice();setCaption('');return;}
    const recorder=ensureRun();const attempt=++voiceAttempt.current;
    voiceOwner.current={recorder,attempt,startedAt:performance.now(),sequence:0};
    recorder.record('voice_requested',revisionRef.current,{voice_attempt:attempt});setCaption('');
    updateDemo({kind:'hiring',phase:handoff?'handoff':phase,choice,revision,language});
    void voice.start(language);
  }
  function start() {
    if(phaseRef.current!=='intro')return;
    ensureRun();
    run.current!.record('demo_started');phaseRef.current='case';setPhase('case');setHint(false);
  }
  function choose(next:Availability,event:MouseEvent<HTMLButtonElement>) {
    if(phaseRef.current==='intro'||choiceRef.current===next)return;
    inputAt.current=event.timeStamp;choiceRef.current=next;
    const nextRevision=++revisionRef.current;
    run.current?.record('case_changed',nextRevision,{choice:next});
    const rect=event.currentTarget.getBoundingClientRect();
    mascot.current?.reactTo(event.detail?event.clientX:rect.left+rect.width/2,event.detail?event.clientY:rect.top+rect.height/2,rect);
    setChoice(next);setRevision(nextRevision);setDownloaded(false);setHint(false);
    phaseRef.current='result';setPhase('result');
    window.scrollTo({top:0,behavior:'instant'});
  }
  function exportBrief() {
    if(!choice)return;
    downloadFile(sampleBrief(language,choice),'navtech-sample-pilot.md','text/markdown;charset=utf-8');
    run.current?.record('brief_download_requested',revisionRef.current,{choice});setDownloaded(true);
  }
  function openHandoff() {
    // The human expert now owns the conversation. Closing this panel never restarts voice.
    stopVoice();setCaption('');
    run.current?.record('handoff_clicked',revisionRef.current);setHandoff(true);
  }
  const naviText=phase==='intro'?c.naviIntro:phase==='case'?c.naviCase:choice==='week'?c.naviWeek:choice==='month'?c.naviMonth:c.naviUnknown;
  const visibleRows=filter?queue.rows.filter(row=>caseStage(row)==='clarify'):queue.rows;

  return <div className="hiring-demo" lang={language}>
    <header className="demo-header">
      <Link href="/" prefetch={false} className="brand-lockup" aria-label="NavTech"><NavTechLogo/></Link>
      <div className="demo-header-tools"><DemoCamera ref={camera} language={language} paused={handoff} allowArrival={phase==='intro'&&!voice.busy} onFace={point=>mascot.current?.trackFace(point)} onArrival={()=>mascot.current?.notice({x:0,y:0})}/><span className="demo-sample"><span/>{c.sample}</span>
        <label className="demo-language"><span className="sr-only">{c.language}</span><select value={language} disabled={phase!=='intro'||voice.busy} onChange={event=>{reset();setLanguage(event.target.value === 'en' ? 'en' : 'ru');}}><option value="ru">Русский</option><option value="en">English</option></select></label>
        <button className={`demo-voice-button ${voice.busy?'is-active':''}`} onClick={toggleVoice} disabled={voice.phase==='closing'} aria-label={voice.busy?v.stop:v.start} aria-pressed={voice.busy}>{voice.busy?<Square size={15}/>:<Mic size={17}/>}<span>{voice.phase==='connecting'?v.connecting:voice.phase==='closing'?v.closing:voice.busy?v.stop:v.start}</span></button>
        {phase!=='intro'&&<button className="demo-reset" onClick={reset} title={c.reset}><RotateCcw size={18}/><span>{c.reset}</span></button>}
      </div>
    </header>

    <main className={`demo-main demo-phase-${phase}`}>
      {voice.phase==='error'&&<p className="demo-voice-status" role="status">{v.error}</p>}
      {voice.playbackBlocked&&voice.busy&&<button className="demo-download" onClick={voice.resumePlayback}><Volume2 size={18}/>{v.resume}</button>}
      {phase==='intro'?<section className="demo-intro">
        <Mascot ref={mascot} label={c.navi} hint={c.hint} onGreet={()=>setHint(value=>!value)}/>
        <h1 ref={heading} tabIndex={-1}>{c.intro}</h1>
        <p className="demo-intro-copy">{c.sub}</p>
        <button className="demo-primary" onClick={start}>{c.start}<ArrowRight size={20}/></button>
        <p className="demo-products">HR-Agent <ArrowRight size={14}/> Prism</p>
        <p className="demo-mode">{v.disclosure}</p>
        {voice.busy&&caption&&<p className="demo-live-caption" aria-live="polite">{caption}</p>}
        {hint&&<p className="demo-navi-note" role="status">{naviText}</p>}
      </section>:<>
        <div className="demo-companion"><Mascot key="working" ref={mascot} compact active={!handoff} mood={handoff?'neutral':phase==='result'&&choice!=='unknown'?'celebrate':'thinking'} label={c.navi} onGreet={()=>{setHint(value=>!value);if(voice.phase==='ready')voice.greet();}}/><div><span>Navi</span><p className={voice.busy&&caption?'demo-speaking-caption':''}>{voice.busy&&caption?caption:hint?naviText:phase==='case'?c.missing:c.actions[choice!]}</p></div></div>
        {phase==='case'?<section className="demo-case">
          <div className="demo-product-label">{c.step}</div>
          <h1 ref={heading} tabIndex={-1}>{c.caseTitle}</h1>
          <div className="demo-source-card"><span className="demo-case-id">{c.caseId} · {focalId}</span>
            <dl>{c.sourceFacts.map((fact,i)=><div key={i} className={i===2?'demo-missing-fact':''}><dt>{c.factLabels[i]}</dt><dd>«{fact}»</dd></div>)}</dl>
          </div>
          <fieldset className="demo-choices"><legend>{c.pick}</legend>{choices.map(value=><button key={value} onClick={event=>choose(value,event)}>{c.options[value]}<ArrowRight size={18}/></button>)}</fieldset>
        </section>:<section className="demo-result" aria-label={c.resultTitles[choice!]}>
          <h1 ref={heading} tabIndex={-1}>{c.resultTitles[choice!]}</h1>
          <div className="demo-proof-grid">
            <section className="demo-hr-result" aria-label="HR-Agent">
              <div className="demo-panel-label"><span>HR-Agent</span><span>{focalId}</span></div>
              <h2>{c.stageLabels[currentStage]}</h2>
              <dl className="demo-brief-facts">{c.sourceFacts.slice(0,2).map((fact,i)=><div key={i}><dt>{c.factLabels[i]}</dt><dd>{fact}</dd></div>)}<div className="demo-new-fact"><dt>{c.clarification}</dt><dd><Check size={16}/>{c.options[choice!]}</dd></div></dl>
              <p className="demo-human-note">{c.resultNote}</p>
              <details className="demo-evidence"><summary>{c.evidence}<ChevronDown size={16}/></summary><p>{c.sourceTitle}</p><dl>{c.sourceFacts.map((fact,i)=><div key={i}><dt>{c.factLabels[i]}</dt><dd>«{fact}»</dd></div>)}</dl><p>{c.preserved}</p></details>
            </section>
            <section className="demo-prism-result" aria-label="Prism">
              <div className="demo-panel-label"><span>Prism</span><span>{c.sample}</span></div>
              <h2>{c.prismTitle}</h2>
              <div className="demo-delta"><span><small>{c.before}</small>3</span><ArrowRight size={24}/><span className="demo-delta-after"><small>{c.after}</small>{queue.counts.clarify}<em> / {queue.total}</em></span><p>{c.change}</p></div>
              <div className="demo-bar-chart" role="img" aria-label={stages.map(stage=>`${c.stageLabels[stage]}: ${queue.counts[stage]} / ${queue.total}`).join('; ')}>
                {stages.map(stage=><div key={stage} className={`demo-bar-row ${stage===currentStage?'demo-bar-selected':''}`}><span>{c.stageLabels[stage]}</span><div className="demo-bar-track"><i style={{width:`${queue.counts[stage]/queue.total*100}%`}}/></div><b>{queue.counts[stage]}</b></div>)}
              </div>
              <p className="demo-denominator">{queue.total} {c.denominator} · {focalId} <ArrowRight size={12}/> {c.stageLabels[currentStage]}</p>
              <p className="demo-insight" ref={insight}>{queue.counts.clarify<3?c.insightReduced:c.insightSame}</p>
            </section>
          </div>
          <fieldset className="demo-revise"><legend>{c.revise}</legend><div>{choices.map(value=><button key={value} aria-pressed={choice===value} onClick={event=>choose(value,event)}>{choice===value&&<Check size={15}/>} {c.options[value]}</button>)}</div></fieldset>
          <details className="demo-queue-details"><summary>{c.queue}<span>{queue.total}<ChevronDown size={16}/></span></summary><button className="demo-text-button" aria-pressed={filter} onClick={()=>setFilter(value=>!value)}>{filter?c.all:c.explore}</button><ul>{visibleRows.map(row=><li key={row.id} className={row.id===focalId?'demo-highlight-row':''}><span>{row.id}{row.id===focalId&&<small>{choice==='unknown'?c.unchanged:c.youChanged}</small>}</span><span>{c.stageLabels[caseStage(row)]}</span></li>)}</ul></details>
          <section className="demo-next"><div><h2>{c.pilot}</h2><p>{c.pilotText}</p></div><div className="demo-next-actions"><button className="demo-primary" onClick={openHandoff}>{c.handoff}<ArrowRight size={18}/></button><button className="demo-download" onClick={exportBrief}><Download size={17}/>{c.download}</button></div></section>
          <p className="demo-local-copy">{localFileCopy[language]}</p>
          {downloaded&&<p className="demo-download-status" role="status">{c.downloadDone}</p>}
          {handoff&&<section className="demo-handoff" aria-label={c.handoffTitle}><h2 ref={handoffTitle} tabIndex={-1}>{c.handoffTitle}</h2><p>{c.handoffText}</p><strong>{c.notSent}</strong><button className="demo-text-button" onClick={()=>{setHandoff(false);heading.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}}>{c.close}</button></section>}
        </section>}
      </>}
      <p className="demo-rule">{c.rule}</p>
    </main>

    <footer className="demo-footer"><Link href="/" prefetch={false}>{c.backQuiz}</Link><Link href="/screen" prefetch={false}>{c.liveBooth}</Link><button onClick={()=>setStaff(value=>!value)} aria-expanded={staff}>{c.staff}<ChevronDown size={14}/></button></footer>
    {staff&&<aside className="demo-staff"><h2>{c.staffTitle}</h2><p>{c.staffNote}</p><label>{c.origin}<select value={origin} disabled={phase!=='intro'||voice.busy} onChange={event=>{reset();setOrigin(event.target.value as DemoOrigin);}}>{originNames.map(name=><option value={name} key={name}>{c.origins[name]}</option>)}</select></label><p>{eventCount} events · max 500</p><button className="demo-download" disabled={!eventCount} onClick={()=>downloadFile(JSON.stringify({schema:'navtech-rehearsal-v1',timing_method:'result: input to two animation frames after React commit, visible viewport; voice: explicit voice tap to readiness/played signal; performance.now',not_a_conversion_measure:true,events:journal.current},null,2),'navtech-rehearsal.json','application/json')}><Download size={16}/>{c.export}</button>{eventCount?<div className="demo-log"><table><thead><tr><th>Event</th><th>Revision</th><th>Elapsed ms</th><th>Duration ms</th></tr></thead><tbody>{events.map(event=><tr key={event.event_id}><td>{event.event_type}</td><td>{event.revision}</td><td>{event.elapsed_ms}</td><td>{event.duration_ms??'—'}</td></tr>)}</tbody></table><details><summary>JSON</summary><pre>{JSON.stringify(events,null,2)}</pre></details></div>:<p>{c.noEvents}</p>}</aside>}
  </div>;
}
