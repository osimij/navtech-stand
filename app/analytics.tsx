'use client';
import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Refresh, X, ListChecks } from "@/components/icons";
import {taskPreviews,englishTaskPreviews} from '@/lib/work-context';
import {RoleMark,roleStyle,TaskIcon,JourneySteps} from './career-visuals';
import {RoleRanking,roleName} from './role-ranking';
import {Sheet} from './sheet';
import {Header} from './shell';
import {profiles,questions,QUIZ_VERSION,type Stats,type QuizLanguage} from '@/lib/quiz';
const empty:Stats={started:0,completed:0,leads:0,profiles:[],intents:[],interests:[],hours:[],patterns:[],legacy:{started:0,completed:0},excluded:0,version:QUIZ_VERSION,updatedAt:''};
type View='roles'|'choices';

// Prism: the result board's geometry for the whole booth. One card: every role ranked by how many tests include it,
// the chosen role open beside the list; a second view walks the eight situations one at a time. Counts always sit
// with their denominator, and the source and limits are one tap away.
export default function Analytics({language:givenLanguage,onLanguageChange,russianOnly=false}:{russianOnly?:boolean;language?:QuizLanguage;onLanguageChange?:(language:QuizLanguage)=>void}){
 const [stats,setStats]=useState(empty),[loaded,setLoaded]=useState(false),[error,setError]=useState(false),[refresh,setRefresh]=useState(0);
 const [localLanguage,setLanguage]=useState<QuizLanguage>('ru'),[view,setView]=useState<View>('roles'),[roleId,setRoleId]=useState<string|null>(null),[question,setQuestion]=useState(0);
 const [method,setMethod]=useState(false),methodButton=useRef<HTMLButtonElement>(null),opened=useRef(false);
 const language=givenLanguage||localLanguage,en=language==='en';
 useEffect(()=>{
  let active=true,pending=false;const controller=new AbortController();
  async function update(){if(pending||document.hidden)return;pending=true;try{const response=await fetch('/api/stats',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])});if(!response.ok)throw Error();const data=await response.json() as Stats;if(active){setStats(data);setLoaded(true);setError(false);}}catch(e){if(active&&(e as Error).name!=='AbortError')setError(true);}finally{pending=false;}}
  void update();const interval=setInterval(update,5000);document.addEventListener('visibilitychange',update);
  return()=>{active=false;controller.abort();clearInterval(interval);document.removeEventListener('visibilitychange',update);};
 },[refresh]);
 useEffect(()=>{if(method)opened.current=true;else if(opened.current)methodButton.current?.focus();},[method]);
 const total=stats.completed,ready=loaded&&total>0;
 const ranked=profiles.map((p,index)=>({index,value:stats.profiles.find(row=>row.profile===p.id)?.count||0})).sort((a,b)=>b.value-a.value||a.index-b.index);
 // Until someone picks a role, the pane follows the current leader.
 const selected=ranked.find(row=>profiles[row.index].id===roleId)?.index??ranked[0].index;
 const updated=stats.updatedAt?new Date(stats.updatedAt).toLocaleTimeString(en?'en-GB':'ru-RU',{timeZone:'Asia/Dushanbe',hour:'2-digit',minute:'2-digit'}):'';
 const retry=()=>setRefresh(n=>n+1);
 return <div className="app-shell visitor-shell prism-shell">
  <div className="ambient-glow" data-role={ready&&view==='roles'?profiles[selected].id:undefined} aria-hidden="true"/>
  <Header language={language} center={ready?<ViewSwitch view={view} onView={setView} en={en}/>:undefined} actions={!russianOnly&&<label className="prism-language"><span className="visually-hidden">Language / Язык</span><select value={language} onChange={e=>{const next=e.target.value==='en'?'en':'ru';setLanguage(next);onLanguageChange?.(next);}}><option value="ru">Русский</option><option value="en">English</option></select></label>}/>
  <main className="prism-main" inert={method}>
   <div className="prism-board">
    {!loaded?<div className="flow-card prism-start" role="status">
     <h1 className="flow-title">{error?(en?'Waiting for the connection':'Ждём соединение'):(en?'Loading the shared picture…':'Собираем общую картину…')}</h1>
     {error&&<button type="button" className="primary-button flow-action" onClick={retry}>{en?'Try again':'Повторить'}<Refresh/></button>}
    </div>:total===0?<div className="flow-card prism-start">
     <JourneySteps language={language}/>
     <h1 className="flow-title">{en?'The next answer starts the story.':'Общая картина начинается с ответа.'}</h1>
     <p className="flow-description">{en?'Complete the career test on the touchscreen. Role matches and choices will appear here as soon as the result is saved.':'Выберите подход к рабочим ситуациям на сенсорном экране. Направления и ответы появятся здесь после сохранения результата.'}</p>
     <Link href="/" className="primary-button flow-action">{en?'Find your directions':'Узнать свои направления'}<ArrowRight/></Link>
    </div>:view==='roles'?<RolesBoard ranked={ranked} total={total} started={stats.started} selected={selected} onSelect={index=>setRoleId(profiles[index].id)} en={en}/>
    :<ChoicesBoard stats={stats} total={total} question={question} onQuestion={setQuestion} en={en}/>}
   </div>
   <div className="prism-foot">
    {error&&loaded&&<span className="prism-offline" role="status">{en?'Connection lost: showing the last counts':'Нет связи: показаны последние данные'}<button type="button" onClick={retry}>{en?'Retry':'Повторить'}</button></span>}
    <span>{en?'Saved tests, not unique people':'Сохранённые тесты, не уникальные люди'}</span>
    {updated&&<span>{en?'Updated':'Обновлено'} {updated}</span>}
    <button ref={methodButton} type="button" onClick={()=>setMethod(true)}>{en?'Source and limits':'Источник и ограничения'}</button>
   </div>
  </main>
  {method&&<Sheet labelledBy="prism-method-title" onClose={()=>setMethod(false)}>{dismiss=><div className="sheet-view">
   <div className="sheet-bar"><button type="button" className="sheet-corner" onClick={dismiss} aria-label={en?'Close':'Закрыть'}><X size={20}/></button></div>
   <header className="sheet-head"><h2 id="prism-method-title">{en?'Source and limits':'Источник и ограничения'}</h2><p>{en?'How Prism counts the booth’s results.':'Как Prism считает результаты стенда.'}</p></header>
   <div className="sheet-prose">
    <p>{en?`Completed tests: ${total}. Started: ${stats.started}. These are saved tests, not unique people. Counts refresh every five seconds; revised answers replace the same test’s result.`:`Завершено тестов: ${total}, начато: ${stats.started}. Это сохранённые тесты, а не уникальные люди. Данные обновляются каждые пять секунд; изменение ответов обновляет тот же тест.`}</p>
    <p>{en?'A role counts when it is among a test’s three closest matches, using the same transparent mapping as the touchscreen. Every tie at third place is included, so role totals can add up to more than the number of tests. A match reflects answers, not a chosen vacancy or a measured skill.':'Роль учитывается, если входит в три ближайших направления теста, по той же открытой схеме, что на сенсорном экране. Все роли, равные третьей, включаются, поэтому сумма по ролям может превышать число тестов. Это соответствие ответам, а не выбор вакансии или оценка навыка.'}</p>
    <p>{en?`Current version: ${stats.version}. ${stats.legacy.completed} completed tests from older versions are kept separately and never rescored.`:`Текущая версия: ${stats.version}. ${stats.legacy.completed} результатов старых версий хранятся отдельно и не пересчитываются.`}{stats.excluded>0&&(en?` ${stats.excluded} invalid completed records are excluded.`:` Исключено некорректных записей: ${stats.excluded}.`)}</p>
    <p>{en?'No names, contacts, audio or camera data appear here. Answers do not measure ability, hiring demand or the views of the whole forum.':'Здесь нет имён, контактов, аудио или данных камеры. Ответы не измеряют способности, спрос на вакансии или мнение всего форума.'}</p>
   </div>
  </div>}</Sheet>}
 </div>;
}

