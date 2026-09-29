import test from 'node:test';
import assert from 'node:assert/strict';
import {requestSignal} from '../lib/request-signal.ts';

// Older Chrome on the booth panel has AbortSignal.timeout but not AbortSignal.any.
function withoutAny(run){
 const any=AbortSignal.any;delete AbortSignal.any;
 return Promise.resolve().then(run).finally(()=>{AbortSignal.any=any;});
}
test('without AbortSignal.any a request signal still follows its owner',()=>withoutAny(()=>{
 const owner=new AbortController(),signal=requestSignal(10000,owner.signal);
 assert.equal(signal.aborted,false);
 owner.abort();
 assert.equal(signal.aborted,true);assert.equal(signal.reason.name,'AbortError');
}));
test('without AbortSignal.any a request signal times out on its own',()=>withoutAny(async()=>{
 const owner=new AbortController(),signal=requestSignal(10,owner.signal);
 await new Promise(resolve=>signal.addEventListener('abort',resolve,{once:true}));
 assert.equal(signal.reason.name,'TimeoutError');assert.equal(owner.signal.aborted,false);
}));
test('an owner already aborted gives an aborted request signal',()=>withoutAny(()=>{
 const owner=new AbortController();owner.abort();
 assert.equal(requestSignal(10000,owner.signal).aborted,true);
}));
test('with AbortSignal.any the native signal is used',()=>{
 const owner=new AbortController(),signal=requestSignal(10000,owner.signal);
 owner.abort();assert.equal(signal.aborted,true);
});
