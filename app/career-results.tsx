'use client';
import { useState,useEffect,useRef } from 'react';
import { ArrowRight, Check, ChevronDown, Briefcase, ScanSearch, ListChecks, Target } from "@/components/icons";
import { profiles, questions, scoreAnswers, roleEvidence, type QuizLanguage } from '@/lib/quiz';
import { workContexts, englishWorkContexts } from '@/lib/work-context';
import { RoleIcon,roleStyle } from './career-visuals';
import { Button } from '@/components/ui/button';
export default function CareerResults({answers,language,onEdit,onContact,onReset}:{answers:number[];language:QuizLanguage;onEdit:(index:number)=>void;onContact:()=>void;onReset:()=>void}){
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});heading.current?.focus({preventScroll:true});},[]);
 const result=scoreAnswers(answers),en=language==='en';
 const [selected,setSelected]=useState(result.index);
 const role=profiles[selected],copy=en?role.en:role,work=(en?englishWorkContexts:workContexts)[role.id];
 const evidence=roleEvidence(answers,selected,language);
 return <div className="career-result" data-career-result>
  <div className="career-result-heading"><span>{en?'Professional roles from your answers':'Профессиональные роли по вашим ответам'}</span><p>{en?'Based on your interests, not your skill level.':'Совпадение подхода к задачам — не оценка квалификации.'}</p></div>
  <div className="career-match-overview">
   <div className="career-match-card"><div className="career-match-label"><span>{en?'Answer support':'Поддержка ответами'}</span><span>{en?'points':'баллы'}</span></div><div className="career-match-chart" role="group" aria-label={en?'Explore your role matches':'Посмотреть подходящие направления'}>
    {result.top.map((match,i)=><button key={match.index} style={roleStyle(profiles[match.index].id)} aria-pressed={selected===match.index} onClick={()=>setSelected(match.index)}><span className="career-match-rank">{i+1}</span><RoleIcon id={profiles[match.index].id}/><span className="career-match-body"><strong>{en?profiles[match.index].name:workContexts[profiles[match.index].id].label}</strong><span className="career-match-track"><span style={{width:`${match.score/result.top[0].score*100}%`}}/></span></span><span className="career-match-score">{match.score}</span>{selected===match.index?<Check size={16}/>:<ArrowRight size={16}/>}</button>)}
   </div><p>{en?'Relative support from your choices, not a skill rating.':'Сравнение ваших выборов, а не оценка навыков.'}</p></div>
   <div className="career-selected-intro" style={roleStyle(role.id)}><RoleIcon id={role.id} size={25}/><h1 ref={heading} tabIndex={-1}>{en?role.name:work.label}</h1><p className="career-role-subtitle">{copy.summary}</p></div>
  </div>
  {result.tied&&<p className="career-tie">{en?'Several roles share the highest score. Explore them side by side; there is no single winner.':'Несколько ролей набрали одинаковый максимум. Сравните их: единственного победителя здесь нет.'}</p>}
  <section className="career-role-detail" style={roleStyle(role.id)} aria-live="polite">
   <div className="career-role-main"><h2><Briefcase size={17} aria-hidden="true"/>{en?'What the work looks like':'Какие задачи решает эта роль'}</h2><p>{copy.work}</p><p className="career-format">{copy.format}</p><h2><ScanSearch size={17} aria-hidden="true"/>{en?'Why it appeared':'Почему в вашем результате'}</h2><ul className="career-evidence">{evidence.map(text=><li key={text}>{text}</li>)}</ul></div>
   <div className="career-project"><h2><ListChecks size={17} aria-hidden="true"/>{en?'Core tasks':'Ключевые задачи'}</h2><ul className="career-skills">{work.tasks.map(skill=><li key={skill}>{skill}</li>)}</ul><div className="career-project-brief"><span><Target size={18} aria-hidden="true"/>{en?'Value for the team':'Результат для команды'}</span><p>{work.value}</p></div></div>
  </section>
  <div className="career-result-actions"><details className="career-review"><summary>{en?'Review or change answers':'Посмотреть и изменить ответы'}<ChevronDown size={16}/></summary><ol>{questions.map((q,i)=><li key={q.id}><span>{i+1}</span><div><strong>{en?q.en:q.title}</strong><p>{en?q.options[answers[i]].en:q.options[answers[i]].text}</p></div><button onClick={()=>onEdit(i)}>{en?'Change':'Изменить'}</button></li>)}</ol></details><Button variant="ghost" onClick={onReset}>{en?'Next visitor':'Следующий участник'}<ArrowRight size={16}/></Button></div>
  <details className="career-method"><summary>{en?'How the matches work':'Как получены направления'}<ChevronDown size={15}/></summary><p>{en?'Each choice adds 3 points to one role and 1 to a related role. Every role has four primary and four related opportunities across different situations. We show the three highest totals. Ties are ordered by the number of primary choices, then catalog order; the order does not establish suitability.':'Каждый выбор добавляет 3 балла одной роли и 1 смежной. У каждой роли по четыре основных и четыре смежных варианта в разных ситуациях. Показываем три наибольшие суммы. При равенстве порядок зависит от числа основных выборов, затем от порядка каталога — он не доказывает, что одна роль подходит лучше.'}</p><div>{result.top.map(m=><span key={m.index}>{en?profiles[m.index].name:workContexts[profiles[m.index].id].label}: {m.score} {en?'points':'баллов'}</span>)}</div><p>{en?'This is a curated exploration of preferences, not a diagnosis, skill assessment or hiring recommendation. Job requirements vary by employer.':'Это авторский способ исследовать интересы, а не диагностика, проверка навыков или рекомендация по найму. Требования к работе зависят от работодателя.'}</p></details>
  <button className="career-contact-link" onClick={onContact}>{en?'Talk to the NavTech team':'Обсудить продукты NavTech'}<ArrowRight size={15}/></button>
 </div>;
}
