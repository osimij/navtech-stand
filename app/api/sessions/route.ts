import {store,json,body,hash,sameOrigin,authorizedSession,unavailable} from "@/lib/server";
import {QUIZ_VERSION,scoreAnswers} from "@/lib/quiz";
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:"Запрос отклонён"},403);
 let v;try{v=await body(req)}catch{return json({error:"Некорректный запрос"},400)}
 if(!v||typeof v.id!=="string"||!/^[a-f0-9-]{36}$/.test(v.id)||typeof v.token!=="string"||!/^[a-f0-9-]{36}$/.test(v.token)||!["business","career","explore","unspecified"].includes(v.intent))return json({error:"Не удалось начать знакомство"},400);
 try{const tokenHash=await hash(v.token);await store().run("INSERT INTO sessions (id,token_hash,intent,started_at,quiz_version) VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING",v.id,tokenHash,v.intent,new Date().toISOString(),QUIZ_VERSION);if(!await authorizedSession(v.id,v.token))return json({error:"Сессия недоступна"},403);return json({id:v.id})}catch(e){return unavailable(e)}
}
export async function PATCH(req:Request){
 if(!sameOrigin(req))return json({error:"Запрос отклонён"},403);
 let v;try{v=await body(req)}catch{return json({error:"Некорректный запрос"},400)}
 if(!v||!Array.isArray(v.answers))return json({error:"Некорректные ответы"},400);
 let result;try{result=scoreAnswers(v.answers)}catch{return json({error:"Ответьте на все восемь вопросов"},400)}
 try{const session=await authorizedSession(v.id,v.token);if(!session)return json({error:"Начните новую игру"},403);if(session.quiz_version!==QUIZ_VERSION)return json({error:"Версия теста обновилась. Начните новый тест."},409);await store().run("UPDATE sessions SET completed_at=COALESCE(completed_at,?), profile=?, answers=? WHERE id=? AND quiz_version=?",new Date().toISOString(),result.profile,JSON.stringify(v.answers),v.id,QUIZ_VERSION);const saved=await authorizedSession(v.id,v.token);return json({profile:saved?.profile,answers:JSON.parse(saved?.answers||"[]")})}catch(e){return unavailable(e)}
}
