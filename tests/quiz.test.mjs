import test from 'node:test';import assert from 'node:assert/strict';
import {scoreAnswers,profiles,questions,roleEvidence} from '../lib/quiz.ts';
test('all eight roles have balanced evidence opportunities, real work and a specific project in both languages',()=>{
 assert.equal(questions.length,8);assert.equal(profiles.length,8);
 for(let i=0;i<profiles.length;i++){
  const contributions=questions.flatMap(q=>q.options.map(o=>o.scores[i]));
  assert.equal(contributions.filter(n=>n===3).length,4);assert.equal(contributions.filter(n=>n===1).length,4);
  for(const copy of [profiles[i],profiles[i].en]){assert.equal(copy.skills.length,3);assert.ok(copy.work.length>50);assert.ok(copy.project.length>90);assert.ok(copy.format.length>40);}
 }
});
test('all65536 answer combinations produce deterministic, distinct top3; every role can lead without a tie',()=>{
 const leaders=new Set();let ties=0;
 for(let n=0;n<65536;n++){
  const answers=Array.from({length:8},(_,i)=>(n>>(i*2))&3),r=scoreAnswers(answers);
  assert.equal(r.scores.reduce((a,b)=>a+b,0),32);assert.equal(new Set(r.top.map(m=>m.index)).size,3);
  assert.deepEqual(r,scoreAnswers(answers));assert.ok(r.top[0].score>=r.top[1].score&&r.top[1].score>=r.top[2].score);
  if(!r.tied)leaders.add(r.profile);else ties++;
 }
 assert.equal(leaders.size,8);assert.ok(ties>0);
});
test('invalid or incomplete input is rejected, and evidence comes only from selected answers',()=>{
 for(const bad of [[],Array(5).fill(0),Array(9).fill(0),[4,0,0,0,0,0,0,0],[-1,0,0,0,0,0,0,0],['1',0,0,0,0,0,0,0],[.5,0,0,0,0,0,0,0]])assert.throws(()=>scoreAnswers(bad));
 const answers=[1,2,0,3,0,1,2,0],result=scoreAnswers(answers);
 for(const lang of ['ru','en'])for(const match of result.top){const evidence=roleEvidence(answers,match.index,lang);assert.ok(evidence.length>0);for(const text of evidence)assert.ok(questions.some((q,i)=>(lang==='en'?q.options[answers[i]].en:q.options[answers[i]].text)===text));}
});
