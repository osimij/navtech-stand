import test from 'node:test';
import assert from 'node:assert/strict';
import {createStageLoop,stageDurations,watchStageEnvironment} from '../lib/stage-loop.ts';
import {demoQueue} from '../lib/hiring-demo.ts';

test('silent presentation advances four beats in exactly 18 seconds; pause retains remaining time',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});const states=[];const loop=createStageLoop(s=>states.push(s),()=>Date.now());
 assert.equal(stageDurations.reduce((a,b)=>a+b,0),18000);loop.play();t.mock.timers.tick(4000);assert.equal(states.at(-1).beat,1);
 t.mock.timers.tick(2000);loop.pause();t.mock.timers.tick(60000);assert.deepEqual(states.at(-1),{beat:1,playing:false});
 loop.play();t.mock.timers.tick(2999);assert.equal(states.at(-1).beat,1);t.mock.timers.tick(1);assert.equal(states.at(-1).beat,2);
 t.mock.timers.tick(5000);assert.equal(states.at(-1).beat,3);t.mock.timers.tick(4000);assert.equal(states.at(-1).beat,0);loop.dispose();
});
test('operator beat selection, manual replay and disposal never restart an automatic clock',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});const states=[];const loop=createStageLoop(s=>states.push(s),()=>Date.now());
 loop.select(2);t.mock.timers.tick(30000);assert.deepEqual(states.at(-1),{beat:2,playing:false});
 loop.replay(false);t.mock.timers.tick(18000);assert.deepEqual(states.at(-1),{beat:0,playing:false});
 loop.play();loop.select(3);t.mock.timers.tick(18000);assert.deepEqual(states.at(-1),{beat:3,playing:false});
 loop.select(99);assert.equal(states.at(-1).beat,3);loop.dispose();const n=states.length;loop.play();loop.select(0);t.mock.timers.tick(18000);assert.equal(states.length,n);
});
test('the visual story changes availability clarification, never falsely books an interview',()=>{
 const before=demoQueue(null),after=demoQueue('week');
 assert.equal(before.counts.clarify,3);assert.equal(after.counts.clarify,2);assert.equal(after.total,6);
 assert.equal(before.total-before.counts.scheduled,5);assert.equal(after.total-after.counts.scheduled,5);
 assert.equal(after.rows.find(r=>r.id==='HR-04').scheduled,false);
});

test('real visibility/preference binding pauses a hidden screen and never silently resumes it',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});const states=[],modes=[];
 const page=Object.assign(new EventTarget(),{hidden:false}),motion=Object.assign(new EventTarget(),{matches:false});
 const loop=createStageLoop(s=>states.push(s),()=>Date.now());const release=watchStageEnvironment(loop,page,motion,v=>modes.push(v));
 t.mock.timers.tick(1000);page.hidden=true;page.dispatchEvent(new Event('visibilitychange'));t.mock.timers.tick(18000);assert.deepEqual(states.at(-1),{beat:0,playing:false});
 page.hidden=false;page.dispatchEvent(new Event('visibilitychange'));t.mock.timers.tick(18000);assert.equal(states.at(-1).playing,false);
 loop.play();motion.matches=true;motion.dispatchEvent(new Event('change'));assert.deepEqual(states.at(-1),{beat:2,playing:false});assert.equal(modes.at(-1),true);
 motion.matches=false;motion.dispatchEvent(new Event('change'));assert.equal(states.at(-1).playing,false);release();loop.dispose();
});
test('reduced-motion first load shows a useful static Prism result instead of starting the loop',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});const states=[];const loop=createStageLoop(s=>states.push(s),()=>Date.now());
 const page=Object.assign(new EventTarget(),{hidden:false}),motion=Object.assign(new EventTarget(),{matches:true});
 const release=watchStageEnvironment(loop,page,motion,()=>{});t.mock.timers.tick(18000);assert.deepEqual(states.at(-1),{beat:2,playing:false});release();loop.dispose();
});
