import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalCamera} from '../lib/local-camera.ts';
import {createFaceTracker} from '../lib/face-tracker.ts';
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
function media(){const track={stops:0,stop(){this.stops++},addEventListener(event,fn){this.ended=fn}};return {track,getTracks:()=>[track],getVideoTracks:()=>[track]};}
function camera(request,attach=()=>{}){const states=[],clears=[];const ctl=createLocalCamera({state:s=>states.push(s),clear:()=>clears.push(true)},{request,attach});return {ctl,states,clears};}
test('denied and absent camera leave no active resource and permit a fresh explicit attempt',async()=>{
 for(const [name,code] of [['NotAllowedError','denied'],['NotFoundError','missing']]){
  let denied=true;const stream=media();const c=camera(()=>denied?Promise.reject(Object.assign(new Error(),{name})):Promise.resolve(stream));
  await c.ctl.enable();assert.deepEqual(c.states.at(-1),{phase:'error',error:code});denied=false;await c.ctl.enable();assert.equal(c.states.at(-1).phase,'active');c.ctl.stop();assert.equal(stream.track.stops,1);
 }
});
test('hide/disable/reset during permission rejects a late stream, and never resumes automatically',async()=>{
 for(const action of ['stop','resetVisitor','dispose']){
  const pending=deferred(),stream=media(),attachments=[];const c=camera(()=>pending.promise,s=>attachments.push(s));
  const p=c.ctl.enable();c.ctl[action]();pending.resolve(stream);await p;
  assert.equal(stream.track.stops,1);assert.equal(attachments.includes(stream),false);assert.equal(c.states.some(s=>s.phase==='active'),false);
 }
});
test('reset retains operator-enabled camera, while stop/disconnect releases tracks and clears position',async()=>{
 const stream=media(),attachments=[];const c=camera(()=>Promise.resolve(stream),s=>attachments.push(s));await c.ctl.enable();
 c.ctl.resetVisitor();assert.equal(stream.track.stops,0);assert.equal(c.states.at(-1).phase,'active');assert.ok(c.clears.length);
 stream.track.ended();assert.equal(stream.track.stops,1);assert.equal(attachments.at(-1),null);assert.equal(c.states.at(-1).error,'missing');
});
test('stop while video play is pending cannot reactivate the old camera',async()=>{
 const stream=media(),play=deferred();const c=camera(()=>Promise.resolve(stream),s=>s?play.promise:undefined);
 const enabled=c.ctl.enable();await Promise.resolve();c.ctl.stop();play.resolve();await enabled;
 assert.equal(stream.track.stops,1);assert.equal(c.states.at(-1).phase,'off');
});
function detector(bitmap){const messages=[],faces=[],states=[];let paused=false;const worker={postMessage:m=>messages.push(m),terminate(){this.terminated=true}};
 const tracker=createFaceTracker({status:s=>states.push(s),face:p=>faces.push(p),paused:()=>paused,video:()=>({readyState:4,videoWidth:640})},{worker:()=>worker,bitmap,now:()=>Date.now(),timestamp:()=>Date.now()});
 const send=e=>worker.onmessage({data:e});return {tracker,worker,messages,faces,states,send,pause:()=>paused=true};}
test('in-flight bitmap after reset/dispose is closed, never posted to a new visitor worker',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date']});const pending=deferred(),bitmap={closed:false,close(){this.closed=true}};
 const old=detector(()=>pending.promise);old.send({type:'ready'});t.mock.timers.tick(125);old.tracker.dispose();
 const fresh=detector(()=>Promise.resolve({close(){}}));pending.resolve(bitmap);await Promise.resolve();
 assert.equal(bitmap.closed,true);assert.equal(old.messages.some(m=>m.type==='frame'),false);
 old.send({type:'position',point:{x:1,y:1}});assert.deepEqual(old.faces,[null]);assert.equal(fresh.faces.length,0);fresh.tracker.dispose();
});
test('one frame in flight; paused/handoff positions ignored; failures release the worker',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date']});let captures=0;
 const d=detector(()=>{captures++;return Promise.resolve({close(){}})});d.send({type:'ready'});t.mock.timers.tick(125);await Promise.resolve();t.mock.timers.tick(500);assert.equal(captures,1);
 d.send({type:'position',point:{x:.5,y:-.4}});assert.deepEqual(d.faces.at(-1),{x:.5,y:-.4});
 d.pause();d.send({type:'position',point:{x:-1,y:1}});assert.equal(d.faces.length,1);
 d.send({type:'error'});assert.equal(d.states.at(-1),'unavailable');assert.equal(d.worker.terminated,true);d.tracker.dispose();
});
