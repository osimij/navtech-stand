import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionSync} from '../lib/session-sync.ts';
const answers=[0,0,0,0,0],credentials={id:'same-id',token:'same-token'};
const defer=()=>{let resolve,reject;return {promise:new Promise((yes,no)=>{resolve=yes;reject=no}),resolve,reject}};
test('a slow start and completion share one request and preserve idempotent credentials',async()=>{
 const states=[],calls=[],start=defer(),completion=defer();
 const sync=createSessionSync(credentials,(method,payload)=>{calls.push({method,payload});return method==='POST'?start.promise:completion.promise},state=>states.push(state));
 const starting=sync.start();const finishing=sync.finish(answers),duplicate=sync.finish(answers);
 assert.equal(finishing,duplicate);assert.equal(calls.length,1);assert.deepEqual(states,['saving']);
 start.resolve({});await starting;await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls.length,2);assert.deepEqual(calls[1].payload,{...credentials,answers});
 completion.resolve({answers});await finishing;assert.deepEqual(states,['saving','saved']);
 await sync.finish(answers);assert.equal(calls.length,2);
});
test('failed completion retains the same session for one explicit retry, without claiming saved',async()=>{
 const states=[],calls=[];let fail=true;
 const sync=createSessionSync(credentials,async(method,payload)=>{calls.push({method,payload});if(method==='PATCH'&&fail)throw Error('offline');return method==='PATCH'?{answers}:{}},state=>states.push(state));
 await assert.rejects(sync.finish(answers));assert.deepEqual(states,['saving','error']);
 fail=false;await sync.finish(answers);
 assert.equal(calls.filter(x=>x.method==='POST').length,1);assert.equal(calls.filter(x=>x.method==='PATCH').length,2);
 assert.deepEqual(calls[1].payload,calls[2].payload);assert.equal(states.at(-1),'saved');
});
test('a failed start can be retried without creating a different participant',async()=>{
 let fail=true;const calls=[];
 const sync=createSessionSync(credentials,async(method,payload)=>{calls.push({method,payload});if(fail)throw Error('offline');return method==='PATCH'?{answers}:{}},()=>{});
 await assert.rejects(sync.finish(answers));fail=false;await sync.finish(answers);
 assert.deepEqual(calls[0].payload,calls[1].payload);assert.equal(calls[2].method,'PATCH');
});
test('reset aborts pending work and late completion cannot update the next visitor',async()=>{
 const states=[],completion=defer();let signal;
 const sync=createSessionSync(credentials,async(method,_payload,s)=>{signal=s;return method==='POST'?{}:completion.promise},state=>states.push(state));
 const pending=sync.finish(answers);await new Promise(resolve=>setImmediate(resolve));
 sync.dispose();assert.equal(signal.aborted,true);completion.resolve({answers});await pending;
 assert.deepEqual(states,['saving']);await assert.rejects(sync.finish(answers),/Session ended/);
});
test('a mismatched server result is never silently treated as saved',async()=>{
 const states=[];const sync=createSessionSync(credentials,async method=>method==='POST'?{}:{answers:[1,1,1,1,1]},state=>states.push(state));
 await assert.rejects(sync.finish(answers),/не совпали/);assert.equal(states.at(-1),'error');
});

test('revisions while saving are serialized and only the latest result is marked saved',async()=>{
 const first=defer(),calls=[],states=[];let patches=0;
 const sync=createSessionSync(credentials,async(method,payload)=>{calls.push({method,payload});if(method==='POST')return {};if(++patches===1)return first.promise;return {answers:payload.answers};},s=>states.push(s));
 const a=Array(8).fill(0),b=Array(8).fill(1),c=Array(8).fill(2);
 const pending=sync.finish(a);await new Promise(r=>setImmediate(r));
 assert.equal(sync.finish(b),pending);assert.equal(sync.finish(c),pending);
 first.resolve({answers:a});await pending;
 assert.deepEqual(calls.filter(x=>x.method==='PATCH').map(x=>x.payload.answers),[a,c]);
 assert.deepEqual(states,['saving','saved']);await sync.finish(c);assert.equal(patches,2);
});
