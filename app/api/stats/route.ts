import { store,json,unavailable } from '@/lib/server';
import { QUIZ_VERSION, profiles, questions, scoreAnswers } from '@/lib/quiz';
import { createCareerStats, type CareerRow } from '@/lib/career-stats';
const careerStats=createCareerStats({QUIZ_VERSION,profiles,questions,scoreAnswers});
export const dynamic='force-dynamic';
export async function GET(){
 try{
  const db=store();
  const [rows,[legacy],[leads]]=await Promise.all([
   db.all<CareerRow>('SELECT answers, completed_at, intent FROM sessions WHERE quiz_version=?',QUIZ_VERSION),
   db.all<{started:number;completed:number}>('SELECT COUNT(*) AS started, COUNT(completed_at) AS completed FROM sessions WHERE quiz_version<>?',QUIZ_VERSION),
   db.all<{count:number}>('SELECT COUNT(*) AS count FROM leads JOIN sessions ON leads.session_id=sessions.id WHERE sessions.quiz_version=?',QUIZ_VERSION),
  ]);
  return json(careerStats(rows,legacy,Number(leads?.count||0)));
 }catch(error){return unavailable(error);}
}
