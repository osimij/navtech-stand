import {store,json,body,sameOrigin,authorizedSession,unavailable} from "@/lib/server";
import {CONSENT_VERSION,interestLabels} from "@/lib/quiz";
import {validContact} from "@/lib/visitor-name";
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:"Запрос отклонён"},403);
 let v;try{v=await body(req)}catch{return json({error:"Некорректный запрос"},400)}
 if(!v||v.consent!==true||typeof v.name!=="string"||v.name.trim().length<2||v.name.trim().length>80||typeof v.contact!=="string"||v.contact.length>150||typeof v.interest!=="string"||!Object.hasOwn(interestLabels,v.interest)|| (v.company!==undefined&&(typeof v.company!=="string"||v.company.length>120)))return json({error:"Укажите имя, интерес и согласие на связь."},400);
 const contact=v.contact.trim();if(!validContact(contact))return json({error:"Укажите email, телефон или Telegram в формате @username."},400);
 try{const session=await authorizedSession(v.id,v.token);if(!session?.completed_at)return json({error:"Сначала завершите игру."},403);
 await store().run("INSERT INTO leads (id,session_id,name,company,contact,interest,consent_version,consented_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET name=excluded.name,company=excluded.company,contact=excluded.contact,interest=excluded.interest,consent_version=excluded.consent_version,consented_at=excluded.consented_at",crypto.randomUUID(),session.id,v.name.trim(),v.company?.trim()||null,contact,v.interest,CONSENT_VERSION,new Date().toISOString());return json({saved:true})}catch(e){return unavailable(e)}
}
