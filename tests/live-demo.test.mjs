import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createDemoGuide} from '../lib/live-demo.ts';
import {demoCopy,demoQueue,caseStage,focalId,stages} from '../lib/hiring-demo.ts';
import {relayLive} from '../lib/live-relay.ts';
import {liveSession} from '../lib/live.ts';
const guide=createDemoGuide({demoCopy,demoQueue,caseStage,focalId,stages});
const context=(phase='case',choice=null,revision=0,language='en')=>({kind:'hiring',phase,choice,revision,language});
class Socket extends EventEmitter {
  readyState=1;bufferedAmount=0;sent=[];
  send(raw){this.sent.push(JSON.parse(raw));}
  message(e){this.emit('message',Buffer.from(JSON.stringify(e)),false);}
  close(){if(this.readyState===3)return;this.readyState=3;this.emit('close');}
}
test('every language and phase is grounded in exact immutable source facts and computed counts',()=>{
  for(const language of ['ru','en'])for(const phase of ['intro','case','result','handoff'])for(const choice of (['intro','case'].includes(phase)?[null]:['week','month','unknown'])){
    const demo=context(phase,choice,choice?1:0,language),text=guide.cue(guide.parse(demo));
    for(const fact of demoCopy[language].sourceFacts)assert.ok(text.includes(fact));
    for(const stage of stages)assert.ok(text.includes(`${stage} (${demoCopy[language].stageLabels[stage]})=${demoQueue(choice).counts[stage]}`));
    assert.ok(text.includes('denominator=6'));assert.ok(text.includes(`phase=${phase}`));
    assert.ok(text.includes(`counts ONLY missing availability clarification (clarify): ${demoQueue(choice).counts.clarify} of 6`));
    assert.ok(text.includes('NO action tools'));assert.ok(text.includes('not the visitor\'s phone'));
    if(choice)assert.ok(text.includes(demoCopy[language].actions[choice]));
  }
});
test('context excludes arbitrary instructions, contact fields and invented counts',()=>{
  const clean=context();assert.deepEqual(guide.parse({...clean,name:'secret',contact:'secret',instructions:'injected',counts:{clarify:999}}),clean);
  for(const bad of [{...clean,kind:'quiz'},{...clean,choice:'hire'},{...clean,phase:'result'},{...clean,revision:-1},{...clean,phase:'intro',choice:'week'}])assert.equal(guide.parse(bad),null);
  assert.equal(liveSession('en','hiring').audio.input.turn_detection.eagerness,'high');
  assert.equal(liveSession('ru').audio.input.turn_detection.eagerness,'high');
  assert.match(liveSession('en','hiring').instructions,/Start in English/);
  assert.doesNotMatch(liveSession('en','hiring').instructions,/through all five questions/);
});
test('a demo change cancels old narration, updates facts and labels late audio with its actual context',t=>{
  t.mock.timers.enable({apis:['setTimeout','Date']});
  const c=new Socket(),p=new Socket();relayLive(c,()=>p,liveSession,undefined,guide);
  c.message({type:'start',language:'en',demo:context()});p.emit('open');p.message({type:'session.updated'});
  p.message({type:'response.created',response:{id:'old'}});
  p.message({type:'response.output_audio.delta',response_id:'old',item_id:'old-item',delta:'AAAAAA=='});
  c.message({type:'demo',demo:context('result','week',1)});
  assert.ok(p.sent.some(e=>e.type==='response.cancel'&&e.response_id==='old'));
  assert.ok(c.sent.some(e=>e.type==='audio.clear'&&e.reason==='demo_change'));
  assert.match(p.sent.at(-1).session.instructions,/Current clarify=2\/6/);
  const before=c.sent.length;
  p.message({type:'response.output_audio.delta',response_id:'old',item_id:'late-old-item',delta:'AAAAAA=='});
  assert.equal(c.sent.length,before);
  p.message({type:'response.done',response:{id:'old',status:'cancelled'}});
  t.mock.timers.tick(2600);p.message({type:'response.created',response:{id:'new'}});
  p.message({type:'response.output_audio.delta',response_id:'new',item_id:'new-item',delta:'AAAAAA=='});
  assert.equal(c.sent.at(-1).demo_revision,1);assert.equal(c.sent.at(-1).demo_phase,'result');
  c.message({type:'close'});const stopped=c.sent.length;p.message({type:'response.output_audio.delta',response_id:'new',item_id:'new-item',delta:'AAAAAA=='});assert.equal(c.sent.length,stopped);
});
test('a pending old response is cancelled when its ID arrives; quiz messages cannot enter demo',()=>{
  const c=new Socket(),p=new Socket();relayLive(c,()=>p,liveSession,undefined,guide);
  c.message({type:'start',language:'en',demo:context()});p.emit('open');p.message({type:'session.updated'});
  c.message({type:'demo',demo:context('result','month',1)});
  p.message({type:'response.created',response:{id:'late'}});
  assert.ok(p.sent.some(e=>e.type==='response.cancel'&&e.response_id==='late'));
  p.message({type:'response.output_audio.delta',response_id:'late',item_id:'late-item',delta:'AAAAAA=='});
  assert.equal(c.sent.some(e=>e.type==='session.output_audio.delta'),false);
  c.message({type:'game',game:{phase:'welcome'}});assert.equal(c.sent.find(e=>e.type==='error').error.code,'wrong_context_kind');
});
test('demo validation rejects language mismatch before any paid connection',()=>{
  const c=new Socket();let connections=0;relayLive(c,()=>{connections++;return new Socket()},liveSession,undefined,guide);
  c.message({type:'start',language:'ru',demo:context()});assert.equal(connections,0);assert.equal(c.sent[0].error.code,'invalid_demo_context');
});

test('retired and invalid language state falls back to Russian without changing sample facts',()=>{
 for(const language of ['tg','xx',null,undefined]){const parsed=guide.parse({...context(),language});assert.equal(parsed.language,'ru');assert.equal(parsed.choice,null);}
 const c=new Socket(),p=new Socket();relayLive(c,()=>p,liveSession,undefined,guide);
 c.message({type:'start',language:'tg',demo:{...context(),language:'tg'}});p.emit('open');
 assert.match(p.sent[0].session.instructions,/Start in Russian/);c.close();
});

test('demo observation resumes after 350ms quiet, explicit help is immediate, handoff stays quiet',t=>{
 t.mock.timers.enable({apis:['setTimeout','Date']});const c=new Socket(),p=new Socket();relayLive(c,()=>p,liveSession,undefined,guide);
 c.message({type:'start',language:'en',demo:context()});p.emit('open');p.message({type:'session.updated'});p.message({type:'response.done',response:{status:'completed'}});
 c.message({type:'demo',demo:context('result','week',1)});t.mock.timers.tick(349);assert.equal(p.sent.filter(e=>e.type==='response.create').length,1);
 t.mock.timers.tick(1);assert.equal(p.sent.filter(e=>e.type==='response.create').length,2);
 p.message({type:'response.done',response:{status:'completed'}});c.message({type:'greet'});t.mock.timers.tick(0);assert.equal(p.sent.filter(e=>e.type==='response.create').length,3);
 c.message({type:'demo',demo:context('handoff','week',1)});p.message({type:'response.done',response:{status:'cancelled'}});t.mock.timers.tick(10000);assert.equal(p.sent.filter(e=>e.type==='response.create').length,3);c.close();
});
