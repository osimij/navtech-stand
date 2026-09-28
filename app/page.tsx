"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, ChevronDown, Globe, Mic, MicOff, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questions, scoreAnswers, interestLabels, type QuizLanguage } from "@/lib/quiz";
import CameraInvite, { type CameraHandle } from "./camera";
import { NaviSeat, NaviStage, type NaviHandle } from "./navi";
import { createSessionSync, type SaveState } from "@/lib/session-sync";
import { taskPreviews, englishTaskPreviews } from "@/lib/work-context";
import { matchSpokenAnswer } from "@/lib/voice-answer-match";
import { useVoiceAnswers, useVoiceAnswersSetting } from "@/lib/use-voice-answers";
import CareerResults from "./career-results";
import { TaskIcon } from "./career-visuals";
import { Header  } from "./shell";

type Phase = "welcome" | "quiz" | "result" | "contact" | "success";
type Session = { id: string; token: string };

async function api(path: string, method: string, payload: unknown, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000),
    });
  } catch {
    throw Error("Нет соединения. Попробуйте ещё раз — ваши ответы остались на экране.");
  }
  const data = await response.json() as { error?: string; answers?: number[] };
  if (!response.ok) throw Error(data.error || "Не удалось сохранить. Попробуйте ещё раз.");
  return data;
}

