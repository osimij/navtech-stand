export type DemoEventType = 'demo_started'|'case_changed'|'first_value_visible'|'result_visible'|'demo_completed'|'brief_download_requested'|'handoff_clicked'|'session_reset'|'voice_requested'|'voice_ready'|'voice_first_audio'|'voice_interrupted'|'voice_stop_requested'|'voice_ended'|'voice_failed';
export type RehearsalEvent = {
  event_id:string; anonymous_session_id:string; timestamp:string; event_type:DemoEventType;
  scenario:'recruitment_availability'; language:string; ui_variant:'hiring-demo-v1';
  data_mode:'live'|'test'; scenario_data_mode:'sample'; event_origin:'staff_rehearsal'|'visitor'|'automated_test';
  revision:number; elapsed_ms:number; duration_ms?:number; choice?:'week'|'month'|'unknown';voice_attempt?:number;sequence?:number;
};
// An in-memory tab journal, never sent to the quiz APIs or a remote analytics service.
export function createDemoRun(config:{sessionId:string;language:string;origin:RehearsalEvent['event_origin'];now:()=>number;iso:()=>string;append:(event:RehearsalEvent)=>void}) {
  const start=config.now(), seen=new Set<string>();let ended=false;
  function record(type:DemoEventType,revision=0,detail:{duration_ms?:number;choice?:RehearsalEvent['choice'];voice_attempt?:number;sequence?:number}={}) {
    if(ended)return false;
    const repeated=type==='case_changed'||type==='result_visible'||type==='brief_download_requested';
    const key=type.startsWith('voice_')?`${type}:${detail.voice_attempt||0}:${detail.sequence||0}`:`${type}:${repeated?revision:0}`;
    if(seen.has(key))return false;
    seen.add(key);
    config.append({event_id:`${config.sessionId}:${key}`,anonymous_session_id:config.sessionId,timestamp:config.iso(),event_type:type,
      scenario:'recruitment_availability',language:config.language,ui_variant:'hiring-demo-v1',data_mode:config.origin==='visitor'?'live':'test',scenario_data_mode:'sample',event_origin:config.origin,
      revision,elapsed_ms:Math.max(0,Math.round((config.now()-start)*100)/100),...detail});
    return true;
  }
  return {record,end(){if(ended)return;record('session_reset');ended=true;},dispose(){ended=true;}};
}
