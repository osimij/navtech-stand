import type { CSSProperties } from 'react';
import { BarChart, Flask, Cpu, Workflow, Dashboard, GitBranch, Code, PenTool, Search, ShoppingCart, Bug, Table, Send, Calendar, Tag, Gauge, Inbox, Users, Target, ShieldCheck, Pointer, Network, Repeat, CheckCheck, ListChecks, ArrowRight } from "@/components/icons";
import { taskPreviews, englishTaskPreviews } from '@/lib/work-context';
import type { QuizLanguage } from '@/lib/quiz';

// Identical role meaning on the personal result and the aggregate Prism screen.
const roleVisuals = {
 data_analyst: {icon:BarChart,fill:'#8ed2fa',ink:'#155478',soft:'#edf8fe'},
 data_scientist: {icon:Flask,fill:'#59c8a4',ink:'#176249',soft:'#eaf8f2'},
 ml_engineer: {icon:Cpu,fill:'#f4ad63',ink:'#8a4916',soft:'#fff3e6'},
 automation_engineer: {icon:Workflow,fill:'#ed92b5',ink:'#893656',soft:'#fff0f6'},
 bi_developer: {icon:Dashboard,fill:'#edcd51',ink:'#725c0e',soft:'#fff9df'},
 product_analyst: {icon:GitBranch,fill:'#a79ae5',ink:'#56428b',soft:'#f3efff'},
 software_engineer: {icon:Code,fill:'#77bdce',ink:'#235d6c',soft:'#edf8fa'},
 product_designer: {icon:PenTool,fill:'#f0a494',ink:'#87493a',soft:'#fff2ed'},
} as const;
export function roleStyle(id:string):CSSProperties {
 const v=roleVisuals[id as keyof typeof roleVisuals]||roleVisuals.data_analyst;
 return {'--role-fill':v.fill,'--role-ink':v.ink,'--role-soft':v.soft} as CSSProperties;
}
export function RoleIcon({id,size=22}:{id:string;size?:number}){
 const Icon=(roleVisuals[id as keyof typeof roleVisuals]||roleVisuals.data_analyst).icon;
 return <span className="career-icon" style={roleStyle(id)}><Icon size={size} strokeWidth={1.8} aria-hidden="true"/></span>;
}
// Icons describe the task, without exposing its answer-to-role mapping.
const taskIcons=[
 [GitBranch,Search,ShoppingCart,Bug], [Dashboard,Send,BarChart,Calendar],
 [Tag,Gauge,Inbox,Workflow], [Users,Target,Table,Search],
 [Flask,Gauge,Pointer,CheckCheck], [Network,Flask,Repeat,Code],
 [GitBranch,PenTool,BarChart,Cpu], [Dashboard,Workflow,ShieldCheck,Cpu],
];
export function TaskIcon({question,option}:{question:number;option:number}){
 const Icon=taskIcons[question]?.[option]||Search;
 return <Icon size={23} strokeWidth={1.7} aria-hidden="true"/>;
}
export function JourneySteps({language}:{language:QuizLanguage}){
 const en=language==='en';
 return <div className="career-journey" aria-label={en?'How it works':'Как это работает'}>
  <span><i className="journey-blue"><ListChecks size={22} aria-hidden="true"/></i>{en?'8 situations':'8 ситуаций'}</span><ArrowRight size={15} aria-hidden="true"/>
  <span><i className="journey-green"><GitBranch size={22} aria-hidden="true"/></i>{en?'Your approach':'Ваш подход'}</span><ArrowRight size={15} aria-hidden="true"/>
  <span><i className="journey-orange"><Users size={22} aria-hidden="true"/></i>{en?'3 roles':'3 роли'}</span>
 </div>;
}

export function TaskPreview({question,option,language="ru"}:{question:number;option:number;language?:QuizLanguage}){
 const illustrated=[[0],[0,1,3],[1,2,3],[1,2],[1,3],[0,2,3],[1,3],[1,3]];
 if(!illustrated[question].includes(option))return null;
 const preview=(language==='en'?englishTaskPreviews:taskPreviews)[question][option];
 return <span className="task-visual-flow" aria-hidden="true">{preview.steps.map((step,index)=><span className="task-visual-node" key={step}><span className="task-node-dot"/>{step}{index<2&&<ArrowRight size={13}/>}</span>)}</span>;
}
