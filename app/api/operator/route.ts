import {setting} from "@/lib/platform";
import {store,json,hash,unavailable} from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(req:Request){try{
 const pin=setting("OPERATOR_PIN");const supplied=req.headers.get("authorization")?.replace(/^Bearer /,"")||"";
 if(!pin)return json({error:"Доступ оператора ещё не настроен."},503);
 if(supplied.length>100||await hash(supplied)!==await hash(pin))return json({error:"Неверный код оператора."},401);
 const leads=await store().all("SELECT leads.name,leads.company,leads.contact,leads.interest,leads.consented_at,leads.consent_version,sessions.profile,sessions.intent FROM leads JOIN sessions ON leads.session_id=sessions.id ORDER BY leads.consented_at DESC");return json({leads});
 }catch(e){return unavailable(e)}}
