import assert from 'node:assert/strict';
import {motionDetected,motionPosition} from '../lib/motion.ts';
const still=new Uint8ClampedArray(64*48*4).fill(80);
assert.equal(motionDetected(still,still),false);
assert.equal(motionDetected(still,new Uint8ClampedArray(still.length).fill(85)),false);
const moving=still.slice();for(let i=0;i<moving.length/4;i++)moving[i]=220;
assert.equal(motionDetected(still,moving),true);
assert.equal(motionDetected(new Uint8ClampedArray(),new Uint8ClampedArray()),false);
assert.equal(motionDetected(still,new Uint8ClampedArray(4)),false);
// Large movement regions return a coarse direction without detecting or storing a person.
function region(left, top, width, height) {
 const frame=still.slice();
 for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++){
  const pixel=(y*64+x)*4;frame[pixel]=frame[pixel+1]=frame[pixel+2]=220;
 }
 return frame;
}
const left=motionPosition(still,region(0,0,24,24));
const right=motionPosition(still,region(40,24,24,24));
assert.ok(left&&left.x<-.5&&left.y<0);
assert.ok(right&&right.x>.4&&right.y>0);
assert.equal(motionPosition(still,region(0,0,4,4)),null,'Tiny noise must not trigger greeting');
assert.equal(motionPosition(still,still,0),null);
assert.equal(motionPosition(still,still,63),null);
assert.ok(Math.abs(left.x)<=1&&Math.abs(left.y)<=1);
assert.ok(Math.abs(right.x)<=1&&Math.abs(right.y)<=1);
console.log('PASS: static scene, low noise, empty/mismatched frames, motion threshold, direction and bounded coordinates.');
