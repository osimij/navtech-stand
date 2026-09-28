'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, X } from "@/components/icons";
import { profiles, questions, scoreAnswers, roleEvidence, type QuizLanguage } from '@/lib/quiz';
import { workContexts, englishWorkContexts } from '@/lib/work-context';
import { RoleIcon, RoleMark, roleStyle } from './career-visuals';
import { RoleRanking, roleName } from './role-ranking';
import { Sheet } from './sheet';
import { Button } from '@/components/ui/button';

// One board: all eight roles ranked by the answers, the chosen one open beside them, its detail one tap away.
export default function CareerResults({answers,language,onEdit,onRole}:{answers:number[];language:QuizLanguage;onEdit:(index:number)=>void;onRole:(id:string)=>void}){
 const heading=useRef<HTMLHeadingElement>(null), pane=useRef<HTMLElement>(null), more=useRef<HTMLButtonElement>(null), opened=useRef(false);
 const result=scoreAnswers(answers),en=language==='en';
 const [selected,setSelected]=useState(result.index);
 const [sheet,setSheet]=useState(false);
 const role=profiles[selected],copy=en?role.en:role,score=result.scores[selected];
 const best=result.ranked[0].score,cutoff=result.top[2].score;
 // Ties stay ties: the line never ranks one of several equal roles above the others.
 const kicker=score===best?(result.tied?(en?'One of your equal matches':'Одно из равных совпадений'):(en?'Closest to your answers':'Ближе всего к вашим ответам'))
  :score>=cutoff?(en?'Also close to your answers':'Тоже близко к вашим ответам')
  :score>0?(en?'Less present in your answers':'Реже встречается в ваших ответах')
  :(en?'None of your answers pointed here':'Ваши ответы сюда не указывали');
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});heading.current?.focus({preventScroll:true});},[]);
 useEffect(()=>{onRole(role.id);},[role.id,onRole]);
 // Focus returns to the button once the card is gone and the page is no longer inert.
 useEffect(()=>{if(sheet)opened.current=true;else if(opened.current)more.current?.focus();},[sheet]);
 function choose(index:number){
  setSelected(index);
  // Stacked on a narrow screen, the pane sits below the list: bring it into view.
  if(window.matchMedia('(max-width: 959px)').matches)pane.current?.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 return <div className="result-board" data-career-result>
  <div className="board-card" inert={sheet}>
   <section className="board-ranking" aria-labelledby="board-title">
    <header className="board-head">
     <h1 id="board-title" ref={heading} tabIndex={-1}>{en?'Your directions':'Ваши направления'}</h1>
     <p>{en?'The longer the bar, the closer the role is to your answers.':'Чем длиннее полоса, тем ближе роль к вашим ответам.'}</p>
    </header>
    <RoleRanking rows={result.ranked.map(({index,score})=>({index,value:score}))} scale={best} cutoff={cutoff} selected={selected} onSelect={choose} en={en} label={en?'All eight roles, closest first':'Все восемь ролей, от ближайшей'}/>
   </section>
   <section ref={pane} className="board-role" style={roleStyle(role.id)} aria-label={en?'Selected role':'Выбранная роль'} aria-live="polite">
    <div className="board-role-step" key={role.id}>
     <RoleMark id={role.id}/>
     <p className="role-kicker">{kicker}</p>
     <h2 className="role-title">{roleName(selected,en)}</h2>
     <p className="role-summary">{copy.summary}</p>
    </div>
    <Button ref={more} className="primary-button role-more" onClick={()=>setSheet(true)}>{en?'About the role':'Подробнее о роли'}<ArrowRight/></Button>
   </section>
  </div>
  {sheet&&<RoleSheet answers={answers} index={selected} language={language} onEdit={onEdit} onClose={()=>setSheet(false)}/>}
 </div>;
}

