import type { CSSProperties } from 'react';
import { roleGlyphs, GlyphIcon, DrawnIcon, type Glyph, type Stroke, Flask, Workflow, Dashboard, GitBranch, Code, Search, Users, Target, Repeat, ListChecks, ArrowRight, Funnel, ChartLine, Eye, CreditCard, Send, Idea, ChartIncrease, Tags, Flash, AppWindow, Plug, UserSearch, Book, ChartScatter, BalanceScale, Gauge, Alert, Smile, DatabaseSync, Route, Touch, Presentation, Server, BadgeCheck, Shield, Activity } from "@/components/icons";
import type { QuizLanguage } from '@/lib/quiz';

// Identical role meaning on the personal result and the aggregate Prism screen. Each hue carries the feel of the
// work: clear sky for analysis, fresh green for research, warm amber for compute, rose for flow, sunlight for the
// shared overview, violet for curiosity, cool teal for craft, coral for people.
// `draw` choreographs the result mark, one entry per glyph stroke (see DrawnIcon).
const roleVisuals: Record<string,{glyph:Glyph;draw:Stroke[];fill:string;ink:string;soft:string}> = {
 // The axis settles first, then the three bars rise from it.
 data_analyst: {glyph:roleGlyphs.chartColumn,fill:'#8ed2fa',ink:'#155478',soft:'#edf8fe',draw:[{at:420,for:520,reverse:true},{at:520,for:620,reverse:true},{at:620,for:440,reverse:true},{at:0,for:760}]},
 // Built from the base up: bench, foot, arm, tube, then the focus knob.
 data_scientist: {glyph:roleGlyphs.microscope,fill:'#59c8a4',ink:'#176249',soft:'#eaf8f2',draw:[{at:0,for:420},{at:1080,for:420},{at:320,for:760},{at:160,for:420},{at:600,for:880}]},
 // The chip outline, then its pins grow outwards one by one, clockwise, then the core.
 ml_engineer: {glyph:roleGlyphs.cpu,fill:'#f4ad63',ink:'#8a4916',soft:'#fff3e6',draw:[{at:0,for:820},{at:560,for:240,reverse:true},{at:605,for:240,reverse:true},{at:785,for:240},{at:740,for:240},{at:1000,for:320},{at:1120,for:300},{at:695,for:240,reverse:true},{at:875,for:240},{at:830,for:240},{at:650,for:240,reverse:true}]},
 // Two gears turn against each other as they appear, then stop.
 automation_engineer: {glyph:roleGlyphs.gears,fill:'#ed92b5',ink:'#893656',soft:'#fff0f6',draw:[{at:0,for:1000,className:'turn-left'},{at:220,for:1000,className:'turn-right'},{at:900,for:320},{at:1000,for:320}]},
 // The whole draws around, then its slice moves into place.
 bi_developer: {glyph:roleGlyphs.pieChart,fill:'#edcd51',ink:'#725c0e',soft:'#fff9df',draw:[{at:0,for:1100},{at:700,for:640,className:'slide-in'}]},
 // Start point, main line, then the path that branches off towards its goal.
 product_analyst: {glyph:roleGlyphs.gitBranch,fill:'#a79ae5',ink:'#56428b',soft:'#f3efff',draw:[{at:760,for:760},{at:260,for:460},{at:0,for:420},{at:1380,for:420},{at:620,for:380}]},
 // The frame, then both brackets open.
 software_engineer: {glyph:roleGlyphs.codeSquare,fill:'#77bdce',ink:'#235d6c',soft:'#edf8fa',draw:[{at:0,for:900},{at:560,for:460},{at:700,for:460}]},
 // The pen: cap, nib, pivot, then the line it leaves.
 product_designer: {glyph:roleGlyphs.penTool,fill:'#f0a494',ink:'#87493a',soft:'#fff2ed',draw:[{at:1100,for:420},{at:920,for:360},{at:280,for:900},{at:0,for:620}]},
};
const visual=(id:string)=>roleVisuals[id]||roleVisuals.data_analyst;
export function roleStyle(id:string):CSSProperties {
 const v=visual(id);
 return {'--role-fill':v.fill,'--role-ink':v.ink,'--role-soft':v.soft} as CSSProperties;
}
export function RoleIcon({id,size=22}:{id:string;size?:number}){
 return <span className="career-icon" style={roleStyle(id)}><GlyphIcon glyph={visual(id).glyph} size={size} strokeWidth={1.8}/></span>;
}
// The result's large mark. Remount it (key) to draw it again.
export function RoleMark({id}:{id:string}){
 const v=visual(id);
 return <span className="role-mark" style={roleStyle(id)} aria-hidden="true"><DrawnIcon glyph={v.glyph} strokes={v.draw}/></span>;
}
// Icons describe the task, without exposing its answer-to-role mapping.
const taskIcons=[
 [Funnel,ChartLine,Eye,CreditCard], [Dashboard,Send,Idea,ChartIncrease],
 [Tags,Flash,AppWindow,Plug], [UserSearch,Flask,Book,ChartScatter],
 [BalanceScale,Gauge,Alert,Smile], [DatabaseSync,Target,Workflow,Code],
 [Route,Touch,Presentation,Server], [BadgeCheck,Repeat,Shield,Activity],
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

