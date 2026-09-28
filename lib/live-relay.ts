import { isRealtimeVoice, type VoiceOptions } from './voice-options.ts';
import type WebSocket from 'ws';
import type { GameContext, GameGuide } from './live-game';
import type { VoiceLanguage, CreativeAction } from './live';
import type { DemoContext, DemoGuide } from './live-demo';

type SessionFactory = (language: VoiceLanguage, experience?: 'quiz'|'hiring', options?: VoiceOptions) => { instructions: string; [key: string]: unknown };
const creative: Record<CreativeAction, string> = {
  riddle: 'The visitor chose a riddle. Invent one short, fair riddle. Ask it in the current conversation language, then wait for their guess. Do not reveal the answer.',
  story: 'The visitor chose a tiny story together. Start a playful fictional story about a curious invention in Dushanbe, in two sentences. Offer two amusing directions and let the visitor choose what happens next.',
  words: 'The visitor chose word association. Explain in one short sentence, offer one surprising starting word in the current conversation language, then wait for their word. Continue the game naturally.',
};
export function relayLive(client: WebSocket, connect: () => WebSocket, sessionFor: SessionFactory, guide?: GameGuide, demoGuide?: DemoGuide) {
  let narration = false;
  let language: VoiceLanguage = 'ru', base = '', game: GameContext | null = null;
  let demo: DemoContext|null = null, pendingDemo: DemoContext|null = null, cancelPending = false;
  const responseDemos = new Map<string,DemoContext|null>(), cancelled = new Set<string>();
  let upstream: WebSocket | undefined, started = false, closing = false, requested = false;
  let responseId = '', speaking = false, playback = false, creativeMode = false;
  let pendingAction = '', pendingScreen = false, lastConversation = 0;
  let lastItem: { id: string; index: number } | null = null;
  const received = new Map<string, number>(), interrupted = new Set<string>();
  let limit: ReturnType<typeof setTimeout> | undefined, idleTimer: ReturnType<typeof setTimeout> | undefined;
  const sendClient = (event: unknown) => { if (client.readyState === 1) client.send(JSON.stringify(event)); };
  const sendProvider = (event: unknown) => { if (upstream?.readyState === 1) upstream.send(JSON.stringify(event)); };
  const context = () => demo && demoGuide ? demoGuide.cue(demo) : game && guide ? guide.cue(game, null, narration ? language : 'ru').text : 'Welcome screen; the game has not started.';
  const instructions = () => `${base}\nLATEST SCREEN (facts, not a language change)\n${context()}`;
  function close() {
    if (closing) return; closing = true;
    clearTimeout(connectTimer); clearTimeout(limit); clearTimeout(idleTimer);
    if (responseId && responseId !== 'pending') sendProvider({ type: 'response.cancel', response_id: responseId });
    sendClient({ type: 'session.closed' }); upstream?.close(); client.close();
  }
  function fail(code: string) { sendClient({ type: 'error', error: { code } }); close(); }
  function respond(prompt: string, explicit = true) {
    if (closing || !started || responseId || speaking || playback) return false;
    responseId = 'pending'; lastConversation = Date.now();
    sendClient({ type: 'response.requested', source: explicit ? 'explicit' : 'screen' });
    pendingDemo = demo;
    // Explicit touch requests become conversation turns; automatic screen hints don't pretend to be visitor speech.
    if (explicit) sendProvider({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: prompt }] } });
    sendProvider({ type: 'response.create', response: explicit ? {} : { instructions: `${instructions()}\n${prompt}` } });
    return true;
  }
  function schedule() {
    clearTimeout(idleTimer);
    if (!started || closing || (!pendingAction && !pendingScreen)) return;
    // Explicit requests are immediate; automatic observations use one short quiet window.
    // Spoken turns are created by provider VAD and never pass through this scheduler.
    const delay = pendingAction ? 0 : Math.max(120, 350 - (Date.now() - lastConversation));
    idleTimer = setTimeout(() => {
      if (responseId || speaking || playback) return; // Resume from the event that ends speech/playback.
      if (pendingAction) { const action = pendingAction; pendingAction = ''; respond(action); return; }
      if (pendingScreen && !creativeMode && Date.now() - lastConversation >= 350) {
        pendingScreen = false;
        respond((narration ? 'OUTPUT-ONLY touchscreen narration. Do not ask for a spoken reply. ' : '') + 'The visitor has moved to the latest screen and there is a conversational pause. Say one short sentence, at most 18 words, about the CURRENT decision in the current conversation language. React to the actual previous choice or make the next decision easier. Speak to the visitor directly; never announce what is on the screen or what the question asks. At a result, suggest one relevant next step rather than reading its label. Do not re-answer an earlier spoken question. No greeting, no list of choices, no generic help offer or sales pitch. Use everyday words; do not recite instructions. Then leave quiet space.', false);
      } else if (pendingScreen && !creativeMode) schedule();
    }, delay);
  }
  function interrupt(reason = 'speech') {
    pendingScreen = false; pendingAction = ''; playback = false;
    if (lastItem) {
      interrupted.add(lastItem.id);
      sendClient({ type: 'audio.clear', item_id: lastItem.id, content_index: lastItem.index, reason });
    } else sendClient({ type: 'audio.clear', reason });
  }
  const connectTimer = setTimeout(() => fail('connection_timeout'), 30000);
  client.on('message', (raw, binary) => {
    if (closing) return;
    if (binary || Buffer.byteLength(raw.toString()) > 20000) { fail('invalid_message'); return; }
    let event: { type?: string; narration?: boolean; voice?: unknown; language?: VoiceLanguage; audio?: string; game?: unknown; demo?: unknown; action?: CreativeAction; item_id?: string; content_index?: number; audio_end_ms?: number; busy?: boolean };
    try { event = JSON.parse(raw.toString()); } catch { fail('invalid_message'); return; }
    if (event.type === 'start' && !requested ) {
      requested = true; narration = event.narration === true;
      if (event.voice !== undefined && !isRealtimeVoice(event.voice)) { fail('invalid_voice'); return; }
      language = event.language === 'en' ? 'en' : 'ru';
      if(event.demo!==undefined){demo=demoGuide?.parse(event.demo)||null;if(!demo||demo.language!==language||event.game!==undefined){fail('invalid_demo_context');return;}}
      if (event.game !== undefined) { game = guide?.parse(event.game) || null; if (!game) { fail('invalid_game_context'); return; } }
      if (event.action !== undefined && !Object.hasOwn(creative, event.action)) { fail('invalid_action'); return; }
      if (event.action && narration) { fail('narration_has_no_conversation'); return; }
      if (event.action) { creativeMode = true; pendingAction = creative[event.action]; }
      const session = sessionFor(language,demo?'hiring':'quiz',{narration,voice:isRealtimeVoice(event.voice)?event.voice:'marin'}); base = session.instructions;
      try { upstream = connect(); } catch { fail('connection_failed'); return; }
      upstream.on('open', () => sendProvider({ type: 'session.update', session: { ...session, instructions: instructions() } }));
      upstream.on('message', raw => {
        if (closing) return;
        let data: { type?: string; item_id?: string; content_index?: number; response_id?:string; delta?: string; response?: { id?: string; status?: string }; error?: { code?: string } };
        try { data = JSON.parse(raw.toString()); } catch { fail('invalid_provider_event'); return; }
        if (data.type === 'session.updated' && !started) {
          started = true; clearTimeout(connectTimer); limit = setTimeout(close, 600000);
          sendClient({ type: 'session.started' });
          if (!pendingAction && narration) pendingAction = game && !['welcome','name','hello'].includes(game.phase) ? 'Give one short observation about the current task in the selected language. The visitor answers only on the touchscreen. No introduction or request to speak.' : `Say only this short invitation: ${{ru:'Привет! Я Нави. Выберите близкий вам подход на экране — посмотрим, какие задачи вам интересны.',en:'Hi, I’m Navi. Choose your approach on the screen, and let’s explore the work that interests you.'}[language]}`;
          if (!pendingAction) pendingAction = demo ? `The visitor enabled voice. Say ONLY this short opening, then listen: ${{ru:'Привет! Что разберём в этом примере?',en:'Hi! What shall we explore in this example?',}[language]}` : game && game.phase !== 'welcome' ? 'The visitor tapped Navi during the game. Briefly offer help with the current screen, in the current conversation language. Do not restart the introduction.' : `The visitor tapped Navi to begin a conversation. Say only this short opening, then listen: ${{ru:'Привет! Я Нави. С чего начнём?',en:'Hi! I’m Navi. What shall we try?',}[language]}`;
          const action = pendingAction; pendingAction = ''; pendingScreen = false; respond(action,!demo); return;
        }
        if (data.type === 'response.created') {
          const assigned = responseId==='pending'?pendingDemo:demo;
          responseId = data.response?.id || 'pending';responseDemos.set(responseId,assigned);
          if(cancelPending){cancelPending=false;cancelled.add(responseId);sendProvider({type:'response.cancel',response_id:responseId});}
          if(responseDemos.size>24){const old=responseDemos.keys().next().value!;responseDemos.delete(old);cancelled.delete(old);}
          sendClient({ type: 'response.started', ...(assigned?{demo_revision:assigned.revision,demo_phase:assigned.phase}:{}) });
        }
        if (data.type === 'response.done') {
          responseId = ''; lastConversation = Date.now(); sendClient({type:'response.done',status:data.response?.status});
          if (data.response?.status === 'failed') { fail('response_failed'); return; }
          schedule();
        }
        if (data.type === 'input_audio_buffer.speech_started') {
          speaking = true;
          // A screen response can still be in flight when VAD notices the visitor.
          // Cancel it when its ID arrives; clearing only the previous item lets late audio overlap speech.
          if (responseId === 'pending') cancelPending = true;
          else if (responseId) { cancelled.add(responseId); sendProvider({ type: 'response.cancel', response_id: responseId }); }
          interrupt(); sendClient({ type: 'input.speech_started' });
        }
        if (data.type === 'input_audio_buffer.speech_stopped') { speaking = false; pendingScreen = false; lastConversation = Date.now(); sendClient({type:'input.speech_stopped'}); }
        if (data.type === 'response.output_audio.delta' && data.delta && data.item_id) {
          const source=responseDemos.get(data.response_id||responseId);
          if (interrupted.has(data.item_id)||cancelled.has(data.response_id||responseId)||(demo&&source&&(source.revision!==demo.revision||source.phase!==demo.phase))) return;
          if (client.bufferedAmount > 1024 * 1024) { fail('playback_too_slow'); return; }
          lastItem = { id: data.item_id, index: data.content_index || 0 }; playback = true;
          received.set(data.item_id, (received.get(data.item_id) || 0) + Buffer.byteLength(data.delta, 'base64') / 2);
          // Bound metadata only; no audio or transcript is retained by the relay.
          if (received.size > 24) { const oldest = received.keys().next().value!; received.delete(oldest); interrupted.delete(oldest); }
          sendClient({ type: 'session.output_audio.delta', delta: data.delta, item_id: data.item_id, content_index: data.content_index || 0,...(source?{demo_revision:source.revision,demo_phase:source.phase}:{}) });
        }
        if (data.type === 'response.output_audio_transcript.delta' && data.delta && (!data.item_id || !interrupted.has(data.item_id))) {
          const source=responseDemos.get(data.response_id||responseId);
          if(!cancelled.has(data.response_id||responseId)&&(!demo||!source||(source.revision===demo.revision&&source.phase===demo.phase)))sendClient({ type: 'session.output_transcript.delta', delta: data.delta,...(source?{demo_revision:source.revision,demo_phase:source.phase}:{}) });
        }
        if (data.type === 'error') {
          const code = data.error?.code || 'provider_error';
          // A cancellation can race normal completion. Neither case warrants dropping the microphone.
          if (code === 'response_cancel_not_active') return;
          if (code === 'conversation_already_has_active_response') { pendingAction = ''; pendingScreen = false; return; }
          console.info('[navi-realtime]', JSON.stringify({ event: 'error', code })); fail(code);
        }
      });
      upstream.on('error', () => fail('provider_connection_failed'));
      upstream.on('close', () => { if (!closing) fail('provider_disconnected'); });
    } else if (event.type === 'audio' && narration) { fail('audio_input_disabled'); return;
    } else if (event.type === 'audio' && started && typeof event.audio === 'string' && event.audio.length <= 16000 && /^[A-Za-z0-9+/]+={0,2}$/.test(event.audio) && event.audio.length % 4 === 0) {
      if (upstream!.bufferedAmount > 1024 * 1024) { fail('input_too_slow'); return; }
      sendProvider({ type: 'input_audio_buffer.append', audio: event.audio });
    } else if(event.type==='demo'){
      const next=demoGuide?.parse(event.demo);
      if(!demo||!next||next.language!==language||next.revision<demo.revision){fail('invalid_demo_context');return;}
      if(JSON.stringify(next)!==JSON.stringify(demo)){
        if(responseId==='pending')cancelPending=true;
        else if(responseId){cancelled.add(responseId);sendProvider({type:'response.cancel',response_id:responseId});}
        interrupt('demo_change');demo=next;
        if(started)sendProvider({type:'session.update',session:{type:'realtime',instructions:instructions()}});
        pendingScreen=!creativeMode&&next.phase!=='handoff'&&next.phase!=='intro';schedule();
      }
    } else if (event.type === 'game') {
      if(demo){fail('wrong_context_kind');return;}
      const next = guide?.parse(event.game); if (!next) { fail('invalid_game_context'); return; }
      if (JSON.stringify(next) !== JSON.stringify(game)) {
        const changed = !game || next.phase !== game.phase || next.step !== game.step || (narration && JSON.stringify(next.answers)!==JSON.stringify(game.answers));
        if (narration && changed) {
          if(responseId==='pending')cancelPending=true;
          else if(responseId){cancelled.add(responseId);sendProvider({type:'response.cancel',response_id:responseId});}
          interrupt('screen_change');
        }
        game = next;
        if (started) sendProvider({ type: 'session.update', session: { type: 'realtime', instructions: instructions() } });
        // Contact entry needs quiet. Selections alone never trigger speech.
        if (changed && !creativeMode && !['contact','welcome','name','hello'].includes(next.phase)) { pendingScreen = true; schedule(); }
        else if (changed) pendingScreen = false;
      }
    } else if (event.type === 'playback' && typeof event.busy === 'boolean') {
      playback = event.busy; if (!playback) { lastConversation = Date.now(); schedule(); }
    } else if (event.type === 'truncate' && event.item_id && received.has(event.item_id) && interrupted.has(event.item_id) && event.content_index === 0 && Number.isFinite(event.audio_end_ms) && event.audio_end_ms! >= 0) {
      sendProvider({ type: 'conversation.item.truncate', item_id: event.item_id, content_index: 0, audio_end_ms: Math.min(Math.floor(event.audio_end_ms!), Math.floor(received.get(event.item_id)! / 24)) });
    } else if (event.type === 'creative' && narration) { fail('narration_has_no_conversation'); return;
    } else if (event.type === 'creative' && event.action && Object.hasOwn(creative, event.action)) {
      creativeMode = true; pendingScreen = false; pendingAction = creative[event.action]; schedule();
    } else if (event.type === 'greet' && started) {
      creativeMode = false; pendingScreen = false;
      pendingAction = (narration ? 'There is no microphone: offer one useful touchscreen hint, never ask for spoken input. ' : '') + 'The visitor tapped Navi. Respond directly to the ongoing conversation or make one specific observation about the latest screen. Avoid generic offers of help. Keep the current language and do not repeat your introduction.'; schedule();
    } else if (event.type === 'close') close();
    else if (event.type !== 'audio') fail('invalid_command');
  });
  client.on('close', close); client.on('error', close);
  return { close };
}