export default function Home() {
  const [chosenLanguage, setLanguage] = useState<QuizLanguage | null>(null);
  const language = chosenLanguage || 'ru';
  const en=language==='en';
  const [editing,setEditing]=useState(false);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const sessionSync = useRef<ReturnType<typeof createSessionSync> | null>(null);
  const generation = useRef(0);
  const [busy, setBusy] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [arriving, setArriving] = useState(false);
  const arrivalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("");
  const [idleLeft, setIdleLeft] = useState(120);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [interest, setInterest] = useState("");
  const [consent, setConsent] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shownRole, setShownRole] = useState<string | null>(null);
  const touched = useRef(0);
  const title = useRef<HTMLHeadingElement>(null);
  const submitLock = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mascot = useRef<NaviHandle>(null);
  const invitations = useRef<CameraHandle>(null);
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Spoken answers: switched on for this device in booth settings; a visitor can still turn the microphone off.
  const [voiceAnswersOn] = useVoiceAnswersSetting();
  const [micOff, setMicOff] = useState(false);

  const greet = useCallback((text: string) => {
    setGreeting(text);
    if (greetingTimer.current) clearTimeout(greetingTimer.current);
    greetingTimer.current = setTimeout(() => setGreeting(""), 8000);
  }, []);

  const reset = useCallback(() => {
    invitations.current?.stop();
    generation.current++; sessionSync.current?.dispose(); sessionSync.current=null;
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setSaveState('idle'); setSaveError('');
    setPhase("welcome"); setLanguage(null); setEditing(false); setAnswers([]); setStep(0); setSelected(null);
    setSession(null); setBusy(false); setAdvancing(false); setLeaving(false); setError("");
    setName(""); setCompany(""); setContact(""); setInterest(""); setConsent(false);
    setGreeting(""); setShownRole(null); setMicOff(false);
    if (greetingTimer.current) clearTimeout(greetingTimer.current);
    touched.current = Date.now(); setIdleLeft(120);
    submitLock.current = false;
  }, []);

  useEffect(() => {
    touched.current = Date.now();
    const touch = () => { touched.current = Date.now(); };
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    const timer = setInterval(() => {
      if (busy || advancing || settingsOpen) return;
      if (phase === "welcome") { if (chosenLanguage && Date.now() - touched.current > 60000) reset(); return; }
      const limit = phase === "success" ? 20 : 120;
      const left = Math.max(0, limit - Math.floor((Date.now() - touched.current) / 1000));
      setIdleLeft(left);
      if (left === 0) reset();
    }, 1000);
    return () => {
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
      clearInterval(timer);
    };
  }, [phase, chosenLanguage, busy, advancing, settingsOpen, reset]);

  useEffect(() => {
    const heading = title.current;
    window.scrollTo({ top: 0, behavior: "instant" });
    heading?.focus({ preventScroll: true });
    if (heading) {
      const rect = heading.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) heading.scrollIntoView({ block: "start" });
    }
    // Navi reads each new question with the visitor, then looks at what it asks them to do.
    if (phase === "quiz") mascot.current?.read(heading, ".question-options");
    else if (phase === "welcome") mascot.current?.read(heading, chosenLanguage ? ".intro-start" : ".intro-actions");
    else if (phase === "result") mascot.current?.lookAt(".board-role", 1800);
  }, [phase, step, chosenLanguage]);

  useEffect(() => { if (phase === "result" && shownRole) mascot.current?.lookAt(".board-role", 1500); }, [phase, shownRole]);

  useEffect(() => () => {
    generation.current++; sessionSync.current?.dispose();
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    if (greetingTimer.current) clearTimeout(greetingTimer.current);
    if (arrivalTimer.current) clearTimeout(arrivalTimer.current);
  }, []);

  const result = answers.length === questions.length ? scoreAnswers(answers) : null;
  const mascotMood = error ? "reassuring" : busy ? "thinking" : phase === "result" || phase === "success" ? "celebrate" : advancing ? "acknowledge" : phase === "quiz" ? "thinking" : "neutral";

  function chooseLanguage(next: QuizLanguage) {
    if (submitLock.current) return;
    submitLock.current = true; invitations.current?.stop(); setAdvancing(true); mascot.current?.cheer("answer");
    const fade = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200;
    transitionTimer.current = setTimeout(() => {
      setLanguage(next); setAdvancing(false); setGreeting("");
      touched.current = Date.now(); submitLock.current = false;
    }, fade);
  }

  function changeLanguage() {
    if (submitLock.current) return;
    invitations.current?.stop(); setLanguage(null); setGreeting(""); setError("");
    touched.current = Date.now();
  }

  function start() {
    if (submitLock.current || !chosenLanguage) return;
    submitLock.current=true; setAdvancing(true);
    transitionTimer.current=setTimeout(()=>{submitLock.current=false;setAdvancing(false);},220);
    setError(''); setSaveError(''); setSaveState('idle'); setGreeting('');
    const current = { id: crypto.randomUUID(), token: crypto.randomUUID() };
    const owner = ++generation.current;
    sessionSync.current?.dispose();
    const sync = createSessionSync(current, (method,payload,signal)=>api('/api/sessions',method,payload,signal), state=>{
      if (generation.current !== owner) return;
      setSaveState(state); if(state==='saved')setSaveError('');
    });
    sessionSync.current=sync; setSession(current);
    setPhase('quiz'); setIdleLeft(120); touched.current=Date.now();
    // The first question waits a beat while Navi hops up to its seat above it.
    setArriving(true); if (arrivalTimer.current) clearTimeout(arrivalTimer.current);
    arrivalTimer.current = setTimeout(() => setArriving(false), 1400);
    invitations.current?.startNarration({phase:'quiz',step:0,answers:[],selected:null,interest:''}, language);
    // The visitor can participate immediately, including during a slow or failed start request.
    void sync.start().catch(()=>{});
  }

  async function persistResult(completed: number[]) {
    const owner=generation.current;
    setSaveError('');
    try { await sessionSync.current?.finish(completed); }
    catch { if(generation.current===owner) setSaveError('Результат готов. Пока не удалось добавить его в аналитику стенда.'); }
  }

  async function answer(value: number, event?: MouseEvent<HTMLButtonElement>) {
    if (submitLock.current) return;
    submitLock.current = true; setSelected(value); setError("");
    if(event){const rect=event.currentTarget.getBoundingClientRect();mascot.current?.reactTo(event.detail?event.clientX:rect.left+rect.width/2,event.detail?event.clientY:rect.top+rect.height/2,rect);}
    const nextAnswers = [...answers];
    nextAnswers[step] = value;
    setAnswers(nextAnswers);

    const finished = editing || step === questions.length - 1;
    setAdvancing(true);
    // The choice stays visible for a moment, then the question fades and the next screen rises in.
    // A double tap cannot answer two questions: the lock holds until the new options have appeared.
    transitionTimer.current = setTimeout(() => {
      setLeaving(true);
      transitionTimer.current = setTimeout(() => {
        setLeaving(false);
        if (finished) {
          // The payoff is local and immediate. Neither saving nor AI speech can gate this screen.
          setPhase('result'); setEditing(false); setGreeting(''); setIdleLeft(120);
          setAdvancing(false); submitLock.current = false;
          void persistResult(nextAnswers);
          return;
        }
        setStep(step + 1);
        setSelected(nextAnswers[step + 1] ?? null);
        transitionTimer.current = setTimeout(() => {
          setAdvancing(false); submitLock.current = false;
        }, 220);
      }, 150);
    }, 200);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true; setBusy(true); setError("");
    const owner=generation.current;
    try {
      if (!sessionSync.current) throw Error("Начните знакомство заново.");
      await sessionSync.current.finish(answers);
      if(generation.current!==owner)return;
      await api("/api/leads", "POST", { ...session, name, company, contact, interest, consent });
      if(generation.current!==owner)return;
      setName(""); setCompany(""); setContact(""); setConsent(false);
      setPhase("success"); setIdleLeft(20);
    } catch (e) { if(generation.current===owner)setError((e as Error).message); }
    finally { if(generation.current===owner){setBusy(false); submitLock.current = false;} }
  }

  function back() {
    if (busy || advancing || step === 0) return;
    setStep(step - 1); setSelected(answers[step - 1] ?? null); setError("");
  }

  const gameContext = useMemo(() => ({ phase, step, answers, selected, interest }), [phase, step, answers, selected, interest]);

  // The visitor may name an answer instead of tapping it. What was heard shows in Navi's caption; an unclear reply
  // selects nothing and asks again. The chosen answer then behaves exactly like a tap.
  const choose = useRef(answer);
  useLayoutEffect(() => { choose.current = answer; });
  const heard = useCallback((said: string) => {
    if (phase !== "quiz" || submitLock.current || busy || advancing) return;
    touched.current = Date.now();
    const previews = en ? englishTaskPreviews : taskPreviews;
    const match = matchSpokenAnswer(said, questions[step].options.map((option, index) => ({ heading: previews[step][index].title, text: en ? option.en : option.text })));
    if (!match) { greet(en ? `I didn’t catch which answer: “${said}”. Say its title or tap it.` : `Не удалось понять, какой ответ: «${said}». Назовите его или коснитесь.`); return; }
    greet(en ? `“${said}”` : `«${said}»`);
    const rect = document.querySelectorAll<HTMLElement>(".question-option")[match.index]?.getBoundingClientRect();
    if (rect) mascot.current?.reactTo(rect.left + rect.width / 2, rect.top + rect.height / 2, rect);
    void choose.current(match.index);
  }, [phase, busy, advancing, en, step, greet]);
  const hearing = useCallback((said: string) => { if (said && !submitLock.current) greet(en ? `“${said}…”` : `«${said}…»`); }, [en, greet]);
  const keyterms = useMemo(() => (en ? englishTaskPreviews : taskPreviews).flat().map(preview => preview.title), [en]);
  const { state: listenState, error: listenError, bindIndicator, naviSpeaking, restart: restartListening } = useVoiceAnswers({
    active: voiceAnswersOn && phase === "quiz" && Boolean(chosenLanguage) && !settingsOpen && !micOff,
    language, keyterms, onFinal: heard, onPartial: hearing,
  });
  const listenFailed = listenState === "error" && !micOff;
  // A hidden page releases the microphone; the visitor turns it back on with the header control.
  useEffect(() => {
    const hide = () => { if (document.hidden) setMicOff(true); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  const listenControl = voiceAnswersOn && phase === "quiz" && <button type="button" ref={bindIndicator} className={`icon-button listen-toggle is-${micOff ? "off" : listenState}`} onClick={() => { if (listenFailed) restartListening(); else setMicOff(!micOff); }} aria-pressed={!micOff && !listenFailed} aria-label={micOff || listenFailed ? (en ? "Turn on voice answers" : "Включить ответ голосом") : (en ? "Voice answers on. Turn off the microphone" : "Ответ голосом включён. Выключить микрофон")} title={listenFailed ? listenError : undefined}>{micOff || listenFailed ? <MicOff /> : <Mic />}</button>;

  const questionBar = (
    <div className="question-bar" role="group" aria-label={en ? "Test progress" : "Ход теста"}>
      <button type="button" className="question-nav" hidden={!editing && step === 0} disabled={busy || advancing} onClick={() => editing ? (setEditing(false), setPhase('result')) : back()} aria-label={editing ? (en ? 'Back to results' : 'К результату') : (en ? 'Back' : 'Назад')}><ArrowLeft size={18} /><span className="question-nav-label">{editing ? (en ? 'Results' : 'К результату') : (en ? 'Back' : 'Назад')}</span></button>
      <div className="question-progress" role="progressbar" aria-label={en ? 'Situation' : 'Ситуация'} aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={step + 1} aria-valuetext={`${step + 1} / ${questions.length}`}>
        {questions.map((_, index) => <span key={index} className={index < step ? 'is-done' : index === step ? 'is-current' : ''} />)}
      </div>
    </div>
  );

  return <div className={`app-shell visitor-shell career-shell state-${phase} ${phase === "welcome" ? "is-intro" : ""}`}>
    <div className="ambient-glow" data-role={phase === "result" ? shownRole ?? undefined : undefined} aria-hidden="true" />
    <NaviStage ref={mascot} mood={mascotMood} active={!settingsOpen}>
    <Header language={language} center={phase === "quiz" ? questionBar : undefined} actions={<>{(phase === "quiz" || phase === "result" || phase === "contact") && <button type="button" className="question-nav question-end" disabled={busy || advancing} onClick={reset} aria-label={en ? "End test" : "Завершить"}><X size={18} className="question-end-icon" /><span className="question-nav-label">{en ? "End test" : "Завершить"}</span></button>}{phase === "welcome" && chosenLanguage && <button type="button" className="language-switch" onClick={changeLanguage} aria-label={en ? "Change language" : "Сменить язык"}><Globe size={18} />{en ? "EN" : "RU"}</button>}{listenControl}<CameraInvite ref={invitations} game={gameContext} russianOnly narration voiceAllowed={Boolean(chosenLanguage)} controlledLanguage={language} onActivity={() => { touched.current = Date.now(); }} idle={phase === "welcome" && !busy} onGreeting={greet} onMotion={point => mascot.current?.notice(point)} onFace={point => mascot.current?.trackFace(point)} onSpeech={frame => { mascot.current?.speak(frame); naviSpeaking(frame.speaking); }} onOpenChange={setSettingsOpen} /></>} />
    <main className={`booth-grid phase-${phase}`}>
      <section className="play-panel" aria-label={en?"Explore with Navi":"Игра с Нави"}>
        {(phase === "contact" || phase === "success") && <div className="result-navi">
          <NaviSeat id="corner" label={en?"Hear a hint from Navi":"Подсказка Нави"} hint={en?"Tap for a hint":"Нажмите для подсказки"} onGreet={() => {if(chosenLanguage)invitations.current?.invite();}} />
          <p className="navi-caption" aria-live="polite">{greeting}</p>
        </div>}

        {phase === "welcome" && <div className={`intro ${advancing && !chosenLanguage ? "is-leaving" : ""}`}>
          <div className="intro-navi"><NaviSeat id="intro" hero label={chosenLanguage ? (en ? "Hear a hint from Navi" : "Подсказка Нави") : "Нави · Navi"} hint={chosenLanguage ? (en ? "Tap for a hint" : "Нажмите для подсказки") : ""} onGreet={() => {if(chosenLanguage)invitations.current?.invite();}} /></div>
          {chosenLanguage ? <div className="intro-step" key="home">
            <h1 ref={title} tabIndex={-1} className="intro-title">{en?<>How do you approach<br/>work challenges?</>:<>Как вы решаете<br/>рабочие задачи?</>}</h1>
            <div className="intro-actions"><Button className="primary-button intro-start" onClick={start}>{en?'Start the demonstration':'Начать демонстрацию'}<ArrowRight /></Button></div>
            <p className="intro-note" role={error ? "alert" : undefined} aria-live="polite">{error || greeting}</p>
          </div> : <div className="intro-step" key="language">
            <h1 ref={title} tabIndex={-1} className="intro-title" lang="ru">На каком языке<br/>вы говорите?</h1>
            <p className="intro-translation" lang="en">What language do you speak?</p>
            <div className="intro-actions" role="group" aria-label="Язык / Language">
              <button type="button" className="language-option" lang="ru" disabled={advancing} onClick={() => chooseLanguage("ru")}>Русский</button>
              <button type="button" className="language-option" lang="en" disabled={advancing} onClick={() => chooseLanguage("en")}>English</button>
            </div>
          </div>}
        </div>}

        {phase === "quiz" && <div className={`question ${leaving ? "is-leaving" : ""} ${arriving ? "is-arriving" : ""}`}>
          <div className="question-navi">
            <NaviSeat id="question" label={en?"Hear a hint from Navi":"Подсказка Нави"} hint={en?"Tap for a hint":"Нажмите для подсказки"} onGreet={() => invitations.current?.invite()} />
            <p className="navi-caption" aria-live="polite">{greeting || (listenFailed ? listenError : "")}</p>
          </div>
          <div className="question-step" key={step}>
            <h1 ref={title} tabIndex={-1} className="question-title">{en ? questions[step].en : questions[step].title}</h1>
            <div className="question-options">
              {questions[step].options.map((option, index) => <button
                key={index}
                type="button"
                className="question-option"
                aria-pressed={selected === index}
                disabled={busy || advancing}
                onClick={event => answer(index, event)}
              ><span className="question-option-icon"><TaskIcon question={step} option={index} /></span><span className="question-option-text"><strong>{(en ? englishTaskPreviews : taskPreviews)[step][index].title}</strong>{en ? option.en : option.text}</span>{selected === index && <Check size={20} />}</button>)}
            </div>
          </div>
        </div>}

        {phase === "result" && result && <div className="result-content">
          <CareerResults key={answers.join(',')} answers={answers} language={language} onRole={setShownRole} onEdit={index=>{setEditing(true);setStep(index);setSelected(answers[index]);setPhase('quiz');}}/>
          <div className="result-navi">
            <NaviSeat id="corner" label={en?"Hear a hint from Navi":"Подсказка Нави"} hint={en?"Tap for a hint":"Нажмите для подсказки"} onGreet={() => invitations.current?.invite()} />
            <p className="navi-caption" aria-live="polite">{greeting}</p>
          </div>
          {(saveState==='error'||saveError)&&<div className="result-save-notice" role="status"><span>{en?'Your result is ready. The booth statistics have not been updated yet.':'Результат готов. Пока не удалось добавить его в аналитику стенда.'}</span><Button variant="ghost" onClick={()=>void persistResult(answers)} disabled={saveState==='saving'}>{en?'Retry saving':'Повторить сохранение'}</Button></div>}
        </div>}

        {/* The closing steps share the result's card: a round control at the corner inset, capsule fields and one
            capsule action along the bottom edge. */}
        {phase === "contact" && <form className="flow-card contact-card" onSubmit={save}>
          <div className="sheet-bar"><button type="button" className="sheet-corner" disabled={busy} onClick={() => setPhase("result")} aria-label={en?"Back to results":"К результату"}><ArrowLeft size={20} /></button></div>
          <h1 ref={title} tabIndex={-1} className="flow-title">{en ? "Meet the NavTech team." : "Обсудим вашу задачу."}</h1>
          <p className="flow-description">{en ? "Leave a contact to discuss HR Agent and Prism." : "Оставьте контакт для разговора о HR Agent и Prism."}</p>
          <div className="contact-fields">
            <label className="form-field">{en?"Your name":"Ваше имя"}<Input autoComplete="off" maxLength={80} minLength={2} required value={name} onChange={e => setName(e.target.value)} placeholder={en?"What should we call you?":"Как к вам обращаться"} /></label>
            <label className="form-field">{en?"Phone, email or Telegram":"Телефон, почта или Telegram"}<Input autoComplete="off" required maxLength={150} value={contact} onChange={e => setContact(e.target.value)} placeholder="+992 … / name@company.tj / @username" /></label>
            <div className="form-field"><span id="contact-topic-label">{en?"Topic":"Тема разговора"}</span><Select value={interest} onValueChange={setInterest} required><SelectTrigger aria-labelledby="contact-topic-label"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(interestLabels).filter(([id])=>id!=="career").map(([id,label]) => <SelectItem key={id} value={id}>{en?({hr:"HR Agent",prism:"Prism",both:"Both products",career:"Career at NavTech"}[id]||label):label}</SelectItem>)}</SelectContent></Select></div>
            <details className="company-details"><summary>{en?"Add company":"Добавить компанию"}<ChevronDown size={15} /></summary><label className="form-field"><span className="visually-hidden">{en?"Company":"Компания"}</span><Input autoComplete="off" maxLength={120} value={company} onChange={e => setCompany(e.target.value)} placeholder={en?"Company name":"Название компании"} /></label></details>
          </div>
          <label className="consent-label"><Checkbox checked={consent} onCheckedChange={value => setConsent(value === true)} aria-label={en?"Consent to contact from NavTech":"Согласие на связь с NavTech"} /><span>{en?"I agree to share my name, contact, company and result with NavTech for follow-up on this topic. Withdraw consent: ":"Согласен передать NavTech имя, контакт, компанию и результат для связи по выбранной теме. Отозвать согласие: "}<a href="mailto:info@navtech.tj">info@navtech.tj</a>.</span></label>
          {error && <p className="flow-error" role="alert">{error}</p>}
          <Button type="submit" className="primary-button flow-action" disabled={!consent || !interest || busy}>{busy ? (en?"Saving…":"Сохраняем…") : (en?"Request a conversation":"Договориться о разговоре")}<ArrowRight /></Button>
        </form>}

        {phase === "success" && <div className="flow-card success-card">
          <div className="success-icon"><Check /></div>
          <h1 ref={title} tabIndex={-1} className="flow-title">{en?"Thank you for joining us.":"Спасибо за знакомство."}</h1>
          <p className="flow-description">{en?"Your request is saved. The team will contact you.":"Запрос сохранён. Команда свяжется с вами."}</p>
          <span className="fine-print">{en?`New test in ${idleLeft}s`:`Новая игра через ${idleLeft} сек.`}</span>
          <Button className="primary-button flow-action" onClick={reset}>{en?"Next visitor":"Следующий участник"}<ArrowRight /></Button>
        </div>}

        {error && phase !== "welcome" && phase !== "contact" && <div className="form-error" role="alert"><p>{error}</p></div>}
        {phase !== "welcome" && phase !== "success" && idleLeft <= 15 && <div className="timeout-notice" role="alert">{en?`New test in ${idleLeft}s`:`Новая игра через ${idleLeft} сек.`}<Button variant="outline" onClick={() => { touched.current = Date.now(); setIdleLeft(120); }}>{en?"I’m still here":"Я ещё здесь"}</Button></div>}
      </section>
    </main>
    </NaviStage>
    {(phase === "result" || (phase === "welcome" && chosenLanguage)) && <nav className="prism-ribbon" aria-label="Prism"><Link href="/screen" target="_blank" rel="noreferrer"><strong>Prism</strong> — {en ? "see the shared picture" : "посмотреть общую картину"}</Link>{phase === "result" && <button type="button" onClick={() => { setInterest("both"); setPhase("contact"); }}>{en ? "Talk to the NavTech team" : "Обсудить продукты NavTech"}</button>}</nav>}
  </div>;
}
