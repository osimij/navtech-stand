export type SessionCredentials = { id: string; token: string };
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type Request = (method: 'POST' | 'PATCH', payload: unknown, signal: AbortSignal) => Promise<{ answers?: number[] }>;

// Results are local. Serialize revised answers under one session so late saves cannot replace newer answers.
export function createSessionSync(credentials: SessionCredentials, request: Request, onState: (state: SaveState) => void) {
 const abort=new AbortController();
 let started=false,disposed=false,savedKey='',desired:number[]=[];
 let starting:Promise<void>|null=null,finishing:Promise<void>|null=null;
 const emit=(state:SaveState)=>{if(!disposed)onState(state);};
 function start():Promise<void>{
  if(disposed)return Promise.reject(Error('Session ended'));
  if(started)return Promise.resolve();
  if(starting)return starting;
  starting=request('POST',{...credentials,intent:'unspecified'},abort.signal).then(()=>{if(!disposed)started=true;}).finally(()=>{starting=null;});
  return starting;
 }
 function finish(answers:number[]):Promise<void>{
  if(disposed)return Promise.reject(Error('Session ended'));
  desired=[...answers];
  if(finishing)return finishing;
  if(savedKey===JSON.stringify(desired))return Promise.resolve();
  emit('saving');
  finishing=(async()=>{
   try{
    await start();
    while(!disposed&&savedKey!==JSON.stringify(desired)){
     const submitted=[...desired],key=JSON.stringify(submitted);
     const result=await request('PATCH',{...credentials,answers:submitted},abort.signal);
     if(disposed)return;
     if(JSON.stringify(result.answers)!==key)throw Error('Ответы не совпали с сохранёнными. Повторите сохранение.');
     savedKey=key;
    }
    if(!disposed)emit('saved');
   }catch(error){emit('error');throw error;}
   finally{finishing=null;}
  })();
  return finishing;
 }
 return {credentials,start,finish,dispose(){disposed=true;abort.abort();}};
}
