import type {MotionPoint} from './motion';
export const touchGazeHold=2200;
export function boundGaze(point:MotionPoint|null):MotionPoint {
 return point&&Number.isFinite(point.x)&&Number.isFinite(point.y)?{x:Math.max(-1,Math.min(1,point.x)),y:Math.max(-1,Math.min(1,point.y))}:{x:0,y:0};
}
export function faceCanLead(now:number,lastInput:number){return now-lastInput>=touchGazeHold;}
export function smoothGaze(current:MotionPoint,target:MotionPoint):MotionPoint{return {x:current.x+(target.x-current.x)*.14,y:current.y+(target.y-current.y)*.14};}
