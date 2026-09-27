import type { Availability, DemoLanguage } from './hiring-demo';
export type DemoContext = { kind:'hiring'; phase:'intro'|'case'|'result'|'handoff'; choice:Availability|null; revision:number; language:DemoLanguage };
type Catalog = Pick<typeof import('./hiring-demo'),'demoCopy'|'demoQueue'|'caseStage'|'focalId'|'stages'>;
export type DemoGuide = ReturnType<typeof createDemoGuide>;
export function createDemoGuide(catalog:Catalog) {
  function parse(value:unknown):DemoContext|null {
    if(!value||typeof value!=='object')return null;
    const v=value as Partial<DemoContext>;
    if(v.kind!=='hiring'||!['intro','case','result','handoff'].includes(v.phase||'')||!Number.isInteger(v.revision)||v.revision!<0||v.revision!>10000)return null;
    if(v.choice!==null&&!['week','month','unknown'].includes(v.choice||''))return null;
    if((v.phase==='intro'||v.phase==='case')?(v.choice!==null||v.revision!==0):(v.choice===null||v.revision===0))return null;
    return {kind:'hiring',phase:v.phase!,choice:v.choice!,revision:v.revision!,language:v.language==='en'?'en':'ru'};
  }
  function cue(demo:DemoContext) {
    const c=catalog.demoCopy[demo.language],q=catalog.demoQueue(demo.choice);
    return `Recruitment sample screen, phase=${demo.phase}, UI language=${demo.language}, revision=${demo.revision}. Preserve the visitor's conversation language; translate the facts when appropriate.
This is a live AI conversation ABOUT an authored fictional local example, not a production HR integration. The visitor is exploring an organization's workflow, NOT applying for a job.
ORIGINAL SOURCE ${catalog.focalId}, unchanged fictional application: ${c.factLabels.map((label,i)=>`${label}: “${c.sourceFacts[i]}”`).join('; ')}.
HYPOTHETICAL CLARIFICATION: ${demo.choice===null?'none selected':`${demo.choice}: “${c.options[demo.choice]}”`}. Original vague availability is not a confirmed date. A selected week/month is a sample clarification only.
EXACT CURRENT SAMPLE QUEUE: denominator=${q.total}; ${catalog.stages.map(stage=>`${stage} (${c.stageLabels[stage]})=${q.counts[stage]}`).join('; ')}. Baseline clarify=3/6. Current clarify=${q.counts.clarify}/6. ${q.rows.map(row=>`${row.id}=${catalog.caseStage(row)}`).join('; ')}.
METRIC MEANING: The main before/after number counts ONLY missing availability clarification (clarify): ${q.counts.clarify} of ${q.total}, namely ${q.rows.filter(row=>catalog.caseStage(row)==='clarify').map(row=>row.id).join(', ')}. This is the number to explain when the visitor asks what remains unresolved after their choice. The schedule and later rows already have an availability answer; they are NOT awaiting clarification. Availability known is different from an exact interview appointment booked. If the visitor explicitly asks about unscheduled appointments, that separate total is ${q.total-q.counts.scheduled}; name that distinction rather than replacing the displayed counter. If their wording could mean either, name the metric you are answering or ask a short clarification.
ON-SCREEN NEXT ACTION: ${demo.choice?c.actions[demo.choice]:c.missing} ${demo.choice?c.pilotText:''}
${demo.phase==='intro'?'Start button opens the application.':demo.phase==='case'?'Three touch answers: '+Object.entries(c.options).map(([key,value])=>`${key}: ${value}`).join('; '):demo.phase==='handoff'?'Staff handoff prompt is visible. No contact was sent and no meeting was booked.':'The HR brief and Prism result are already visible. A local sample-plan download and optional staff discussion are available.'}
Touch controls alone change this sample. You have NO action tools: if asked to change availability, tell the visitor which on-screen choice to tap; never claim you changed it. Hypothetical spoken discussion does not change the authoritative queue. The chart is workflow follow-up, not candidate quality, ranking, rejection or hiring. No invitations, messages, lead saves or bookings occurred. Existing scheduled=1 is an authored sample row, not an action you performed. The plan downloads to this kiosk, not the visitor's phone. Do not give invented ROI, pricing or integration claims. React to this latest state, not an older answer. Give one useful short response, then room for the visitor's questions or playful challenge.`;
  }
  return {parse,cue};
}