// The detail card: why this role appeared, what the work is, its tasks and value. A second view lists the answers.
function RoleSheet({answers,index,language,onEdit,onClose}:{answers:number[];index:number;language:QuizLanguage;onEdit:(index:number)=>void;onClose:()=>void}){
 const en=language==='en',role=profiles[index],copy=en?role.en:role,work=(en?englishWorkContexts:workContexts)[role.id];
 const evidence=roleEvidence(answers,index,language),result=scoreAnswers(answers);
 const [view,setView]=useState<'role'|'answers'>('role');
 return <Sheet labelledBy="role-sheet-title" view={view} style={roleStyle(role.id)} onClose={onClose}>{dismiss=>view==='role'?<div className="sheet-view" key="role">
  <div className="sheet-bar">
   <button type="button" className="sheet-corner" onClick={dismiss} aria-label={en?'Close':'Закрыть'}><X size={20}/></button>
   <button type="button" className="sheet-pill" onClick={()=>setView('answers')}>{en?'Change answers':'Изменить ответы'}</button>
  </div>
  <header className="sheet-head"><RoleIcon id={role.id} size={24}/><h2 id="role-sheet-title">{roleName(index,en)}</h2><p>{copy.summary}</p></header>
  <div className="sheet-grid">
   <section><h3>{en?'Why it appeared':'Почему в вашем результате'}</h3><ul className="sheet-evidence">{evidence.map(text=><li key={text}><Check size={18}/>{text}</li>)}</ul></section>
   <section><h3>{en?'What the work looks like':'Какие задачи решает эта роль'}</h3><p>{copy.work}</p></section>
   <section><h3>{en?'Core tasks':'Ключевые задачи'}</h3><ul className="sheet-tasks">{work.tasks.map(task=><li key={task}>{task}</li>)}</ul></section>
   <section className="sheet-value"><h3>{en?'Value for the team':'Результат для команды'}</h3><p>{work.value}</p></section>
  </div>
  <details className="sheet-method"><summary>{en?'How the matches work':'Как получены направления'}<ChevronDown size={15}/></summary><p>{en?'Each choice adds 3 points to one role and 1 to a related role. Every role has four primary and four related opportunities across different situations. The bars compare these totals with your highest one; the closest three, with every tie at third place, are in colour. Ties are ordered by the number of primary choices, then catalog order; the order does not establish suitability.':'Каждый выбор добавляет 3 балла одной роли и 1 смежной. У каждой роли по четыре основных и четыре смежных варианта в разных ситуациях. Полосы сравнивают эти суммы с вашей наибольшей; три ближайшие роли и все равные третьей выделены цветом. При равенстве порядок зависит от числа основных выборов, затем от порядка каталога — он не доказывает, что одна роль подходит лучше.'}</p><div>{result.ranked.map(match=><span key={match.index}>{roleName(match.index,en)}: {match.score} {en?'points':'баллов'}</span>)}</div><p>{en?'This is a curated exploration of preferences, not a diagnosis, skill assessment or hiring recommendation. Job requirements vary by employer.':'Это авторский способ исследовать интересы, а не диагностика, проверка навыков или рекомендация по найму. Требования к работе зависят от работодателя.'}</p></details>
 </div>:<div className="sheet-view" key="answers">
  <div className="sheet-bar">
   <button type="button" className="sheet-corner" onClick={()=>setView('role')} aria-label={en?'Back to the role':'Назад к роли'}><ArrowLeft size={20}/></button>
  </div>
  <header className="sheet-head"><h2 id="role-sheet-title">{en?'Your answers':'Ваши ответы'}</h2><p>{en?'Change any answer and the result updates at once.':'Измените любой ответ — результат сразу обновится.'}</p></header>
  <ol className="sheet-answers">{questions.map((question,i)=><li key={question.id}><span>{i+1}</span><div><strong>{en?question.en:question.title}</strong><p>{en?question.options[answers[i]].en:question.options[answers[i]].text}</p></div><button type="button" onClick={()=>onEdit(i)}>{en?'Change':'Изменить'}</button></li>)}</ol>
 </div>}</Sheet>;
}
