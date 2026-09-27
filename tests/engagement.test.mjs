import assert from 'node:assert/strict';
import { createArrivalGate, createShuffleBag } from '../lib/engagement.ts';

const gate=createArrivalGate();
assert.equal(gate.observe(false,0),false);
assert.equal(gate.observe(true,100),false,'A passing glance should not immediately greet');
assert.equal(gate.observe(true,999),false);
assert.equal(gate.observe(true,1000),true,'A stationary face can trigger an invitation');
gate.invited(1000);
assert.equal(gate.observe(true,61000),false,'A guest who remains nearby is not greeted repeatedly');
assert.equal(gate.observe(false,63000),false);
assert.equal(gate.observe(true,64000),false,'A short detection gap is not a new arrival');
assert.equal(gate.observe(false,70000),false);
assert.equal(gate.observe(true,71000),false);
assert.equal(gate.observe(true,71900),true,'A new arrival after sustained absence is greeted');
gate.invited(71900);
gate.observe(false,80000);
gate.observe(true,81000);
assert.equal(gate.observe(true,81900),false,'New arrivals still respect the shared cooldown');
assert.equal(gate.observe(true,131900),true);
gate.invited(131900);
gate.resetArrival();
gate.observe(true,132000);
assert.equal(gate.observe(true,132900),false,'Opening settings must not erase the cooldown');
assert.equal(gate.observe(true,191900),true);

const manual=createArrivalGate();
manual.invited(0);
manual.observe(false,7000);
manual.observe(true,61000);
assert.equal(manual.observe(true,62000),true,'A manual invitation before a face is detected must not block the first arrival');

const values=['wave','bow','lean'];
for(const random of [()=>0,()=>.5,()=>.999999]){
  const pick=createShuffleBag(random);let previous;
  for(let round=0;round<12;round++){
    const cycle=[];
    for(let i=0;i<values.length;i++){
      const next=pick(values);
      assert.notEqual(next,previous,'No repeated gesture across cycle boundaries');
      cycle.push(next);previous=next;
    }
    assert.equal(new Set(cycle).size,values.length,'Use every gesture before repeating');
  }
  const next=pick(['nod','peek']);assert.ok(['nod','peek'].includes(next),'Changing reaction type discards the previous pool');
}
const single=createShuffleBag();
assert.equal(single(['only']),'only');assert.equal(single(['only']),'only');
assert.throws(()=>single([]));
console.log('PASS: stationary arrivals, presence gaps, new arrivals, cooldown, settings reset, and varied nonrepeating gesture pools.');
