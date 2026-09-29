"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, ChevronDown, Globe, Mic, MicOff, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { questions, scoreAnswers, interestLabels, type QuizLanguage } from "@/lib/quiz";
import CameraInvite, { type CameraHandle } from "./camera";
import { NaviSeat, NaviStage, type NaviHandle } from "./navi";
import { createSessionSync, type SaveState } from "@/lib/session-sync";
import { requestSignal } from "@/lib/request-signal";
import { taskPreviews, englishTaskPreviews } from "@/lib/work-context";
import { matchSpokenAnswer } from "@/lib/voice-answer-match";
import { useVoiceAnswers, useVoiceAnswersSetting } from "@/lib/use-voice-answers";
import { contactSteps, type ContactStep } from "@/lib/narration-text";
import type { GameContext } from "@/lib/live-game";
import { validContact, visitorName } from "@/lib/visitor-name";
import CareerResults from "./career-results";
import { TaskIcon } from "./career-visuals";
import { Header  } from "./shell";

type Phase = "welcome" | "quiz" | "result" | "contact" | "success";
type IntroStep = "name" | "hello";
type Session = { id: string; token: string };
const topics = ["hr", "prism", "both"] as const;
const englishTopics: Record<string, string> = { hr: "HR Agent", prism: "Prism", both: "Both products" };

async function api(path: string, method: string, payload: unknown, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: requestSignal(12000, signal),
    });
  } catch {
    throw Error("Нет соединения. Попробуйте ещё раз — ваши ответы остались на экране.");
  }
  const data = await response.json() as { error?: string; answers?: number[] };
  if (!response.ok) throw Error(data.error || "Не удалось сохранить. Попробуйте ещё раз.");
  return data;
}

/** One capsule field with its round action inside, like a message composer: the whole step is this one field. */
function FocusField({ value, onChange, placeholder, labelledBy, go, hint, maxLength, kind = "name" }: {
  value: string; onChange: (value: string) => void; placeholder: string; labelledBy: string; go: string; hint: string; maxLength: number; kind?: "name" | "contact";
}) {
  return <>
    <div className="focus-field">
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} aria-labelledby={labelledBy} aria-invalid={Boolean(hint)} aria-describedby={hint ? `${labelledBy}-hint` : undefined}
        maxLength={maxLength} autoComplete="off" autoCorrect="off" spellCheck={false} autoCapitalize={kind === "name" ? "words" : "none"} enterKeyHint="next" />
      <button type="submit" className="focus-go" disabled={!value.trim()} aria-label={go} data-navi-look><ArrowRight size={22} /></button>
    </div>
    <p id={`${labelledBy}-hint`} className="focus-hint" role={hint ? "alert" : undefined}>{hint}</p>
  </>;
}

/** Back and the step progress share the header row, with the progress at the screen centre. */
function StepBar({ label, count, current, backLabel, onBack, hidden, disabled }: { label: string; count: number; current: number; backLabel: string; onBack: () => void; hidden: boolean; disabled: boolean }) {
  return <div className="question-bar" role="group" aria-label={label}>
    <button type="button" className="question-nav" hidden={hidden} disabled={disabled} onClick={onBack} aria-label={backLabel}><ArrowLeft size={18} /><span className="question-nav-label">{backLabel}</span></button>
    <div className="question-progress" role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={count} aria-valuenow={current + 1} aria-valuetext={`${current + 1} / ${count}`}>
      {Array.from({ length: count }, (_, index) => <span key={index} className={index < current ? 'is-done' : index === current ? 'is-current' : ''} />)}
    </div>
  </div>;
}

