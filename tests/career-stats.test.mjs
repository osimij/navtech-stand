import test from 'node:test';import assert from 'node:assert/strict';
import * as catalog from '../lib/quiz.ts';import {createCareerStats} from '../lib/career-stats.ts';
const stats=createCareerStats(catalog),row=answers=>({answers:JSON.stringify(answers),completed_at:'2026-09-22T05:00:00Z',intent:'unspecified'});
test('new version stays separate; empty and malformed completed data cannot fabricate a chart',()=>{
 const s=stats([{answers:null,completed_at:null,intent:'unspecified'},row([0,0,0,0,0])],{started:9,completed:4});
 assert.equal(s.started,2);assert.equal(s.completed,0);assert.equal(s.excluded,1);assert.deepEqual(s.legacy,{started:9,completed:4});assert.ok(s.profiles.every(p=>p.count===0));assert.ok(s.patterns.every(p=>p.counts.every(n=>n===0)));
});
test('counts derive from answers and preserve all third-place ties without leaking per-session data',()=>{
 const answers=[0,0,0,0,0,0,0,0],r=catalog.scoreAnswers(answers),s=stats([row(answers),row(answers)],{started:9,completed:4});
 assert.equal(s.completed,2);
 s.profiles.forEach((p,i)=>assert.equal(p.count,r.scores[i]>=r.top[2].score?2:0));
 assert.ok(s.profiles.reduce((a,p)=>a+p.count,0)>=6);s.patterns.forEach(p=>assert.deepEqual(p.counts,[2,0,0,0]));
 assert.deepEqual(s.hours,[{hour:'2026-09-22 10',count:2}]);assert.equal('answers' in s,false);assert.equal('sessions' in s,false);
});
test('revising a record changes its pattern, never adds a completed test',()=>{
 const first=stats([row(Array(8).fill(0))],{started:0,completed:0}),second=stats([row(Array(8).fill(1))],{started:0,completed:0});
 assert.equal(first.completed,second.completed);assert.deepEqual(second.patterns[0].counts,[0,1,0,0]);
});
