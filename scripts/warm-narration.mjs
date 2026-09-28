// Synthesize every approved narration line once on a hosted site, so visitors are always served from its cache.
//   node scripts/warm-narration.mjs https://navtech-stand.vercel.app
//   node scripts/warm-narration.mjs --list          (print the lines and their length; no requests)
// Lines already cached cost nothing. New lines go through the site's own route (Sienna, eleven_v4_turbo) one at a time.
// Stops at the first settings error (missing key, rejected voice, exhausted credits); never retries a line.
import {questions,profiles,scoreAnswers} from '../lib/quiz.ts';
import {narrationText,tapLines} from '../lib/narration-text.ts';
import {siennaNarrator} from '../lib/voice-catalog.ts';

const game=(phase,answers=[],step=0)=>({phase,step,answers,selected:null,interest:''});
const full=questions.map(()=>0);

// One answer set for each possible result line: every role that can come first, and a tie.
const results=new Map();
for(let n=0;n<4**questions.length&&results.size<profiles.length+1;n++){
 const answers=questions.map((_,i)=>Math.floor(n/4**i)%4);
 if(answers.some((a,i)=>a>=questions[i].options.length))continue;
 const r=scoreAnswers(answers),key=r.tied?'tie':r.top[0].index;
 if(!results.has(key))results.set(key,answers);
}

const lines=[];
for(const language of ['ru','en']){
 const add=(label,g,cue='screen',variant=0)=>{
  const text=narrationText(g,language,cue,variant);
  if(!lines.some(l=>l.language===language&&l.text===text))lines.push({language,label,text,body:{language,selection:siennaNarrator,game:g,cue,variant}});
 };
 add('welcome',game('welcome'));
 questions.forEach((_,step)=>add(`question ${step+1}`,game('quiz',full.slice(0,step),step)));
 for(const [key,answers] of results)add(key==='tie'?'result tie':`result ${profiles[key].id}`,game('result',answers));
 add('contact',game('contact',full));add('success',game('success',full));
 for(const phase of Object.keys(tapLines[language]))for(let v=0;v<3;v++)add(`tap ${phase} ${v+1}`,game(phase,phase==='welcome'||phase==='quiz'?[]:full),'tap',v);
}

if(process.argv[2]==='--list'){
 for(const l of lines)console.log(l.language,l.label.padEnd(28),l.text);
 console.log(`\n${lines.length} lines, ${lines.reduce((n,l)=>n+l.text.length,0)} characters in total`);
 process.exit(0);
}
let site;
try{site=new URL(process.argv[2]).origin;}catch{console.error('Usage: node scripts/warm-narration.mjs https://your-site.vercel.app   (or --list)');process.exit(1);}

let hits=0,made=0,characters=0;const failed=[];
for(const [index,l] of lines.entries()){
 const started=Date.now();let response;
 try{response=await fetch(`${site}/api/voice-lab/speech`,{method:'POST',headers:{'Content-Type':'application/json',Origin:site},body:JSON.stringify(l.body)});}
 catch(error){failed.push(l);console.log(`${index+1}/${lines.length} ✗ ${l.language} ${l.label}: ${error.message}`);continue;}
 const tag=`${index+1}/${lines.length} ${l.language} ${l.label}`;
 if(!response.ok){
  const data=await response.json().catch(()=>({}));
  const settings=[400,403,503].includes(response.status)||(data.code&&data.code!=='provider_error')||[401,402,403].includes(data.providerStatus);
  console.log(`${tag}: ${response.status} ${data.error||''}`);
  if(settings){console.error('\nStopped: this is a site settings problem, not a passing error. Fix it, redeploy, and run again.');process.exit(1);}
  failed.push(l);continue;
 }
 const audio=(await response.arrayBuffer()).byteLength,hit=response.headers.get('X-Navi-Cache')==='hit';
 if(hit)hits++;else{made++;characters+=l.text.length;}
 console.log(`${tag}: ${hit?'cached':'generated'} · ${(audio/48000).toFixed(1)} s of audio · ${Date.now()-started} ms`);
}
console.log(`\n${hits} already cached, ${made} generated (${characters} characters), ${failed.length} failed.`);
if(failed.length){console.log('Run the same command again to fill the failed lines.');process.exit(1);}
