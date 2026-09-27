import test from 'node:test';
import assert from 'node:assert/strict';
import {demoQueue,sampleCases,demoCopy,sampleBrief,caseStage,focalId} from '../lib/hiring-demo.ts';
import {createDemoRun} from '../lib/demo-rehearsal.ts';

test('every offered answer yields defensible stage counts and preserves all other source records',()=>{
  const original=JSON.stringify(sampleCases);
  const expected={week:{clarify:2,schedule:2,later:1,scheduled:1},month:{clarify:2,schedule:1,later:2,scheduled:1},unknown:{clarify:3,schedule:1,later:1,scheduled:1}};
  for(const choice of Object.keys(expected)){
    const q=demoQueue(choice);
    assert.deepEqual(q.counts,expected[choice]);assert.equal(q.total,6);
    assert.equal(Object.values(q.counts).reduce((a,b)=>a+b,0),q.total);
    assert.deepEqual(q.rows.filter(r=>r.id!==focalId),sampleCases.filter(r=>r.id!==focalId));
    assert.equal(q.rows.filter(r=>caseStage(r)==='clarify').length,q.counts.clarify);
  }
  assert.equal(JSON.stringify(sampleCases),original);
  assert.deepEqual(demoQueue(null).counts,expected.unknown);
});

test('all localized briefs preserve exact original facts, label sample context, and recompute totals',()=>{
  for(const language of ['ru','en'])for(const choice of ['week','month','unknown']){
    const c=demoCopy[language],text=sampleBrief(language,choice);
    for(const fact of c.sourceFacts)assert.ok(text.includes(fact));
    assert.ok(text.includes(c.sampleWarning));assert.ok(text.includes(c.options[choice]));
    assert.ok(text.includes(c.actions[choice]));assert.ok(text.includes(c.human));assert.ok(text.includes(c.rule));
    assert.ok(text.includes(`3 → ${demoQueue(choice).counts.clarify} / 6`));
    for(const heading of c.briefSections)assert.ok(text.includes(heading));
  }
});

test('milestones deduplicate double taps, revisions remain distinct and reset rejects late callbacks',()=>{
  const events=[];let time=100;
  const run=createDemoRun({sessionId:'qa-one',language:'ru',origin:'staff_rehearsal',now:()=>time,iso:()=>new Date(0).toISOString(),append:e=>events.push(e)});
  assert.equal(run.record('demo_started'),true);assert.equal(run.record('demo_started'),false);
  time=125;run.record('case_changed',1,{choice:'week'});run.record('case_changed',1,{choice:'week'});
  time=150;run.record('result_visible',1,{duration_ms:25,choice:'week'});run.record('result_visible',1,{duration_ms:800});
  run.record('demo_completed',1);run.record('demo_completed',2);
  run.record('case_changed',2,{choice:'month'});run.record('result_visible',2,{duration_ms:20,choice:'month'});
  run.record('handoff_clicked',1);run.record('handoff_clicked',2);
  run.end();run.end();assert.equal(run.record('result_visible',3),false);
  assert.equal(events.filter(e=>e.event_type==='demo_completed').length,1);
  assert.equal(events.filter(e=>e.event_type==='handoff_clicked').length,1);
  assert.equal(events.filter(e=>e.event_type==='session_reset').length,1);
  assert.equal(events.find(e=>e.event_type==='result_visible').duration_ms,25);
  assert.equal(events.find(e=>e.event_type==='result_visible').elapsed_ms,50);
  assert.equal(new Set(events.map(e=>e.event_id)).size,events.length);
  assert.ok(events.every(e=>e.scenario_data_mode==='sample'&&e.data_mode==='test'));
});

test('visitor engagement and sample scenario data remain separate and contain no personal fields',()=>{
  const events=[];
  const config={language:'en',origin:'visitor',now:()=>0,iso:()=>new Date(0).toISOString(),append:e=>events.push(e)};
  const one=createDemoRun({...config,sessionId:'one'}),two=createDemoRun({...config,sessionId:'two'});
  one.record('demo_started');one.dispose();one.record('brief_download_requested');two.record('demo_started');
  assert.equal(events.length,2);assert.notEqual(events[0].event_id,events[1].event_id);
  assert.ok(events.every(e=>e.data_mode==='live'&&e.scenario_data_mode==='sample'));
  const allowed=['event_id','anonymous_session_id','timestamp','event_type','scenario','language','ui_variant','data_mode','scenario_data_mode','event_origin','revision','elapsed_ms'];
  assert.deepEqual(Object.keys(events[0]).sort(),allowed.sort());
});

test('voice attempts deduplicate lifecycle callbacks but retain separate interruptions and reject late events after reset',()=>{
  const events=[];let time=100;
  const run=createDemoRun({sessionId:'voice-qa',language:'en',origin:'automated_test',now:()=>time,iso:()=>new Date(0).toISOString(),append:e=>events.push(e)});
  run.record('voice_requested',0,{voice_attempt:1});
  time=150;run.record('voice_ready',0,{voice_attempt:1,duration_ms:50});
  assert.equal(run.record('voice_ready',0,{voice_attempt:1,duration_ms:55}),false);
  run.record('voice_interrupted',1,{voice_attempt:1,sequence:1});
  run.record('voice_interrupted',2,{voice_attempt:1,sequence:2});
  run.record('voice_ended',2,{voice_attempt:1});
  run.record('voice_requested',2,{voice_attempt:2});
  run.end();assert.equal(run.record('voice_first_audio',2,{voice_attempt:2}),false);
  assert.equal(events.filter(e=>e.event_type==='voice_interrupted').length,2);
  assert.equal(events.filter(e=>e.event_type==='voice_requested').length,2);
  assert.ok(events.every(e=>e.data_mode==='test'&&e.scenario_data_mode==='sample'));
  assert.ok(events.every(e=>!('transcript' in e)&&!('audio' in e)&&!('contact' in e)));
});
