"use client";

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { Settings, Play, Stop, Mic, MicOff, Volume, VolumeOff } from "@/components/icons";
import { motionPosition, type MotionPoint } from "@/lib/motion";
import { useFaceTracking } from "@/lib/use-face-tracking";
import { useLiveVoice } from "@/lib/use-live-voice";
import { useVoicePreference, useNarratorPreference } from "@/lib/use-voice-preference";
import { savedVoice } from "@/lib/voice-options";
import { modelById } from "@/lib/voice-catalog";
import { useVoiceAnswersSetting } from "@/lib/use-voice-answers";
import type { CreativeAction } from "@/lib/live";
import type { GameContext } from "@/lib/live-game";
import type { SpeechFrame } from "@/lib/invitation-player";
import { createArrivalGate, createShuffleBag } from "@/lib/engagement";
import { invitationScripts, type InvitationLanguage } from "@/lib/invitations";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";

const englishLabels:Record<string,string>={
  "Завершить разговор": "End conversation",
  "Поговорить с Нави — микрофон и OpenAI": "Talk to Navi — microphone and OpenAI",
  "Включить звук": "Enable audio",
  "Микрофон включён · можно говорить": "Microphone on · you can speak",
  "Завершаем разговор…": "Ending conversation…",
  "Подключаем Нави…": "Connecting Navi…",
  "Настройки стенда": "Booth settings",
  "Живой разговор с Нави через микрофон.": "Talk live with Navi using the microphone.",
  "Голос Нави": "Navi’s voice",
  "Микрофон включён. Можно говорить.": "Microphone on. You can speak.",
  "GPT‑Realtime‑1.5 · голос Marin": "GPT‑Realtime‑1.5 · Marin voice",
  "Начать разговор с Нави": "Start a conversation with Navi",
  "Язык разговора": "Conversation language",
  "Поговорить с Нави": "Talk to Navi",
  "Синтезированный голос ИИ. Аудио передаётся OpenAI только после включения разговора. Нави остаётся с вами во время игры. «Завершить» и «Следующий участник» заканчивают разговор. Максимум — 10 минут.": "AI-generated voice. Audio is sent to the selected provider only after you enable conversation. Navi stays with you during the test. “End test” and “Next visitor” end the conversation. Maximum: 10 minutes.",
  "Встречать через камеру": "Welcome visitors with the camera",
  "Нави заметит лицо и пригласит в игру. После включения нажмите «Готово».": "Navi notices a face and invites the visitor to play. After enabling, tap “Done”.",
  "Включить камеру": "Enable camera",
  "Предпросмотр камеры": "Camera preview",
  "Подключаем камеру…": "Connecting camera…",
  "Готовим взгляд Нави…": "Preparing Navi’s gaze…",
  "Нави готов заметить гостя и следить за лицом.": "Navi is ready to notice a visitor and follow their face.",
  "Положение лица недоступно. Реакции на движение и касания работают.": "Face position is unavailable. Motion and touch reactions still work.",
  "Одно приветствие при подходе, с паузой не менее минуты. Нажатие на Нави включает разговор. Камера сама не включает микрофон. Видео остаётся на устройстве; личность не определяется.": "One greeting on arrival, at least a minute apart. Tapping Navi starts a conversation. The camera never starts the microphone. Video stays on this device; no identity is determined.",
  "Готово": "Done",
  "Камера выключена": "Camera off",
  "Камера включена": "Camera on",
  "Приветствуем гостя": "Welcoming a visitor",
  "Подключите камеру и включите её снова.": "Connect the camera and enable it again.",
  "В этом браузере камера недоступна. Начните игру кнопкой.": "Camera is unavailable in this browser. Use the start button.",
  "Разрешите доступ к камере или нажмите на Нави, чтобы услышать приглашение.": "Allow camera access, or tap Navi to hear an invitation.",
  "Камера не найдена. Нажмите на Нави или начните игру кнопкой.": "No camera found. Tap Navi or use the start button.",
  "Не удалось включить камеру.": "Could not enable the camera."
};

