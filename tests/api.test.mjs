import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {QUIZ_VERSION,scoreAnswers} from '../lib/quiz.ts';
const origin='http://localhost:5173';
async function call(path,method='GET',payload,extra={}){const r=await fetch(origin+path,{method,headers:{'content-type':'application/json',...extra},body:payload===undefined?undefined:JSON.stringify(payload)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={error:text}}return {status:r.status,data};}
const before=(await call('/api/stats')).data;
const s={id:crypto.randomUUID(),token:crypto.randomUUID(),intent:'unspecified'};
try{
 assert.equal((await call('/api/sessions','POST',s)).status,200);
 assert.equal((await call('/api/sessions','POST',s)).status,200);
 assert.equal((await call('/api/sessions','PATCH',{...s,answers:[0,0,0,0,0]})).status,400);
 assert.equal((await call('/api/sessions','PATCH',{...s,token:crypto.randomUUID(),answers:Array(8).fill(0)})).status,403);
 for(const answers of [Array(8).fill(0),[1,0,0,3,0,1,2,0]]){
  const r=await call('/api/sessions','PATCH',{...s,answers});assert.equal(r.status,200);assert.deepEqual(r.data.answers,answers);assert.equal(r.data.profile,scoreAnswers(answers).profile);
 }
 const stats=(await call('/api/stats')).data;
 assert.equal(stats.version,QUIZ_VERSION);assert.equal(stats.started,before.started+1);assert.equal(stats.completed,before.completed+1);assert.equal(stats.leads,before.leads);assert.deepEqual(stats.legacy,before.legacy);
 assert.equal(stats.patterns[1].counts[0],before.patterns[1].counts[0]+1);
 assert.ok(!JSON.stringify(stats).includes(s.id));assert.ok(!JSON.stringify(stats).includes(s.token));
 assert.equal((await call('/api/leads','POST',{...s,name:'Synthetic',contact:'test@example.com',interest:'career',consent:false})).status,400);
 assert.equal((await call('/api/operator')).status,401);
 assert.equal((await call('/api/sessions','POST',s,{origin:'https://untrusted.example'})).status,403);
 for(const route of ['/','/screen','/operator'])assert.equal((await fetch(origin+route)).status,200);
 console.log('PASS: current version, eight answers, revisable result, one completion, anonymous stats, legacy separation, consent, access and routes.');
}finally{
 execFileSync('python3',['-c',`import sqlite3,sys
c=sqlite3.connect('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite')
c.execute('DELETE FROM leads WHERE session_id=?',(sys.argv[1],))
c.execute('DELETE FROM sessions WHERE id=?',(sys.argv[1],));c.commit()`,s.id]);
}
