'use client';
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, X } from "@/components/icons";
import { profiles, questions, scoreAnswers, roleEvidence, type QuizLanguage } from '@/lib/quiz';
import { workContexts, englishWorkContexts } from '@/lib/work-context';
import { RoleIcon, RoleMark, roleStyle } from './career-visuals';
import { Button } from '@/components/ui/button';

const roleName = (index: number, en: boolean) => en ? profiles[index].name : workContexts[profiles[index].id].label;

// One role at a time: its mark, name and one line. The three closest matches sit beneath; the detail is one tap away.
export default function CareerResults({answers,language,onEdit,onRole}:{answers:number[];language:QuizLanguage;onEdit:(index:number)=>void;onRole:(id:string)=>void}){
 const heading=useRef<HTMLHeadingElement>(null), more=useRef<HTMLButtonElement>(null), opened=useRef(false);
 const result=scoreAnswers(answers),en=language==='en';
 const [selected,setSelected]=useState(result.index);
 const [sheet,setSheet]=useState(false);
 const role=profiles[selected],copy=en?role.en:role;
 const rank=result.top.findIndex(match=>match.index===selected);
 const kicker=result.tied&&result.top[rank].score===result.top[0].score?(en?'One of your equal matches':'Одно из равных совпадений'):rank===0?(en?'Closest to your answers':'Ближе всего к вашим ответам'):(en?'Also close to your answers':'Тоже близко к вашим ответам');
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});heading.current?.focus({preventScroll:true});},[]);
 useEffect(()=>{onRole(role.id);},[role.id,onRole]);
 // Focus returns to the button once the card is gone and the page is no longer inert.
 useEffect(()=>{if(sheet)opened.current=true;else if(opened.current)more.current?.focus();},[sheet]);
 return <div className="role-result" style={roleStyle(role.id)} data-career-result>
  <div className="role-hero" inert={sheet} aria-live="polite">
   <div className="role-hero-step" key={role.id}>
    <RoleMark id={role.id}/>
    <p className="role-kicker">{kicker}</p>
    <h1 ref={heading} tabIndex={-1} className="role-title">{roleName(selected,en)}</h1>
    <p className="role-summary">{copy.summary}</p>
   </div>
  </div>
  <div className="role-actions" inert={sheet}>
   <Button ref={more} className="primary-button role-more" onClick={()=>setSheet(true)}>{en?'About the role':'Подробнее о роли'}<ArrowRight/></Button>
   <RoleSwitch top={result.top.map(match=>match.index)} selected={selected} onSelect={setSelected} en={en}/>
  </div>
  {sheet&&<RoleSheet answers={answers} index={selected} language={language} onEdit={onEdit} onClose={()=>setSheet(false)}/>}
 </div>;
}

