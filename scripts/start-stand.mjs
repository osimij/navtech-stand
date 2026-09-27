import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const address='http://localhost:5173';
async function available(port,host){
 return new Promise((resolve,reject)=>{const s=createServer();s.once('error',error=>error.code==='EADDRINUSE'?resolve(false):error.code==='EAFNOSUPPORT'?resolve(true):reject(error));s.listen(port,host,()=>s.close(()=>resolve(true)));});
}
for(const port of [5173,5174])for(const host of ['127.0.0.1','::1'])if(!await available(port,host)){
 console.error(`Port ${port} is already in use. Close the previous Navi terminal, then launch again. No existing process was stopped.`);process.exit(1);
}
console.log('\nStarting Navi. Keep this terminal open while the stand is running.\n');
const child=spawn(process.execPath,['scripts/run-framework.mjs','dev','--host','127.0.0.1','--strictPort'],{stdio:'inherit',env:process.env});
let finished=false;
child.once('error',error=>{finished=true;console.error(error.message);process.exitCode=1;});
child.once('exit',(code)=>{finished=true;process.exitCode=code??0;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(!finished)child.kill(signal);});
for(let attempt=0;attempt<120&&!finished;attempt++){
 try{
  const response=await fetch(`${address}/api/voice-lab/status`,{signal:AbortSignal.timeout(1500)});
  if(response.ok){
   console.log(`\nNavi: ${address}\nPrism (second monitor): ${address}/screen\nVoices: ${address}/voices\nStop: Ctrl+C in this window.\n`);
   if(process.env.NAVI_NO_BROWSER!=='1')spawn('open',[address],{stdio:'ignore'}).on('error',()=>{});
   break;
  }
 }catch{}
 if(attempt===119)console.error(`Startup is taking longer than expected. Check the messages above, then open ${address}.`);
 await delay(1000);
}
