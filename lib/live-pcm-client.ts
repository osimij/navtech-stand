import type { VoiceOptions } from './voice-options';
import type { VoiceLanguage, CreativeAction } from './live';
import type { LiveState } from './live-client';
import type { GameContext } from './live-game';
import type { DemoContext } from './live-demo';
import type { SpeechFrame } from './invitation-player';
type Environment = {
  context: () => AudioContext;
  node: (context: AudioContext) => AudioWorkletNode;
  microphone: () => Promise<MediaStream>;
  socket: () => WebSocket;
  fetch: typeof fetch;
};
const browser: Environment = {
  context: () => new AudioContext({ sampleRate: 24000 }),
  node: context => new AudioWorkletNode(context, 'navi-pcm', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] }),
  microphone: () => navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }),
  socket: () => new WebSocket('ws://127.0.0.1:5174/api/live/stream'),
  fetch: (...args) => fetch(...args),
};
type Run = {
  context: AudioContext; node?: AudioWorkletNode; mic?: MediaStream; source?: MediaStreamAudioSourceNode; socket?: WebSocket;
  narration: boolean; ready: boolean; closing: boolean; error: string; abort: AbortController;
  timer?: ReturnType<typeof setTimeout>; closeTimer?: ReturnType<typeof setTimeout>;
  responseAt?: number; responsePlayed?: boolean; responseReceived?: boolean;
  caption: string; captionAt: number; heard: boolean; received: boolean; inputHeard: boolean; playing:boolean;
};
export function createLiveVoice(callbacks: {
  onState?: (state: LiveState) => void;
  onDiagnostic?: (event: string, details?: Record<string, string | number | boolean>) => void;
  onSpeech?: (frame: SpeechFrame) => void;
  onCaption?: (text: string) => void;
  onActivity?: () => void;
} = {}, environment: Environment = browser) {
  let run: Run | null = null, disposed = false;
  let game: GameContext | undefined;
  let demo: DemoContext | undefined;
  function updateDemo(next:DemoContext){
    if(JSON.stringify(next)===JSON.stringify(demo))return;
    demo={...next,language:next.language==='en'?'en':'ru'};game=undefined;
    const r=run;if(!r||r.closing)return;
    if(r.socket?.readyState===1){
      r.socket.send(JSON.stringify({type:'demo',demo}));
      if(r.playing)log('audio.interrupted',{code:'demo_change'});
      r.node?.port.postMessage({type:'clear'});r.playing=false;r.caption='';r.captionAt=0;
      callbacks.onCaption?.('');silence();log('demo.context',{phase:demo.phase});
    }
  }
  function updateGame(next: GameContext) {
    if (JSON.stringify(next) === JSON.stringify(game)) return;
    game = next; demo=undefined;
    const r = run; if (!r || r.closing) return;
    if (r.socket?.readyState === 1) { r.socket.send(JSON.stringify({ type: 'game', game })); if (r.narration) { r.node?.port.postMessage({type:'clear'}); r.playing=false; r.caption=''; callbacks.onCaption?.(''); silence(); } log('game.context', { phase: game.phase }); }
  }
  const log = (event: string, details: Record<string, string | number | boolean> = {}) => callbacks.onDiagnostic?.(event, details);
  const emit = (phase: LiveState['phase'], error = '') => { log('state', { phase }); if (!disposed) callbacks.onState?.({ phase, error, playbackBlocked: Boolean(run && run.context.state !== 'running' && !run.closing) }); };
  const silence = () => { if (!disposed) callbacks.onSpeech?.({ speaking: false, level: 0 }); };
  function cleanup(r: Run) {
    if (run !== r) return;
    run = null; r.abort.abort(); clearTimeout(r.timer); clearTimeout(r.closeTimer);
    r.mic?.getTracks().forEach(track => track.stop()); r.source?.disconnect(); r.node?.disconnect(); r.node?.port.close();
    r.socket?.close(); void r.context.close().catch(() => {}); silence();
  }
  function finish(r: Run, error = r.error) { if (run !== r) return; cleanup(r); emit(error ? 'error' : 'idle', error); }
  function stop(error = '', reason = 'manual') {
    const r = run; if (!r || r.closing) return;
    log('stop', { code: reason }); r.closing = true; r.error = error; r.abort.abort(); clearTimeout(r.timer);
    r.mic?.getTracks().forEach(track => track.stop()); r.source?.disconnect(); r.node?.port.postMessage({ type: 'clear' }); r.node?.disconnect(); silence();
    emit('closing', error);
    if (r.socket?.readyState === 1) {
      r.socket.send(JSON.stringify({ type: 'close' }));
      r.closeTimer = setTimeout(() => finish(r, error || 'Разговор отключён; сервер не подтвердил завершение.'), 15000);
    } else finish(r);
  }
  function resumePlayback() {
    const r = run; if (!r || r.closing) return;
    void r.context.resume().then(() => { if (run === r && !r.closing) emit(r.ready ? 'ready' : 'connecting'); }).catch(() => stop('Не удалось включить звук.', 'playback_failed'));
  }
  async function start(language: VoiceLanguage, action?: CreativeAction, options: VoiceOptions = {}) {
    if (run || disposed) return;
    language = language === 'en' ? 'en' : 'ru';
    emit('connecting'); let r: Run | undefined;
    try {
      const context = environment.context();
      r = { context, narration: options.narration === true, ready: false, closing: false, error: '', abort: new AbortController(), caption: '', captionAt: 0, heard: false, received: false, inputHeard: false, playing:false };
      const current = r; run = current;
      log('transport.pcm');
      r.timer = setTimeout(() => stop('Подключение заняло слишком много времени.', 'timeout'), 30000);
      await context.resume(); if (run !== r || r.closing) return;
      if (context.sampleRate !== 24000) throw Error('Браузер не поддерживает нужную частоту звука.');
      const ready = await environment.fetch('/api/live', { signal: r.abort.signal });
      if (!ready.ok || !(await ready.json() as { configured?: boolean }).configured) throw Error('Голос не настроен. Проверьте локальный ключ OpenAI.');
      if (run !== r || r.closing) return;
      await context.audioWorklet.addModule('/audio/live-pcm-worklet.js'); if (run !== r || r.closing) return;
      if (!r.narration) {
        const mic = await environment.microphone();
        if (run !== r || r.closing) { mic.getTracks().forEach(track => track.stop()); return; }
        r.mic = mic; log('microphone.ready');
        mic.getTracks().forEach(track => track.addEventListener('ended', () => { if (run === current && !current.closing) stop('Микрофон отключён.', 'microphone_ended'); }));
        r.source = context.createMediaStreamSource(mic);
      }
      const node = environment.node(context); r.node = node;
      node.addEventListener?.('processorerror', () => { if (run === current && !current.closing) stop('Ошибка обработки звука. Обновите страницу.', 'processor_error'); });
      r.source?.connect(node); node.connect(context.destination);
      context.addEventListener('statechange', () => {
        if (run !== current || current.closing) return;
        log('context.changed', { context: context.state }); emit(current.ready ? 'ready' : 'connecting');
      });
      node.port.onmessage = ({ data }: MessageEvent<{ type: string; buffer?: ArrayBuffer; level?: number; inputLevel?: number; item_id?: string; content_index?: number; audio_end_ms?: number; busy?: boolean }>) => {
        if (run !== current || current.closing) return;
        if (data.type === 'input' && !current.narration && data.buffer && current.ready && current.socket?.readyState === 1) {
          if (current.socket.bufferedAmount > 1000000) { stop('Соединение слишком медленное.', 'input_backpressure'); return; }
          const bytes = new Uint8Array(data.buffer);
          const audio = btoa(String.fromCharCode(...bytes));
          current.socket.send(JSON.stringify({ type: 'audio', audio }));
        } else if (data.type === 'truncated' && current.socket?.readyState === 1) {
          current.socket.send(JSON.stringify({ type: 'truncate', item_id: data.item_id, content_index: data.content_index, audio_end_ms: data.audio_end_ms }));
        } else if (data.type === 'playback' && current.socket?.readyState === 1) {
          current.playing=Boolean(data.busy);
          current.socket.send(JSON.stringify({ type: 'playback', busy: data.busy }));
        } else if (data.type === 'overflow') {
          stop('Нави говорил слишком долго. Начните разговор снова.', 'output_overflow');
        } else if (data.type === 'level') {
          const level = context.state === 'running' ? data.level || 0 : 0;
          if ((data.inputLevel || 0) > .02) callbacks.onActivity?.();
          if ((data.inputLevel || 0) > .009 && !current.inputHeard) { current.inputHeard = true; log('microphone.signal', { level: data.inputLevel || 0 }); }
          if (level > .009 && !current.responsePlayed) { current.responsePlayed = true; log('response.first_played', { ms: Date.now() - (current.responseAt || Date.now()) }); }
          if (level > .009 && !current.heard) { current.heard = true; log('audio.signal', { level }); }
          if (!disposed) callbacks.onSpeech?.({ speaking: level > .009, level: Math.min(1, level * 7) });
        }
      };
      const socket = environment.socket(); r.socket = socket;
      socket.addEventListener('open', () => {
        if (run !== current || current.closing) { socket.close(); return; }
        log('channel.open'); socket.send(JSON.stringify({ type: 'start', language, ...(options.narration ? { narration: true } : {}), ...(options.voice ? { voice: options.voice } : {}), ...(action ? { action } : {}), ...(game ? { game } : {}),...(demo?{demo}:{}) }));
      });
      socket.addEventListener('message', ({ data }) => {
        if (run !== current) return;
        let event: { type?: string; delta?: string; item_id?: string; content_index?: number; demo_revision?:number;demo_phase?:string;reason?:string; error?: { code?: string } };
        try { event = JSON.parse(data); } catch { stop('Ошибка голосового соединения.', 'invalid_event'); return; }
        if (event.type === 'session.closed') { finish(current); return; }
        if (current.closing) return;
        if(demo&&['response.started','session.output_audio.delta','session.output_transcript.delta'].includes(event.type||'')&&(event.demo_revision!==demo.revision||event.demo_phase!==demo.phase))return;
        if (event.type === 'session.started') {
          current.ready = true; clearTimeout(current.timer); emit('ready'); log('session.started');
          current.timer = setTimeout(() => stop('', 'duration_limit'), 600000);
        } else if (event.type === 'audio.clear') {
          if(current.playing)log('audio.interrupted',{code:event.reason==='demo_change'?'demo_change':'speech'});
          current.playing=false;
          node.port.postMessage({ type: 'interrupt', item_id: event.item_id, content_index: event.content_index });
          current.caption = ''; current.captionAt = 0; callbacks.onCaption?.(''); silence();
        } else if (event.type === 'response.requested') {
          log('response.requested');
        } else if (event.type === 'response.started') {
          current.responseAt=Date.now(); current.responsePlayed=false; current.responseReceived=false; log('response.started');
          current.caption = ''; current.captionAt = 0; callbacks.onCaption?.('');
        } else if (event.type === 'input.speech_started') {
          log('input.speech_started'); callbacks.onActivity?.();
        } else if (event.type === 'input.speech_stopped') {
          log('input.speech_stopped');
        } else if (event.type === 'session.output_audio.delta' && event.delta) {
          if(!current.responseReceived){current.responseReceived=true;log('response.first_packet',{ms:Date.now()-(current.responseAt||Date.now())});}
          const binary = atob(event.delta), bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
          if (!current.received) { current.received = true; log('audio.pcm_received', { bytes: bytes.length }); }
          node.port.postMessage({ type: 'audio', buffer: bytes.buffer, item_id: event.item_id, content_index: event.content_index }, [bytes.buffer]);
        } else if (event.type === 'session.output_transcript.delta' && event.delta) {
          const now = Date.now(); current.caption = ((now - current.captionAt > 2200 ? '' : current.caption) + event.delta).slice(-320); current.captionAt = now;
          if (!disposed) callbacks.onCaption?.(current.caption);
        } else if (event.type === 'error') { log('provider.error', { code: event.error?.code || 'unknown' }); stop('Голосовое соединение прервано. Попробуйте ещё раз.', 'provider_error'); }
      });
      socket.addEventListener('error', () => { if (run === current && !current.closing) stop('Не удалось подключить голосовой сервер.', 'socket_error'); });
      socket.addEventListener('close', () => { if (run === current) finish(current, current.closing ? current.error : 'Голосовое соединение прервано.'); });
    } catch (cause) {
      if (r && (run !== r || r.closing)) return;
      log('start.failed', { code: cause instanceof Error ? cause.name : 'unknown' });
      const message = cause instanceof DOMException && cause.name === 'NotAllowedError' ? 'Разрешите микрофон, чтобы поговорить с Нави.' : cause instanceof Error ? cause.message : 'Не удалось включить голос.';
      if (r) stop(message, 'start_failed'); else emit('error', message);
    }
  }
  return { start, creative: (action: CreativeAction) => { if (run?.ready && !run.closing && run.socket?.readyState === 1) run.socket.send(JSON.stringify({ type: 'creative', action })); }, updateGame, updateDemo, resumePlayback, stop: () => stop(), greet: () => { if (run?.ready && !run.closing && run.socket?.readyState === 1) run.socket.send(JSON.stringify({ type: 'greet' })); }, dispose: () => { stop('', 'unmount'); disposed = true; } };
}
