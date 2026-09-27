"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, ChevronDown, Globe, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questions, scoreAnswers, interestLabels, type QuizLanguage } from "@/lib/quiz";
import CameraInvite, { type CameraHandle } from "./camera";
import Mascot, { type MascotHandle } from "./mascot";
import { createSessionSync, type SaveState } from "@/lib/session-sync";
import { taskPreviews, englishTaskPreviews } from "@/lib/work-context";
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
  const mascot = useRef<MascotHandle>(null);
  const invitations = useRef<CameraHandle>(null);
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setGreeting(""); setShownRole(null);
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
  }, [phase, step, chosenLanguage]);

  useEffect(() => () => {
    generation.current++; sessionSync.current?.dispose();
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    if (greetingTimer.current) clearTimeout(greetingTimer.current);
  }, []);

  const result = answers.length === questions.length ? scoreAnswers(answers) : null;
  const mascotMood = error ? "reassuring" : busy ? "thinking" : phase === "result" || phase === "success" ? "celebrate" : advancing ? "acknowledge" : phase === "quiz" ? "thinking" : "neutral";

  function chooseLanguage(next: QuizLanguage) {
    if (submitLock.current) return;
    submitLock.current = true; invitations.current?.stop(); setAdvancing(true);
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
    <Header language={language} center={phase === "quiz" ? questionBar : undefined} actions={<>{(phase === "quiz" || phase === "result") && <button type="button" className="question-nav question-end" disabled={busy || advancing} onClick={reset} aria-label={en ? "End test" : "Завершить"}><X size={18} className="question-end-icon" /><span className="question-nav-label">{en ? "End test" : "Завершить"}</span></button>}{phase === "welcome" && chosenLanguage && <button type="button" className="language-switch" onClick={changeLanguage} aria-label={en ? "Change language" : "Сменить язык"}><Globe size={18} />{en ? "EN" : "RU"}</button>}<CameraInvite ref={invitations} game={gameContext} russianOnly narration voiceAllowed={Boolean(chosenLanguage)} controlledLanguage={language} onActivity={() => { touched.current = Date.now(); }} idle={phase === "welcome" && !busy} onGreeting={greet} onMotion={point => mascot.current?.notice(point)} onFace={point => mascot.current?.trackFace(point)} onSpeech={frame => mascot.current?.speak(frame)} onOpenChange={setSettingsOpen} /></>} />
    <main className={`booth-grid phase-${phase}`}>
      <section className="play-panel" aria-label={en?"Explore with Navi":"Игра с Нави"}>
        {(phase === "contact" || phase === "success") && <div className="panel-top">
          <div className="panel-companion"><Mascot label={en?"Hear a hint from Navi":"Подсказка Нави"} hint={en?"Tap for a hint":"Нажмите для подсказки"} ref={mascot} compact mood={mascotMood} active={!settingsOpen} onGreet={() => {if(chosenLanguage)invitations.current?.invite();}} /><span className="panel-product">{en?"Navi":"Нави"} <span>· NavTech</span></span></div>
          <Button variant="ghost" className="reset-button" disabled={busy || advancing} onClick={reset}>{en?'End test':'Завершить'}</Button>
        </div>}

        {(phase === "contact" || phase === "success") && greeting && <p className="game-caption voice-caption-subordinate" aria-live="polite">{greeting}</p>}

        {phase === "welcome" && <div className={`intro ${advancing && !chosenLanguage ? "is-leaving" : ""}`}>
          <div className="intro-navi"><Mascot label={chosenLanguage ? (en ? "Hear a hint from Navi" : "Подсказка Нави") : "Нави · Navi"} hint={chosenLanguage ? (en ? "Tap for a hint" : "Нажмите для подсказки") : ""} ref={mascot} mood={mascotMood} active={!settingsOpen && !busy} onGreet={() => {if(chosenLanguage)invitations.current?.invite();}} /></div>
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

        {phase === "quiz" && <div className={`question ${leaving ? "is-leaving" : ""}`}>
          <div className="question-navi">
            <Mascot label={en?"Hear a hint from Navi":"Подсказка Нави"} hint={en?"Tap for a hint":"Нажмите для подсказки"} ref={mascot} compact mood={mascotMood} active={!settingsOpen} onGreet={() => invitations.current?.invite()} />
            <p className="navi-caption" aria-live="polite">{greeting}</p>
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
            <Mascot label={en?"Hear a hint from Navi":"Подсказка Нави"} hint={en?"Tap for a hint":"Нажмите для подсказки"} ref={mascot} compact mood={mascotMood} active={!settingsOpen} onGreet={() => invitations.current?.invite()} />
            <p className="navi-caption" aria-live="polite">{greeting}</p>
          </div>
          {(saveState==='error'||saveError)&&<div className="result-save-notice" role="status"><span>{en?'Your result is ready. The booth statistics have not been updated yet.':'Результат готов. Пока не удалось добавить его в аналитику стенда.'}</span><Button variant="ghost" onClick={()=>void persistResult(answers)} disabled={saveState==='saving'}>{en?'Retry saving':'Повторить сохранение'}</Button></div>}
        </div>}

        {phase === "contact" && <form className="flow-content contact-form" onSubmit={save}>
          <h1 ref={title} tabIndex={-1} className="flow-title">{en ? "Meet the NavTech team." : "Обсудим вашу задачу."}</h1>
          <p className="flow-description">{en ? "Leave a contact to discuss HR Agent and Prism." : "Оставьте контакт для разговора о HR Agent и Prism."}</p>
          <div className="contact-fields">
            <label className="form-field">{en?"Your name":"Ваше имя"}<Input autoComplete="off" maxLength={80} minLength={2} required value={name} onChange={e => setName(e.target.value)} placeholder={en?"What should we call you?":"Как к вам обращаться"} /></label>
            <label className="form-field">{en?"Phone, email or Telegram":"Телефон, почта или Telegram"}<Input autoComplete="off" required maxLength={150} value={contact} onChange={e => setContact(e.target.value)} placeholder="+992 … / name@company.tj / @username" /></label>
          </div>
          <details className="company-details"><summary>{en?"Add company":"Добавить компанию"}<ChevronDown size={15} /></summary><label className="form-field"><span className="visually-hidden">{en?"Company":"Компания"}</span><Input autoComplete="off" maxLength={120} value={company} onChange={e => setCompany(e.target.value)} placeholder={en?"Company name":"Название компании"} /></label></details>
          <div className="contact-topic"><span>{en?"Topic":"Тема разговора"}</span><Select value={interest} onValueChange={setInterest} required><SelectTrigger aria-label={en?"Topic":"Тема разговора"}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(interestLabels).filter(([id])=>id!=="career").map(([id,label]) => <SelectItem key={id} value={id}>{en?({hr:"HR Agent",prism:"Prism",both:"Both products",career:"Career at NavTech"}[id]||label):label}</SelectItem>)}</SelectContent></Select></div>
          <label className="consent-label"><Checkbox checked={consent} onCheckedChange={value => setConsent(value === true)} aria-label={en?"Consent to contact from NavTech":"Согласие на связь с NavTech"} /><span>{en?"I agree to share my name, contact, company and result with NavTech for follow-up on this topic. Withdraw consent: ":"Согласен передать NavTech имя, контакт, компанию и результат для связи по выбранной теме. Отозвать согласие: "}<a href="mailto:info@navtech.tj">info@navtech.tj</a>.</span></label>
          <div className="result-actions"><Button type="submit" className="primary-button" disabled={!consent || !interest || busy}>{busy ? (en?"Saving…":"Сохраняем…") : (en?"Request a conversation":"Договориться о разговоре")}<ArrowRight /></Button><Button type="button" variant="ghost" className="skip-button" disabled={busy} onClick={() => setPhase("result")}>{en?"Back to results":"К результату"}</Button></div>
        </form>}

        {phase === "success" && <div className="flow-content success-content">
          <div className="success-icon"><Check /></div>
          <h1 ref={title} tabIndex={-1} className="flow-title">{en?"Thank you for joining us.":"Спасибо за знакомство."}</h1>
          <p>{en?"Your request is saved. The team will contact you.":"Запрос сохранён. Команда свяжется с вами."}</p>
          <Button className="primary-button" onClick={reset}>{en?"Next visitor":"Следующий участник"}<ArrowRight /></Button>
          <span className="fine-print">{en?`New test in ${idleLeft}s`:`Новая игра через ${idleLeft} сек.`}</span>
        </div>}

        {error && phase !== "welcome" && <div className="form-error" role="alert"><p>{error}</p></div>}
        {phase !== "welcome" && phase !== "success" && idleLeft <= 15 && <div className="timeout-notice" role="alert">{en?`New test in ${idleLeft}s`:`Новая игра через ${idleLeft} сек.`}<Button variant="outline" onClick={() => { touched.current = Date.now(); setIdleLeft(120); }}>{en?"I’m still here":"Я ещё здесь"}</Button></div>}
      </section>
    </main>
    {(phase !== "welcome" || chosenLanguage) && phase !== "quiz" && <nav className="prism-ribbon" aria-label="Prism"><Link href="/screen" target="_blank" rel="noreferrer"><strong>Prism</strong> — {en ? "see the shared picture" : "посмотреть общую картину"}</Link>{phase === "result" && <button type="button" onClick={() => { setInterest("both"); setPhase("contact"); }}>{en ? "Talk to the NavTech team" : "Обсудить продукты NavTech"}</button>}</nav>}
  </div>;
}
