import {env} from "cloudflare:workers";
export function db(){if(!env.DB)throw Error("Database unavailable");return env.DB;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}})}
export async function body(req:Request){if(Number(req.headers.get("content-length")||0)>8000)throw Error("Слишком большой запрос.");const raw=await req.text();if(raw.length>8000)throw Error("Слишком большой запрос.");return JSON.parse(raw)}
export function sameOrigin(req:Request){const origin=req.headers.get("origin");return !origin||origin===new URL(req.url).origin}
export async function hash(value:string){const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,"0")).join("")}
export async function authorizedSession(id:unknown,token:unknown){if(typeof id!=="string"||typeof token!=="string"||id.length>50||token.length>100)return null;return db().prepare("SELECT * FROM sessions WHERE id = ? AND token_hash = ?").bind(id,await hash(token)).first<{id:string;completed_at:string|null;profile:string|null;answers:string|null;quiz_version:string}>()}
export function unavailable(e:unknown){console.error("Request failed",e instanceof Error?e.message:"Unknown error");return json({error:"Не удалось сохранить данные. Проверьте соединение и попробуйте ещё раз."},503)}