// A segmented control; the white thumb slides to the chosen role.
function RoleSwitch({top,selected,onSelect,en}:{top:number[];selected:number;onSelect:(index:number)=>void;en:boolean}){
 const track=useRef<HTMLDivElement>(null);
 const [thumb,setThumb]=useState<{x:number;y:number;w:number;h:number}|null>(null);
 const [ready,setReady]=useState(false);
 useLayoutEffect(()=>{
  const element=track.current; if(!element) return;
  const place=()=>{const active=element.querySelector<HTMLElement>('[aria-pressed=true]');if(active)setThumb({x:active.offsetLeft,y:active.offsetTop,w:active.offsetWidth,h:active.offsetHeight});};
  place();
  const frame=requestAnimationFrame(()=>setReady(true)), observer=new ResizeObserver(place);
  observer.observe(element);
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[selected]);
 return <div ref={track} className="role-switch" data-ready={ready||undefined} role="group" aria-label={en?'Your three closest roles':'Три ближайших направления'}>
  {thumb&&<span className="role-switch-thumb" aria-hidden="true" style={{transform:`translate(${thumb.x}px,${thumb.y}px)`,width:thumb.w,height:thumb.h}}/>}
  {top.map(index=><button key={index} type="button" aria-pressed={selected===index} onClick={()=>onSelect(index)}><RoleIcon id={profiles[index].id} size={18}/><span>{roleName(index,en)}</span></button>)}
 </div>;
}

// The detail card: why this role appeared, what the work is, its tasks and value. A second view lists the answers.
function RoleSheet({answers,index,language,onEdit,onClose}:{answers:number[];index:number;language:QuizLanguage;onEdit:(index:number)=>void;onClose:()=>void}){
 const en=language==='en',role=profiles[index],copy=en?role.en:role,work=(en?englishWorkContexts:workContexts)[role.id];
 const evidence=roleEvidence(answers,index,language),result=scoreAnswers(answers);
 const [view,setView]=useState<'role'|'answers'>('role');
 const [closing,setClosing]=useState(false);
 const panel=useRef<HTMLElement>(null), first=useRef<HTMLButtonElement>(null);
 useEffect(()=>{first.current?.focus();panel.current?.scrollTo({top:0});},[view]);
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
  <section ref={panel} className="role-sheet" role="dialog" aria-modal="true" aria-labelledby="role-sheet-title" style={roleStyle(role.id)}>
   {view==='role'?<div className="sheet-view" key="role">
    <button ref={first} type="button" className="sheet-corner" onClick={dismiss} aria-label={en?'Close':'Закрыть'}><X size={20}/></button>
    <header className="sheet-head"><RoleIcon id={role.id} size={24}/><h2 id="role-sheet-title">{roleName(index,en)}</h2><p>{copy.summary}</p></header>
    <div className="sheet-grid">
     <section><h3>{en?'Why it appeared':'Почему в вашем результате'}</h3><ul className="sheet-evidence">{evidence.map(text=><li key={text}><Check size={18}/>{text}</li>)}</ul><button type="button" className="sheet-link" onClick={()=>setView('answers')}>{en?'Review or change answers':'Посмотреть и изменить ответы'}<ArrowRight size={16}/></button></section>
     <section><h3>{en?'What the work looks like':'Какие задачи решает эта роль'}</h3><p>{copy.work}</p></section>
     <section><h3>{en?'Core tasks':'Ключевые задачи'}</h3><ul className="sheet-tasks">{work.tasks.map(task=><li key={task}>{task}</li>)}</ul></section>
     <section className="sheet-value"><h3>{en?'Value for the team':'Результат для команды'}</h3><p>{work.value}</p></section>
    </div>
    <details className="sheet-method"><summary>{en?'How the matches work':'Как получены направления'}<ChevronDown size={15}/></summary><p>{en?'Each choice adds 3 points to one role and 1 to a related role. Every role has four primary and four related opportunities across different situations. We show the three highest totals. Ties are ordered by the number of primary choices, then catalog order; the order does not establish suitability.':'Каждый выбор добавляет 3 балла одной роли и 1 смежной. У каждой роли по четыре основных и четыре смежных варианта в разных ситуациях. Показываем три наибольшие суммы. При равенстве порядок зависит от числа основных выборов, затем от порядка каталога — он не доказывает, что одна роль подходит лучше.'}</p><div>{result.top.map(match=><span key={match.index}>{roleName(match.index,en)}: {match.score} {en?'points':'баллов'}</span>)}</div><p>{en?'This is a curated exploration of preferences, not a diagnosis, skill assessment or hiring recommendation. Job requirements vary by employer.':'Это авторский способ исследовать интересы, а не диагностика, проверка навыков или рекомендация по найму. Требования к работе зависят от работодателя.'}</p></details>
   </div>:<div className="sheet-view" key="answers">
    <button ref={first} type="button" className="sheet-corner" onClick={()=>setView('role')} aria-label={en?'Back to the role':'Назад к роли'}><ArrowLeft size={20}/></button>
    <header className="sheet-head"><h2 id="role-sheet-title">{en?'Your answers':'Ваши ответы'}</h2><p>{en?'Change any answer and the result updates at once.':'Измените любой ответ — результат сразу обновится.'}</p></header>
    <ol className="sheet-answers">{questions.map((question,i)=><li key={question.id}><span>{i+1}</span><div><strong>{en?question.en:question.title}</strong><p>{en?question.options[answers[i]].en:question.options[answers[i]].text}</p></div><button type="button" onClick={()=>onEdit(i)}>{en?'Change':'Изменить'}</button></li>)}</ol>
   </div>}
  </section>
 </div>;
}
