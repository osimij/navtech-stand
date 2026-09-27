import test from 'node:test';
import assert from 'node:assert/strict';
import {boundGaze,faceCanLead,smoothGaze,touchGazeHold} from '../lib/mascot-gaze.ts';
test('pointer/touch holds gaze priority for the whole return delay, then face may lead',()=>{
 const touchAt=10000;
 for(const elapsed of [0,125,1900,2100,touchGazeHold-1])assert.equal(faceCanLead(touchAt+elapsed,touchAt),false);
 assert.equal(faceCanLead(touchAt+touchGazeHold,touchAt),true);
 assert.equal(faceCanLead(touchAt+touchGazeHold,touchAt+1500),false,'a new touch extends priority');
});
test('synthetic face and pointer positions stay bounded, ease without overshoot and reset to neutral',()=>{
 for(const point of [{x:100,y:-100},{x:-.8,y:.5},null,{x:NaN,y:Infinity}]){
  const target=boundGaze(point);assert.ok(Math.abs(target.x)<=1&&Math.abs(target.y)<=1);let current={x:0,y:0};
  for(let i=0;i<50;i++){const next=smoothGaze(current,target);for(const axis of ['x','y']){assert.ok(Math.abs(next[axis])<=1);assert.ok(Math.abs(target[axis]-next[axis])<=Math.abs(target[axis]-current[axis])+1e-10);}current=next;}
 }
 assert.deepEqual(boundGaze(null),{x:0,y:0});
});