export type CameraHandle={invite:()=>void;play:(action:CreativeAction)=>void;stop:()=>void;startNarration:(game:GameContext,language:InvitationLanguage)=>void};
export default function CameraInvite({ref,idle,game,visitorName='',russianOnly=false,narration=false,voiceAllowed=true,controlledLanguage,onLanguageChange,onActivity,onGreeting,onMotion,onFace,onSpeech,onOpenChange}:{ref?:Ref<CameraHandle>;idle:boolean;game:GameContext;visitorName?:string;russianOnly?:boolean;narration?:boolean;voiceAllowed?:boolean;controlledLanguage?:InvitationLanguage;onLanguageChange?:(language:InvitationLanguage)=>void;onActivity?:()=>void;onGreeting:(text:string)=>void;onMotion?:(point:MotionPoint|null)=>void;onFace?:(point:MotionPoint|null)=>void;onSpeech?:(frame:SpeechFrame)=>void;onOpenChange?:(open:boolean)=>void}) {
  const video=useRef<HTMLVideoElement>(null), preview=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null);
  const requestId=useRef(0),gate=useRef(createArrivalGate()),pick=useRef(createShuffleBag<number>());
  const faceSeen=useRef(-Infinity),motionSeen=useRef(-Infinity),manualTime=useRef(-Infinity);
  const latest=useRef({idle,onGreeting,onMotion,onFace});
  const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false);
  const [status,setStatus]=useState("Камера выключена"),[error,setError]=useState("");
  const [localLanguage,setLanguage]=useState<InvitationLanguage>("ru");
  const language=controlledLanguage||localLanguage;
  const selectedVoice=useVoicePreference(language);
  const narrator=useNarratorPreference(language);
  const [voiceAnswers,setVoiceAnswers]=useVoiceAnswersSetting(),[answersError,setAnswersError]=useState("");
  const text=(value:string)=>{
    const narrationLabels:Record<string,[string,string]>={
      'Завершить разговор':['Выключить голос','Turn voice off'],
      'Поговорить с Нави — микрофон и OpenAI':['Включить голос Нави — без микрофона','Enable Navi’s voice — no microphone'],
      'Микрофон включён · можно говорить':['Голос включён · отвечайте на экране','Voice on · answer on screen'],
      'Микрофон включён. Можно говорить.':['Нави озвучивает подсказки.','Navi narrates the experience.'],
      'Завершаем разговор…':['Выключаем голос…','Turning voice off…'],
      'Живой разговор с Нави через микрофон.':['Нави говорит и реагирует на ответы на экране. Микрофон включается, только если разрешены ответы голосом.','Navi speaks and reacts to screen choices. The microphone is used only when answers by voice are on.'],
      'Начать разговор с Нави':['Включить голос Нави','Enable Navi’s voice'],
      'Поговорить с Нави':['Послушать Нави','Hear Navi'],
      'Синтезированный голос ИИ. Аудио передаётся OpenAI только после включения разговора. Нави остаётся с вами во время игры. «Завершить» и «Следующий участник» заканчивают разговор. Максимум — 10 минут.':['Голос создан ИИ. Нави озвучивает только подготовленные реплики и шутки и обращается к гостю по имени, если тот его ввёл. Провайдер получает только текст реплики — с этим именем, но без изображений и полей контакта; реплики с именем стенд не сохраняет. «Завершить» выключает голос.','AI-generated voice. Navi reads only approved lines and jokes, and addresses the visitor by the first name they typed, if any. The provider receives only the spoken script — with that name, but without images or contact fields; the booth never stores lines with a name. End stops the voice.'],
      'Одно приветствие при подходе, с паузой не менее минуты. Нажатие на Нави включает разговор. Камера сама не включает микрофон. Видео остаётся на устройстве; личность не определяется.':['Камера управляет взглядом Нави и показывает приглашение. Видео остаётся на устройстве. Голос начинается после касания; камера не включает микрофон.','The camera guides Navi’s gaze and displays an invitation. Video stays on this device. Voice starts after a tap; the camera never turns on the microphone.'],
    };
    if(narration&&narrationLabels[value])return narrationLabels[value][language==='en'?1:0];
    return language==='en'?(englishLabels[value]||value):value;
  };
  const [settingsOpen,setSettingsOpen]=useState(false);
  const paused=useRef(settingsOpen);
  const voice=useLiveVoice(onSpeech,onGreeting,onActivity);
  const playingRef=useRef(voice.busy);
  const stopVoice=voice.stop;
  const updateGame=voice.updateGame;
  const startVoice=voice.start;
  const setVoiceName=voice.setName;
  // The name goes first, so a screen that greets the visitor by name already has it when its line is requested.
  useEffect(()=>{setVoiceName(visitorName);},[visitorName,setVoiceName]);
  useEffect(()=>{updateGame(game);},[game,updateGame]);
  const faceStatus=useFaceTracking(enabled,settingsOpen,video,point=>{if(point)faceSeen.current=Date.now();latest.current.onFace?.(point);});
  const tracking=useRef(faceStatus);
  const connected=voice.phase==='ready';
  useLayoutEffect(()=>{latest.current={idle,onGreeting,onMotion,onFace};paused.current=settingsOpen;playingRef.current=voice.busy;tracking.current=faceStatus;},[idle,onGreeting,onMotion,onFace,settingsOpen,voice.phase,voice.busy,faceStatus]);

  function invite(mode:'auto'|'manual'|'preview'){
    if(mode!=='auto'&&!voiceAllowed)return;
    if(mode==='auto'&&(!latest.current.idle||voice.busy))return;
    if(mode==='manual'&&Date.now()-manualTime.current<1200)return;
    if(mode==='manual')manualTime.current=Date.now();
    const texts=invitationScripts[language];const index=pick.current(texts.map((_,i)=>i));
    if(mode==='auto')latest.current.onGreeting(texts[index]);
    if(mode!=='preview'){gate.current.invited(Date.now());latest.current.onMotion?.({x:0,y:0});setStatus('Приветствуем гостя');}
    if(connected)voice.greet();
    else if(mode!=='auto'&&!voice.busy)void voice.start(language,undefined,{narration,voice:savedVoice(language)});
  }
  function play(action:CreativeAction){
    onActivity?.();
    if(connected)voice.creative(action);else if(!voice.busy)void voice.start(language,action,{narration,voice:savedVoice(language)});
  }
  const playRef=useRef(play);
  useLayoutEffect(()=>{playRef.current=play;});
  const inviteRef=useRef(invite);
  useLayoutEffect(()=>{inviteRef.current=invite;});
  useImperativeHandle(ref,()=>({invite:()=>inviteRef.current('manual'),play:action=>playRef.current(action),stop:stopVoice,startNarration:(next,lang)=>{updateGame(next);void startVoice(lang,undefined,{narration:true,voice:savedVoice(lang)});}}),[stopVoice,updateGame,startVoice]);

  function stopCamera(){
    requestId.current++;stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;
    if(video.current)video.current.srcObject=null;if(preview.current)preview.current.srcObject=null;
    setEnabled(false);setBusy(false);setStatus('Камера выключена');voice.stop();gate.current.resetArrival();latest.current.onMotion?.(null);latest.current.onFace?.(null);
  }
  async function enableCamera(){
    setError('');setBusy(true);const request=++requestId.current;
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw Error('В этом браузере камера недоступна. Начните игру кнопкой.');
      const media=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:'user'},audio:false});
      if(request!==requestId.current){media.getTracks().forEach(track=>track.stop());return;}
      stream.current=media;if(video.current){video.current.srcObject=media;await video.current.play();}
      if(request!==requestId.current){media.getTracks().forEach(track=>track.stop());return;}
      if(preview.current){preview.current.srcObject=media;void preview.current.play().catch(()=>{});}
      gate.current.resetArrival();faceSeen.current=-Infinity;motionSeen.current=-Infinity;setEnabled(true);setStatus('Камера включена');
      media.getVideoTracks()[0]?.addEventListener('ended',()=>{if(request===requestId.current){stopCamera();setError('Подключите камеру и включите её снова.');}});
    }catch(cause){
      if(request!==requestId.current)return;
      stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;setEnabled(false);
      setError(cause instanceof DOMException&&cause.name==='NotAllowedError'?'Разрешите доступ к камере или нажмите на Нави, чтобы услышать приглашение.':cause instanceof DOMException&&cause.name==='NotFoundError'?'Камера не найдена. Нажмите на Нави или начните игру кнопкой.':cause instanceof Error?cause.message:'Не удалось включить камеру.');
    }finally{if(request===requestId.current)setBusy(false);}
  }

  useEffect(()=>{
    if(!enabled)return;
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=48;const context=canvas.getContext('2d',{willReadFrequently:true});
    let previous:Uint8ClampedArray|null=null,motionFrames=0;
    const timer=setInterval(()=>{
      if(document.hidden||paused.current){previous=null;motionFrames=0;return;}
      const source=video.current;
      if(source&&source.readyState>=2&&context&&tracking.current!=='ready'){
        context.drawImage(source,0,0,64,48);const current=context.getImageData(0,0,64,48).data;
        if(previous){const point=motionPosition(previous,current);motionFrames=point?motionFrames+1:0;if(motionFrames>=2)motionSeen.current=Date.now();}
        previous=new Uint8ClampedArray(current);
      }
      const now=Date.now();const present=tracking.current==='ready'?now-faceSeen.current<1500:now-motionSeen.current<1800;
      if(gate.current.observe(present,now)&&latest.current.idle&&!playingRef.current)inviteRef.current('auto');
    },250);
    return()=>clearInterval(timer);
  },[enabled]);
  useEffect(()=>{
    const hide=()=>{if(document.hidden){stopVoice();gate.current.resetArrival();faceSeen.current=-Infinity;motionSeen.current=-Infinity;}};
    document.addEventListener('visibilitychange',hide);
    return()=>{requestId.current++;stream.current?.getTracks().forEach(track=>track.stop());document.removeEventListener('visibilitychange',hide);};
  },[stopVoice]);

  return <>
    <video ref={video} muted playsInline className="camera-processing" aria-hidden="true"/>
    {!russianOnly&&<Select value={language} onValueChange={value=>{voice.stop();setLanguage(value === 'en' ? 'en' : 'ru');onLanguageChange?.(value === 'en' ? 'en' : 'ru');}}><SelectTrigger className="conversation-language" aria-label="Язык / Language"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ru">Русский</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select>}
    <Button variant="ghost" className={`icon-button voice-toggle ${connected?'voice-enabled':''}`} disabled={voice.phase==='closing'||(!voice.busy&&!voiceAllowed)} title={voice.busy?text("Завершить разговор"):text("Поговорить с Нави — микрофон и OpenAI")} aria-label={voice.busy?text("Завершить разговор"):text("Поговорить с Нави — микрофон и OpenAI")} aria-pressed={voice.busy} onClick={voice.busy?voice.stop:()=>invite('preview')}>{narration?(voice.busy?<Volume/>:<VolumeOff/>):(voice.busy?<Mic/>:<MicOff/>)}</Button>
    {!settingsOpen&&(voice.error||voice.busy)&&<span className={`voice-notice ${connected?'live-connected':''}`} role="status">{voice.playbackBlocked?<Button variant="outline" onClick={voice.resumePlayback}>{text("Включить звук")}</Button>:voice.error|| (connected?text("Микрофон включён · можно говорить"):voice.phase==='closing'?text("Завершаем разговор…"):text("Подключаем Нави…"))}</span>}
    <Dialog onOpenChange={open=>{paused.current=open;setSettingsOpen(open);onOpenChange?.(open);gate.current.resetArrival();faceSeen.current=-Infinity;motionSeen.current=-Infinity;voice.stop();}}>
      <DialogTrigger asChild><Button variant="ghost" className="icon-button" title={text("Настройки стенда")} aria-label={text("Настройки стенда")}><Settings/></Button></DialogTrigger>
      <DialogContent className="booth-settings" showCloseButton={false}>
        <DialogTitle>{text("Настройки стенда")}</DialogTitle><DialogDescription>{text("Живой разговор с Нави через микрофон.")}</DialogDescription>
        <div className="setting-row"><div><strong>{text("Голос Нави")}</strong><p>{connected?text("Микрофон включён. Можно говорить."):(narration?`${modelById(narrator.model)?.name} · ${narrator.name}`:`GPT‑Realtime‑1.5 · ${selectedVoice}`)}</p></div><Switch aria-label={text("Начать разговор с Нави")} checked={voice.busy} disabled={voice.phase==='closing'||(!voice.busy&&!voiceAllowed)} onCheckedChange={value=>value?invite('preview'):voice.stop()}/></div>
        {narration&&<div className="narration-voice-choice"><a href="/voices" target="_blank" rel="noreferrer">{language==='en'?'Choose a provider, model and voice':'Выбрать провайдера, модель и голос'}</a></div>}
        <div className="voice-audition">{!russianOnly&&<Select value={language} onValueChange={value=>{voice.stop();setLanguage(value === 'en' ? 'en' : 'ru');onLanguageChange?.(value === 'en' ? 'en' : 'ru');}}><SelectTrigger aria-label={text("Язык разговора")}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ru">Русский</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select>}<Button variant="outline" disabled={voice.phase==='closing'||(!voice.busy&&!voiceAllowed)} onClick={voice.busy?voice.stop:()=>invite('preview')}>{voice.busy?<Stop size={15}/>:<Play size={15}/>} {voice.busy?text("Завершить разговор"):text("Поговорить с Нави")}</Button></div>
        {voice.playbackBlocked&&<Button variant="outline" onClick={voice.resumePlayback}>{text("Включить звук")}</Button>}
        <p className="voice-credit">{text("Синтезированный голос ИИ. Аудио передаётся OpenAI только после включения разговора. Нави остаётся с вами во время игры. «Завершить» и «Следующий участник» заканчивают разговор. Максимум — 10 минут.")}</p>
        {voice.error&&<p className="inline-error" role="alert">{voice.error}</p>}
        {narration&&<div className="setting-row"><div><strong>{language==='en'?'Answers by voice':'Ответы голосом'}</strong><p>{language==='en'?'Visitors can say an answer instead of tapping it. The microphone works only on the questions and pauses while Navi speaks. ElevenLabs recognizes the speech; the booth keeps neither audio nor text.':'Гость может назвать ответ вслух вместо касания. Микрофон работает только на вопросах и молчит, пока говорит Нави. Речь распознаёт ElevenLabs; стенд не сохраняет ни звук, ни текст.'}</p></div><Switch aria-label={language==='en'?'Answers by voice':'Ответы голосом'} checked={voiceAnswers} onCheckedChange={value=>{setAnswersError('');void setVoiceAnswers(value).catch(()=>setAnswersError(language==='en'?'Microphone access is blocked. Allow it in the browser and try again.':'Нет доступа к микрофону. Разрешите его в браузере и попробуйте снова.'));}}/></div>}
        {answersError&&<p className="inline-error" role="alert">{answersError}</p>}
        <div className="setting-row"><div><strong>{text("Встречать через камеру")}</strong><p>{text("Нави заметит лицо и пригласит в игру. После включения нажмите «Готово».")}</p></div><Switch aria-label={text("Включить камеру")} checked={enabled} disabled={busy} onCheckedChange={value=>value?void enableCamera():stopCamera()}/></div>
        <div className="setting-camera-state"><video ref={node=>{preview.current=node;if(node&&stream.current){node.srcObject=stream.current;void node.play().catch(()=>{});}}} muted playsInline className={enabled?'settings-preview':'hidden-preview'} aria-label={text("Предпросмотр камеры")}/><span role="status">{busy?text("Подключаем камеру…"):text(status)}</span></div>
        {enabled&&<p className="face-tracking-state" role="status">{faceStatus==='loading'?text("Готовим взгляд Нави…"):faceStatus==='ready'?text("Нави готов заметить гостя и следить за лицом."):faceStatus==='unavailable'?text("Положение лица недоступно. Реакции на движение и касания работают."):''}</p>}
        <p className="settings-note">{text("Одно приветствие при подходе, с паузой не менее минуты. Нажатие на Нави включает разговор. Камера сама не включает микрофон. Видео остаётся на устройстве; личность не определяется.")}</p>
        {error&&<p className="inline-error" role="alert">{text(error)}</p>}
        <DialogClose asChild><Button className="primary-button settings-done">{text("Готово")}</Button></DialogClose>
      </DialogContent>
    </Dialog>
  </>;
}
