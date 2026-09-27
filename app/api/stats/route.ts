import { db,json,unavailable } from '@/lib/server';
import { QUIZ_VERSION, profiles, questions, scoreAnswers } from '@/lib/quiz';
import { createCareerStats, type CareerRow } from '@/lib/career-stats';
const careerStats=createCareerStats({QUIZ_VERSION,profiles,questions,scoreAnswers});
export const dynamic='force-dynamic';
export async function GET(){
 try{
  const data=await db().batch([
   db().prepare('SELECT answers, completed_at, intent FROM sessions WHERE quiz_version=?').bind(QUIZ_VERSION),
   db().prepare('SELECT COUNT(*) AS started, COUNT(completed_at) AS completed FROM sessions WHERE quiz_version<>?').bind(QUIZ_VERSION),
   db().prepare('SELECT COUNT(*) AS count FROM leads JOIN sessions ON leads.session_id=sessions.id WHERE sessions.quiz_version=?').bind(QUIZ_VERSION),
  ]);
  return json(careerStats(data[0].results as CareerRow[],data[1].results[0] as {started:number;completed:number},Number((data[2].results[0] as {count:number})?.count||0)));
 }catch(error){return unavailable(error);}
}