export default function Home() {
  const [chosenLanguage, setLanguage] = useState<QuizLanguage | null>(null);
  const language = chosenLanguage || 'ru';
  const en=language==='en';
  const [editing,setEditing]=useState(false);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [introStep, setIntroStep] = useState<IntroStep>("name");
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
  // The visitor's first name: typed once at the start (or on the request's first step if skipped), then used by Navi
  // on screen and in its voice. It is stored only if the visitor sends a request with consent.
  const [name, setName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [hint, setHint] = useState("");
  const [contactStep, setContactStep] = useState<ContactStep>("reach");
  const [askName, setAskName] = useState(false);
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
  const shownName = visitorName(name) ?? "";
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    setPhase("welcome"); setIntroStep("name"); setLanguage(null); setEditing(false); setAnswers([]); setStep(0); setSelected(null);
    setSession(null); setBusy(false); setAdvancing(false); setLeaving(false); setError("");
    setName(""); setNameDraft(""); setHint(""); setContactStep("reach"); setAskName(false);
    setCompany(""); setContact(""); setInterest(""); setConsent(false);
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
      // The countdown shows only in its last seconds (and on the thank-you), so the page re-renders only then, not
      // every second of the test on the booth's slow CPU.
      setIdleLeft(phase === "success" || left <= 15 ? left : limit);
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
    // A step that is one field puts the cursor in it; every other step focuses its heading for screen readers.
    const field = document.querySelector<HTMLInputElement>(".focus-field input");
    (field ?? heading)?.focus({ preventScroll: true });
    if (heading) {
      const rect = heading.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) heading.scrollIntoView({ block: "start" });
    }
    // Navi reads each new question with the visitor, then looks at what it asks them to do.
    if (phase === "quiz") mascot.current?.read(heading, ".question-options");
    else if (phase === "welcome") mascot.current?.read(heading, !chosenLanguage ? ".intro-actions" : introStep === "name" ? ".focus-field" : ".intro-start");
    else if (phase === "contact") mascot.current?.read(heading, contactStep === "topic" ? ".topic-options" : contactStep === "consent" ? ".focus-action" : ".focus-field");
    else if (phase === "result") mascot.current?.lookAt(".board-role", 1800);
  }, [phase, step, chosenLanguage, introStep, contactStep]);

  useEffect(() => { if (phase === "result" && shownRole) mascot.current?.lookAt(".board-role", 1500); }, [phase, shownRole]);

  useEffect(() => () => {
    generation.current++; sessionSync.current?.dispose();
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    if (greetingTimer.current) clearTimeout(greetingTimer.current);
    if (arrivalTimer.current) clearTimeout(arrivalTimer.current);
  }, []);

  const result = answers.length === questions.length ? scoreAnswers(answers) : null;
  const mascotMood = error ? "reassuring" : busy ? "thinking" : phase === "result" || phase === "success" ? "celebrate" : advancing ? "acknowledge" : phase === "quiz" ? "thinking" : "neutral";

  /** Fade the current intro step out, then run `next`; the new step rises in under Navi, who stays put. */
  function turnIntro(next: () => void) {
    if (submitLock.current) return;
    submitLock.current = true; setAdvancing(true);
    transitionTimer.current = setTimeout(() => {
      next(); setAdvancing(false); setGreeting(""); setHint("");
      touched.current = Date.now(); submitLock.current = false;
    }, reduced() ? 0 : 200);
  }

  // Choosing a language is the visitor's first tap, so Navi's voice begins here: it waves and asks their name.
  // The lines before the name is known are fixed, so they come from the narration cache.
  function chooseLanguage(next: QuizLanguage) {
    if (submitLock.current) return;
    invitations.current?.stop(); mascot.current?.cheer("greet");
    invitations.current?.startNarration({ phase: "name", step: 0, answers: [], selected: null, interest: "" }, next);
    turnIntro(() => { setLanguage(next); setIntroStep("name"); });
  }

  function changeLanguage() {
    if (submitLock.current) return;
    invitations.current?.stop(); setLanguage(null); setGreeting(""); setError(""); setHint("");
    touched.current = Date.now();
  }

  function submitName(event: FormEvent, then: () => void) {
    event.preventDefault();
    if (submitLock.current) return;
    const clean = visitorName(nameDraft);
    if (!clean) { setHint(en ? "Please type a first name in letters." : "Напишите, пожалуйста, имя буквами."); return; }
    setName(clean); setHint(""); mascot.current?.cheer("greet");
    then();
  }

  function skipName() {
    setName(""); setNameDraft("");
    turnIntro(() => setIntroStep("hello"));
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
    // The first question waits a beat while Navi hops over to its seat beside it.
    setArriving(true); if (arrivalTimer.current) clearTimeout(arrivalTimer.current);
    arrivalTimer.current = setTimeout(() => setArriving(false), 1400);
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

  // The request after the result: one field per screen. The name is asked only if the visitor skipped it earlier.
  const requestSteps = contactSteps.filter(item => askName || item !== "name");
  function openRequest() {
    if (submitLock.current) return;
    const needName = !name;
    setAskName(needName); setContactStep(needName ? "name" : "reach"); setNameDraft(""); setHint(""); setError("");
    setInterest(""); setConsent(false); setGreeting(""); setIdleLeft(120); touched.current = Date.now();
    setPhase("contact");
  }
  function goRequest(next: ContactStep) { setHint(""); setError(""); setContactStep(next); }
  function requestBack() {
    if (busy || advancing) return;
    const index = requestSteps.indexOf(contactStep);
    if (index <= 0) { setHint(""); setError(""); setPhase("result"); return; }
    goRequest(requestSteps[index - 1]);
  }
  function submitReach(event: FormEvent) {
    event.preventDefault();
    if (!validContact(contact)) { setHint(en ? "Enter a phone number, an email or a Telegram @username." : "Укажите телефон, почту или Telegram в формате @username."); return; }
    mascot.current?.cheer("answer");
    goRequest("topic");
  }
  function chooseTopic(id: string, event: MouseEvent<HTMLButtonElement>) {
    if (submitLock.current) return;
    submitLock.current = true; setInterest(id); setAdvancing(true);
    const rect = event.currentTarget.getBoundingClientRect();
    mascot.current?.reactTo(rect.left + rect.width / 2, rect.top + rect.height / 2, rect);
    transitionTimer.current = setTimeout(() => { goRequest("consent"); setAdvancing(false); submitLock.current = false; }, reduced() ? 0 : 320);
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
      // The thank-you keeps only the first name; the contact leaves the screen at once.
      setCompany(""); setContact(""); setConsent(false);
      setPhase("success"); setIdleLeft(20);
    } catch (e) { if(generation.current===owner)setError((e as Error).message); }
    finally { if(generation.current===owner){setBusy(false); submitLock.current = false;} }
  }

  function back() {
    if (busy || advancing || step === 0) return;
    setStep(step - 1); setSelected(answers[step - 1] ?? null); setError("");
  }

  // Navi's narration follows every screen, including each intro and request step.
  const narrationPhase: GameContext["phase"] = phase === "welcome" ? (chosenLanguage ? introStep : "welcome") : phase;
  const narrationStep = phase === "contact" ? contactSteps.indexOf(contactStep) : step;
  const gameContext = useMemo(() => ({ phase: narrationPhase, step: narrationStep, answers, selected, interest }), [narrationPhase, narrationStep, answers, selected, interest]);

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

  const questionBar = <StepBar label={en ? "Test progress" : "Ход теста"} count={questions.length} current={step} backLabel={editing ? (en ? 'Results' : 'К результату') : (en ? 'Back' : 'Назад')} onBack={() => editing ? (setEditing(false), setPhase('result')) : back()} hidden={!editing && step === 0} disabled={busy || advancing} />;
  const requestBar = <StepBar label={en ? "Request" : "Заявка"} count={requestSteps.length} current={Math.max(0, requestSteps.indexOf(contactStep))} backLabel={en ? "Back" : "Назад"} onBack={requestBack} hidden={false} disabled={busy || advancing} />;
  const topicLabel = (id: string) => en ? englishTopics[id] ?? interestLabels[id] : interestLabels[id];
  const naviHint = { label: en ? "Hear a hint from Navi" : "Подсказка Нави", hint: en ? "Tap for a hint" : "Нажмите для подсказки" };

  // The request steps: a heading, at most one line beneath it, then the one field or choice.
  let requestStep: ReactNode = null;
  if (phase === "contact") {
    if (contactStep === "name") requestStep = <form className="focus-step" key="name" onSubmit={event => submitName(event, () => goRequest("reach"))} noValidate>
      <h1 ref={title} id="request-title" tabIndex={-1} className="focus-title">{en ? "What’s your name?" : "Как вас зовут?"}</h1>
      <p className="focus-sub">{en ? "So the team knows how to address you." : "Так команде будет проще к вам обратиться."}</p>
      <FocusField value={nameDraft} onChange={value => { setNameDraft(value); setHint(""); }} placeholder={en ? "First name" : "Имя"} labelledBy="request-title" go={en ? "Next" : "Дальше"} hint={hint} maxLength={24} />
    </form>;
    else if (contactStep === "reach") requestStep = <form className="focus-step" key="reach" onSubmit={submitReach} noValidate>
      <h1 ref={title} id="request-title" tabIndex={-1} className="focus-title">{shownName ? (en ? `${shownName}, how can we reach you?` : `${shownName}, как с вами связаться?`) : (en ? "How can we reach you?" : "Как с вами связаться?")}</h1>
      <p className="focus-sub">{en ? "Phone, email or Telegram." : "Телефон, почта или Telegram."}</p>
      <FocusField kind="contact" value={contact} onChange={value => { setContact(value); setHint(""); }} placeholder="+992 … / name@company.tj / @username" labelledBy="request-title" go={en ? "Next" : "Дальше"} hint={hint} maxLength={150} />
    </form>;
    else if (contactStep === "topic") requestStep = <div className="focus-step" key="topic">
      <h1 ref={title} id="request-title" tabIndex={-1} className="focus-title">{en ? "What shall we talk about?" : "О чём поговорим?"}</h1>
      <p className="focus-sub">{en ? "The team will prepare for the conversation." : "Команда подготовится к разговору."}</p>
      <div className="topic-options" role="group" aria-labelledby="request-title">
        {topics.map(id => <button key={id} type="button" className="topic-option" aria-pressed={interest === id} disabled={advancing} onClick={event => chooseTopic(id, event)} data-navi-look>{topicLabel(id)}{interest === id && <Check size={20} />}</button>)}
      </div>
    </div>;
    else requestStep = <form className="focus-step" key="consent" onSubmit={save}>
      <h1 ref={title} id="request-title" tabIndex={-1} className="focus-title">{en ? "Send your request?" : "Отправить заявку?"}</h1>
      <dl className="request-summary">
        <div><dt>{en ? "Name" : "Имя"}</dt><dd>{name}</dd></div>
        <div><dt>{en ? "Contact" : "Контакт"}</dt><dd>{contact.trim()}</dd></div>
        <div><dt>{en ? "Topic" : "Тема"}</dt><dd>{topicLabel(interest)}</dd></div>
      </dl>
      <details className="company-details"><summary>{en ? "Add company" : "Добавить компанию"}<ChevronDown size={15} /></summary><label className="form-field"><span className="visually-hidden">{en ? "Company" : "Компания"}</span><Input autoComplete="off" maxLength={120} value={company} onChange={e => setCompany(e.target.value)} placeholder={en ? "Company name" : "Название компании"} /></label></details>
      <label className="consent-label"><Checkbox checked={consent} onCheckedChange={value => setConsent(value === true)} aria-label={en ? "Consent to contact from NavTech" : "Согласие на связь с NavTech"} /><span>{en ? "I agree to share my name, contact, company and result with NavTech for follow-up on this topic. Withdraw consent: " : "Согласен передать NavTech имя, контакт, компанию и результат для связи по выбранной теме. Отозвать согласие: "}<a href="mailto:info@navtech.tj">info@navtech.tj</a>.</span></label>
      {error && <p className="flow-error" role="alert">{error}</p>}
      <Button type="submit" className="primary-button focus-action" disabled={!consent || busy} data-navi-look>{busy ? (en ? "Sending…" : "Отправляем…") : (en ? "Send request" : "Отправить заявку")}<ArrowRight /></Button>
    </form>;
  }

  return <div className={`app-shell visitor-shell career-shell state-${phase} ${phase === "welcome" ? "is-intro" : ""}`}>
    <div className="ambient-glow" data-role={phase === "result" ? shownRole ?? undefined : undefined} aria-hidden="true" />
    <NaviStage ref={mascot} mood={mascotMood} active={!settingsOpen}>
    <Header language={language} center={phase === "quiz" ? questionBar : phase === "contact" ? requestBar : undefined} actions={<>{(phase === "quiz" || phase === "result" || phase === "contact") && <button type="button" className="question-nav question-end" disabled={busy || advancing} onClick={reset} aria-label={en ? "End test" : "Завершить"}><X size={18} className="question-end-icon" /><span className="question-nav-label">{en ? "End test" : "Завершить"}</span></button>}{phase === "welcome" && chosenLanguage && <button type="button" className="language-switch" onClick={changeLanguage} aria-label={en ? "Change language" : "Сменить язык"}><Globe size={18} />{en ? "EN" : "RU"}</button>}{listenControl}<CameraInvite ref={invitations} game={gameContext} visitorName={shownName} russianOnly narration voiceAllowed={Boolean(chosenLanguage)} controlledLanguage={language} onActivity={() => { touched.current = Date.now(); }} idle={phase === "welcome" && !busy} onGreeting={greet} onMotion={point => mascot.current?.notice(point)} onFace={point => mascot.current?.trackFace(point)} onSpeech={frame => { mascot.current?.speak(frame); naviSpeaking(frame.speaking); }} onOpenChange={setSettingsOpen} /></>} />
    <main className={`booth-grid phase-${phase}`}>
      <section className="play-panel" aria-label={en?"Explore with Navi":"Игра с Нави"}>
        {/* Onboarding: one question per screen under Navi, who keeps its place while the step beneath it changes. */}
        {phase === "welcome" && <div className={`intro ${advancing ? "is-leaving" : ""}`}>
          <div className="intro-navi"><NaviSeat id="intro" hero label={chosenLanguage ? naviHint.label : "Нави · Navi"} hint={chosenLanguage ? naviHint.hint : ""} onGreet={() => {if(chosenLanguage)invitations.current?.invite();}} /></div>
          {!chosenLanguage ? <div className="intro-step" key="language">
            <h1 ref={title} tabIndex={-1} className="intro-title" lang="ru">На каком языке<br/>вы говорите?</h1>
            <p className="intro-translation" lang="en">What language do you speak?</p>
            <div className="intro-actions" role="group" aria-label="Язык / Language">
              <button type="button" className="language-option" lang="ru" disabled={advancing} onClick={() => chooseLanguage("ru")}>Русский</button>
              <button type="button" className="language-option" lang="en" disabled={advancing} onClick={() => chooseLanguage("en")}>English</button>
            </div>
          </div> : introStep === "name" ? <form className="intro-step" key="name" onSubmit={event => submitName(event, () => turnIntro(() => setIntroStep("hello")))} noValidate>
            <h1 ref={title} id="name-title" tabIndex={-1} className="intro-title">{en ? <>Hi there!<br/>What’s your name?</> : <>Привет!<br/>Как вас зовут?</>}</h1>
            <div className="intro-actions intro-field"><FocusField value={nameDraft} onChange={value => { setNameDraft(value); setHint(""); }} placeholder={en ? "First name" : "Имя"} labelledBy="name-title" go={en ? "Next" : "Дальше"} hint={hint} maxLength={24} /></div>
            <button type="button" className="quiet-action" disabled={advancing} onClick={skipName}>{en ? "Continue without a name" : "Продолжить без имени"}</button>
          </form> : <div className="intro-step" key="hello">
            <h1 ref={title} tabIndex={-1} className="intro-title">{shownName ? (en ? <>Nice to meet you,<br/>{shownName}!</> : <>Очень приятно,<br/>{shownName}!</>) : (en ? <>How do you approach<br/>work challenges?</> : <>Как вы решаете<br/>рабочие задачи?</>)}</h1>
            <p className="intro-translation">{en ? "Eight work situations. About two minutes." : "Восемь рабочих ситуаций — около двух минут."}</p>
            <div className="intro-actions"><Button className="primary-button intro-start" onClick={start}>{en?'Start':'Начать'}<ArrowRight /></Button></div>
            <p className="intro-note" role={error ? "alert" : undefined} aria-live="polite">{error || greeting}</p>
          </div>}
        </div>}

        {/* The test and the request: Navi large on the left and travelling with the visitor, the one question on the right. */}
        {(phase === "quiz" || phase === "contact" || phase === "success") && <div className={`stage stage-${phase}`}>
          <div className="stage-navi">
            <NaviSeat id="side" label={naviHint.label} hint={naviHint.hint} onGreet={() => invitations.current?.invite()} />
            <p className="navi-caption" aria-live="polite">{greeting || (phase === "quiz" && listenFailed ? listenError : "")}</p>
          </div>
          <div className="stage-content">
            {phase === "quiz" && <div className={`question ${leaving ? "is-leaving" : ""} ${arriving ? "is-arriving" : ""}`}>
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
            {requestStep}
            {phase === "success" && <div className="focus-step success-step">
              <div className="success-icon"><Check /></div>
              <h1 ref={title} tabIndex={-1} className="focus-title">{shownName ? (en ? `Thank you, ${shownName}!` : `Спасибо, ${shownName}!`) : (en ? "Thank you for joining us." : "Спасибо за знакомство.")}</h1>
              <p className="focus-sub">{en ? "Your request is with the NavTech team. They will contact you." : "Заявка у команды NavTech. Мы свяжемся с вами."}</p>
              <Button className="primary-button focus-action" onClick={reset} data-navi-look>{en ? "Next visitor" : "Следующий участник"}<ArrowRight /></Button>
              <span className="fine-print">{en ? `New test in ${idleLeft}s` : `Новая игра через ${idleLeft} сек.`}</span>
            </div>}
          </div>
        </div>}

        {phase === "result" && result && <div className="result-content">
          <CareerResults key={answers.join(',')} answers={answers} language={language} onRole={setShownRole} onEdit={index=>{setEditing(true);setStep(index);setSelected(answers[index]);setPhase('quiz');}}/>
          {/* Having shown the result, Navi asks one question beside it: would the visitor like to leave a request? */}
          <div className="result-navi">
            <NaviSeat id="corner" label={naviHint.label} hint={naviHint.hint} onGreet={() => invitations.current?.invite()} />
            <div className="navi-offer" role="group" aria-labelledby="offer-question">
              <p id="offer-question">{shownName ? (en ? `${shownName}, would you like to leave a request?` : `${shownName}, хотите оставить заявку?`) : (en ? "Would you like to leave a request?" : "Хотите оставить заявку?")}</p>
              <button type="button" className="offer-action" onClick={openRequest} data-navi-look>{en ? "Leave a request" : "Оставить заявку"}<ArrowRight size={16} /></button>
            </div>
          </div>
          {(saveState==='error'||saveError)&&<div className="result-save-notice" role="status"><span>{en?'Your result is ready. The booth statistics have not been updated yet.':'Результат готов. Пока не удалось добавить его в аналитику стенда.'}</span><Button variant="ghost" onClick={()=>void persistResult(answers)} disabled={saveState==='saving'}>{en?'Retry':'Повторить'}</Button></div>}
        </div>}

        {error && phase !== "welcome" && phase !== "contact" && <div className="form-error" role="alert"><p>{error}</p></div>}
        {phase !== "welcome" && phase !== "success" && idleLeft <= 15 && <div className="timeout-notice" role="alert">{en?`New test in ${idleLeft}s`:`Новая игра через ${idleLeft} сек.`}<Button variant="outline" onClick={() => { touched.current = Date.now(); setIdleLeft(120); }}>{en?"I’m still here":"Я ещё здесь"}</Button></div>}
      </section>
    </main>
    </NaviStage>
    {(phase === "result" || (phase === "welcome" && chosenLanguage && introStep === "hello")) && <nav className="prism-ribbon" aria-label="Prism"><Link href="/screen" target="_blank" rel="noreferrer"><strong>Prism</strong> — {en ? "see the shared picture" : "посмотреть общую картину"}</Link>{phase === "result" && <button type="button" className="ribbon-request" onClick={openRequest}>{en ? "Leave a request" : "Оставить заявку"}</button>}</nav>}
  </div>;
}
