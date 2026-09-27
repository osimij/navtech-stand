import type { Stats } from './quiz';
type Catalog = Pick<typeof import('./quiz'), 'profiles'|'questions'|'scoreAnswers'|'QUIZ_VERSION'>;
export type CareerRow = { answers: string | null; completed_at: string | null; intent: string };
export function createCareerStats({profiles,questions,scoreAnswers,QUIZ_VERSION}:Catalog) {
// Only current-version rows enter this function. Never reinterpret historical answers.
return function careerStats(rows: CareerRow[], legacy: Stats['legacy'], leads = 0): Stats {
 const distribution = profiles.map(p=>({profile:p.id,count:0}));
 const patterns = questions.map(q=>({question:q.id,counts:q.options.map(()=>0)}));
 const intents = new Map<string,number>(), hours = new Map<string,number>();
 let completed=0,excluded=0;
 for(const row of rows){
  if(!row.completed_at)continue;
  let answers:number[],result:ReturnType<typeof scoreAnswers>;
  try{answers=JSON.parse(row.answers||'null');if(!Array.isArray(answers))throw Error();result=scoreAnswers(answers);}catch{excluded++;continue;}
  completed++;
  // Include every tie at the third-place boundary: no arbitrary winner creates a false aggregate signal.
  const cutoff=result.top[2].score;
  result.scores.forEach((score,i)=>{if(score>=cutoff)distribution[i].count++;});
  answers.forEach((a,q)=>patterns[q].counts[a]++);
  intents.set(row.intent,(intents.get(row.intent)||0)+1);
  const date=new Date(row.completed_at);
  if(Number.isFinite(date.getTime())){const hour=new Date(date.getTime()+5*3600000).toISOString().slice(0,13).replace('T',' ');hours.set(hour,(hours.get(hour)||0)+1);}
 }
 return {started:rows.length,completed,leads,profiles:distribution,intents:[...intents].map(([intent,count])=>({intent,count})),interests:[],hours:[...hours].sort(([a],[b])=>a.localeCompare(b)).slice(-8).map(([hour,count])=>({hour,count})),patterns,legacy,excluded,version:QUIZ_VERSION,updatedAt:new Date().toISOString()};
}

}