// Two equal halves in one capsule track; the white thumb slides to the chosen view.
function ViewSwitch({view,onView,en}:{view:View;onView:(view:View)=>void;en:boolean}){
 return <div className="prism-views" data-view={view} role="group" aria-label={en?'Explore':'Исследовать'}>
  <button type="button" aria-pressed={view==='roles'} onClick={()=>onView('roles')}>{en?'Role matches':'Направления'}</button>
  <button type="button" aria-pressed={view==='choices'} onClick={()=>onView('choices')}>{en?'Answers':'Ответы на ситуации'}</button>
 </div>;
}

function RolesBoard({ranked,total,started,selected,onSelect,en}:{ranked:{index:number;value:number}[];total:number;started:number;selected:number;onSelect:(index:number)=>void;en:boolean}){
 const pane=useRef<HTMLElement>(null);
 const role=profiles[selected],copy=en?role.en:role,count=ranked.find(row=>row.index===selected)?.value||0;
 function choose(index:number){
  onSelect(index);
  // Stacked on a narrow screen, the pane sits below the list: bring it into view.
  if(window.matchMedia('(max-width: 959px)').matches)pane.current?.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 return <div className="board-card">
  <section className="board-ranking" aria-labelledby="prism-title">
   <header className="board-head">
    <p className="board-kicker">Prism · {total<10?(en?'early picture, fewer than 10 results':'первый срез, меньше 10 результатов'):(en?'live booth insights':'живая аналитика стенда')}</p>
    <h1 id="prism-title">{en?'What work sparks interest?':'Какие задачи вызывают интерес?'}</h1>
    <p>{en?`Completed tests: ${total} of ${started} started. One test counts toward several roles.`:`Завершено тестов: ${total}, начато: ${started}. Один тест учитывается в нескольких ролях.`}</p>
   </header>
   <RoleRanking rows={ranked} scale={total} cutoff={ranked[2].value} selected={selected} onSelect={choose} en={en} total={total} label={en?'Roles by number of tests, most first':'Роли по числу тестов, от большего'}/>
  </section>
  <section ref={pane} className="board-role prism-pane" style={roleStyle(role.id)} aria-label={en?'Selected role':'Выбранная роль'} aria-live="polite">
   <div className="board-role-step" key={role.id}>
    <RoleMark id={role.id}/>
    <h2 className="role-title">{roleName(selected,en)}</h2>
    <p className="role-summary">{copy.summary}</p>
    <p className="prism-number">{count}<small>/ {total}</small></p>
    <p className="prism-caption">{en?'completed tests include this role among their closest matches. A match to answers, not a chosen vacancy or a measured skill.':'завершённых тестов включают эту роль в ближайшие направления. Это соответствие ответам, а не выбор вакансии или оценка навыка.'}</p>
   </div>
   <Link href="/" className="primary-button role-more">{en?'Find your directions':'Узнать свои направления'}<ArrowRight/></Link>
  </section>
 </div>;
}

// One situation at a time: its four answers with counts, and the most chosen one (or the tie) beside them.
function ChoicesBoard({stats,total,question,onQuestion,en}:{stats:Stats;total:number;question:number;onQuestion:(index:number)=>void;en:boolean}){
 const heading=useRef<HTMLHeadingElement>(null),moved=useRef(false);
 const q=questions[question],counts=stats.patterns.find(p=>p.question===q.id)?.counts||[0,0,0,0];
 const leader=Math.max(...counts),leaders=counts.filter(n=>n===leader).length,top=counts.indexOf(leader);
 const previews=en?englishTaskPreviews:taskPreviews;
 // Stepping keeps the reader on the new situation, not on a button that may have just been disabled.
 useLayoutEffect(()=>{if(moved.current)heading.current?.focus({preventScroll:true});moved.current=true;},[question]);
 return <div className="board-card">
  <section className="board-ranking" aria-labelledby="prism-title">
   <header className="board-head prism-step">
    <div className="prism-step-bar">
     <p className="board-kicker">{en?`Situation ${question+1} of ${questions.length}`:`Ситуация ${question+1} из ${questions.length}`}</p>
     <div>
      <button type="button" className="round-control" disabled={question===0} onClick={()=>onQuestion(question-1)} aria-label={en?'Previous situation':'Предыдущая ситуация'}><ArrowLeft size={20}/></button>
      <button type="button" className="round-control" disabled={question===questions.length-1} onClick={()=>onQuestion(question+1)} aria-label={en?'Next situation':'Следующая ситуация'}><ArrowRight size={20}/></button>
     </div>
    </div>
    <h1 id="prism-title" ref={heading} tabIndex={-1} key={question}>{en?q.en:q.title}</h1>
   </header>
   <ol className="choice-list" key={question}>
    {q.options.map((option,i)=><li key={i} className="choice-row" data-lead={(leader>0&&counts[i]===leader)||undefined} style={{'--bar':total?counts[i]/total:0,'--order':i} as CSSProperties}>
     <span className="choice-icon"><TaskIcon question={question} option={i}/></span>
     <span className="rank-body">
      <span className="rank-line"><strong className="rank-name">{previews[question][i].title}</strong><span className="rank-count">{counts[i]}<span className="visually-hidden"> {en?'of':'из'} {total}</span></span></span>
      <span className="choice-text">{en?option.en:option.text}</span>
      <span className="rank-bar" aria-hidden="true"><span/></span>
     </span>
    </li>)}
   </ol>
  </section>
  <section className="board-role prism-pane is-neutral" aria-label={en?'Most chosen':'Самый частый выбор'} aria-live="polite">
   <div className="board-role-step" key={question}>
    <span className="role-mark" aria-hidden="true">{leaders===1?<TaskIcon question={question} option={top}/>:<ListChecks/>}</span>
    <p className="role-kicker">{leaders>1?(en?'No single leading choice':'Единого лидера нет'):(en?'The most chosen approach':'Самый частый выбор')}</p>
    <h2 className="role-title">{leaders>1?(en?`${leaders} answers share the top`:`${leaders} варианта поровну`):previews[question][top].title}</h2>
    <p className="role-summary">{leaders>1?(en?'All four answers stay visible on the left.':'Все четыре ответа видны слева.'):(en?q.options[top].en:q.options[top].text)}</p>
    <p className="prism-number">{leader}<small>/ {total}</small></p>
    <p className="prism-caption">{leaders>1?(en?'completed tests chose each of them.':'завершённых тестов выбрали каждый из них.'):(en?'completed tests chose this approach.':'завершённых тестов выбрали этот подход.')} {en?'Answers do not measure ability or hiring demand.':'Ответы не измеряют способности или спрос на вакансии.'}</p>
   </div>
   <Link href="/" className="primary-button role-more">{en?'Find your directions':'Узнать свои направления'}<ArrowRight/></Link>
  </section>
 </div>;
}
