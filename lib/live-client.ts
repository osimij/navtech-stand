import type { SpeechFrame } from './invitation-player';
export type LiveState = { phase: 'idle' | 'connecting' | 'ready' | 'closing' | 'error'; error: string; playbackBlocked?: boolean };
type Environment = {
  peer: () => RTCPeerConnection;
  microphone: () => Promise<MediaStream>;
  context: () => AudioContext;
  audio: () => HTMLAudioElement;
  fetch: typeof fetch;
};
const browser: Environment = {
  peer: () => new RTCPeerConnection(),
  microphone: () => navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }),
  context: () => new AudioContext(),
  audio: () => {
    const audio = new Audio(); audio.autoplay = true; audio.setAttribute('playsinline', '');
    audio.hidden = true; document.body.appendChild(audio); return audio;
  },
  fetch: (...args) => fetch(...args),
};
type Run = {
  pc: RTCPeerConnection; channel: RTCDataChannel; context: AudioContext; audio: HTMLAudioElement; playbackBlocked: boolean;
  abort: AbortController; mic?: MediaStream; source?: MediaStreamAudioSourceNode;
  analyser?: AnalyserNode; silentSink?: GainNode; statsMeter?: ReturnType<typeof setInterval>; ready: boolean; closing: boolean; closeError?: string;
  timers: Set<ReturnType<typeof setTimeout>>; meter?: ReturnType<typeof setInterval>;
  acknowledgements: Map<string, ReturnType<typeof setTimeout>>; delegated: Set<string>;
  caption: string; lastCaption: number; language: 'ru' | 'en';
};
export function createLiveVoice(callbacks: {
  onState?: (state: LiveState) => void;
  onDiagnostic?: (event: string, details?: Record<string, string | number | boolean>) => void;
  onSpeech?: (frame: SpeechFrame) => void;
  onCaption?: (text: string) => void;
} = {}, environment: Environment = browser) {
  let run: Run | null = null, disposed = false, command = 0;
  const log = (event: string, details: Record<string, string | number | boolean> = {}) => callbacks.onDiagnostic?.(event, details);
  const emit = (phase: LiveState['phase'], error = '') => { log('state', { phase }); if (!disposed) callbacks.onState?.({ phase, error, playbackBlocked: Boolean(run?.playbackBlocked) }); };
  const silence = () => { if (!disposed) callbacks.onSpeech?.({ speaking: false, level: 0 }); };
  function later(r: Run, fn: () => void, delay: number) {
    const timer = setTimeout(() => { r.timers.delete(timer); if (run === r) fn(); }, delay);
    r.timers.add(timer); return timer;
  }
  function cleanup(r: Run) {
    if (run !== r) return;
    run = null; r.abort.abort(); r.timers.forEach(clearTimeout); clearInterval(r.meter); clearInterval(r.statsMeter);
    r.audio.pause(); r.audio.srcObject = null; r.audio.remove(); r.silentSink?.disconnect();
    r.mic?.getTracks().forEach(track => track.stop()); r.source?.disconnect(); r.analyser?.disconnect();
    r.channel.close(); r.pc.close(); void r.context.close().catch(() => {}); silence();
  }
  function finish(r: Run, error = '') { cleanup(r); emit(error ? 'error' : 'idle', error); }
  function stop(error = '') {
    const r = run; if (!r || r.closing) return;
    r.closing = true; r.closeError = error; r.abort.abort(); r.timers.forEach(clearTimeout); r.timers.clear();
    r.mic?.getTracks().forEach(track => track.stop());
    r.audio.pause(); r.audio.srcObject = null; r.source?.disconnect(); clearInterval(r.meter); clearInterval(r.statsMeter); silence(); emit('closing', error);
    if (r.ready && r.channel.readyState === 'open') {
      try {
        r.channel.send(JSON.stringify({ type: 'session.close' }));
        later(r, () => finish(r, error || 'Разговор отключён; сервер не подтвердил завершение.'), 15000);
        return;
      } catch { /* Transport already unavailable. */ }
    }
    finish(r, error);
  }
  function send(r: Run, type: string, content: string, delegationId: string | null = null) {
    if (run !== r || !r.ready || r.closing || r.channel.readyState !== 'open') return;
    log('command.send', { event: type });
    const eventId = `navi-${++command}`;
    const timer = later(r, () => stop('Нави не ответил. Подключите разговор заново.'), 12000);
    r.acknowledgements.set(eventId, timer);
    try { r.channel.send(JSON.stringify({ type, event_id: eventId, delegation_id: delegationId, content })); }
    catch { stop('Связь с Нави прервалась.'); }
  }
  function greet() {
    if (run) send(run, 'session.instructions.append', `A visitor tapped Navi or arrived at the booth. Greet them now in ${run.language === 'ru' ? 'Russian' : 'English'}, with one fresh, short invitation to the five-question game. Then pause and listen. Do not repeat a greeting if the visitor is currently speaking.`);
  }
  async function playOutput(r: Run) {
    if (run !== r || r.closing || !r.audio.srcObject) return;
    try {
      // Native media playback is independent of the optional mouth analyser.
      await r.audio.play();
      if (run !== r || r.closing) { r.audio.pause(); return; }
      r.playbackBlocked = false; log('playback.started'); emit(r.ready ? 'ready' : 'connecting');
    } catch (cause) {
      if (run !== r || r.closing) return;
      log('playback.blocked', { code: cause instanceof Error ? cause.name : 'unknown' });
      r.playbackBlocked = true; silence(); emit(r.ready ? 'ready' : 'connecting');
    }
  }
  function resumePlayback() {
    const r = run; if (!r || r.closing) return;
    void r.context.resume().catch(() => {});
    void playOutput(r);
  }
  async function start(language: 'ru' | 'en') {
    if (disposed || run) return;
    emit('connecting');
    let r: Run | undefined;
    try {
      // Resume playback in the initiating touch gesture, before any network waits.
      const context = environment.context();
      let pc: RTCPeerConnection;
      try { pc = environment.peer(); } catch (error) { void context.close(); throw error; }
      let channel: RTCDataChannel;
      try { channel = pc.createDataChannel('oai-events'); } catch (error) { pc.close(); void context.close(); throw error; }
      let audio: HTMLAudioElement;
      try { audio = environment.audio(); } catch (error) { channel.close(); pc.close(); void context.close(); throw error; }
      r = { pc, channel, context, audio, playbackBlocked: false, abort: new AbortController(), ready: false, closing: false, timers: new Set(), acknowledgements: new Map(), delegated: new Set(), caption: '', lastCaption: 0, language };
      const current = r; run = r;
      audio.addEventListener('playing', () => log('playback.playing'));
      audio.addEventListener('error', () => { if (run === current && !current.closing) stop('Не удалось воспроизвести голос. Подключите Нави заново.'); });
      later(r, () => stop('Подключение заняло слишком много времени. Попробуйте ещё раз.'), 40000);
      channel.addEventListener('message', ({ data }) => {
        if (run !== current) return;
        let event: { error?: { code?: string; type?: string }; type?: string; delta?: string; client_event_id?: string; delegation?: { id?: string } };
        try { event = JSON.parse(data); } catch { log('event.invalid'); return; }
        if (event.type?.includes('transcript')) {
          if (!current.delegated.has(event.type)) { current.delegated.add(event.type); log('transcript.received', { event: event.type }); }
        } else log('event.received', { event: event.type || 'unknown', code: event.error?.code || event.error?.type || 'none' });
        if (event.type === 'session.closed') { finish(current, current.closeError); return; }
        if (current.closing) return;
        if (event.type === 'session.started' && !current.ready) {
          current.ready = true; current.timers.forEach(clearTimeout); current.timers.clear(); emit('ready');
          later(current, () => stop(), 120000); greet();
          later(current, () => { void pc.getStats?.().then(stats => {
            stats.forEach(report => {
              if ((report.type === 'inbound-rtp' || report.type === 'outbound-rtp') && report.kind === 'audio') log(report.type === 'inbound-rtp' ? 'audio.inbound' : 'audio.outbound', { packets: report.packetsReceived ?? report.packetsSent ?? 0, bytes: report.bytesReceived ?? report.bytesSent ?? 0 });
            });
          }).catch(() => {}); }, 5000);
        } else if (event.type === 'session.output_transcript.delta' && typeof event.delta === 'string') {
          const now = Date.now();
          current.caption = ((now - current.lastCaption > 2200 ? '' : current.caption) + event.delta).slice(-320);
          current.lastCaption = now; if (!disposed) callbacks.onCaption?.(current.caption);
        } else if (event.type === 'session.instructions.appended' || event.type === 'session.commentary.appended') {
          const id = event.client_event_id || ''; const timer = current.acknowledgements.get(id);
          if (timer) { clearTimeout(timer); current.timers.delete(timer); current.acknowledgements.delete(id); }
        } else if (event.type === 'session.delegation.created' && event.delegation?.id && !current.delegated.has(event.delegation.id)) {
          current.delegated.add(event.delegation.id);
          send(current, 'session.commentary.append', 'No external action was performed. This booth demo has no external tools. Explain this briefly; refer exact product details, pricing and vacancies to the NavTech team. The visitor can start the game using the screen.', event.delegation.id);
        } else if (event.type === 'error') stop('Не удалось продолжить разговор. Подключите Нави заново.');
      });
      channel.addEventListener('open', () => log('channel.open', { context: context.state, connection: pc.connectionState }));
      channel.addEventListener('error', () => log('channel.error'));
      pc.addEventListener('iceconnectionstatechange', () => log('ice.changed', { ice: pc.iceConnectionState }));
      context.addEventListener?.('statechange', () => log('context.changed', { context: context.state }));
      channel.addEventListener('close', () => { if (run === current) finish(current, current.closing ? current.closeError : 'Связь с Нави прервалась.'); });
      pc.addEventListener('connectionstatechange', () => {
        log('connection.changed', { connection: pc.connectionState, ice: pc.iceConnectionState });
        if (run === current && ['failed', 'disconnected'].includes(pc.connectionState)) stop('Связь с Нави прервалась.');
      });
      pc.addEventListener('track', event => {
        if (run !== current || current.closing || event.track.kind !== 'audio') return;
        log('audio.track', { muted: event.track.muted, track: event.track.readyState, context: context.state });
        event.track.addEventListener('unmute', () => log('audio.unmuted'));
        event.track.addEventListener('mute', () => log('audio.muted'));
        const remote = event.streams?.[0] || new MediaStream([event.track]);
        current.audio.srcObject = remote;
        void playOutput(current);
        current.source?.disconnect(); current.analyser?.disconnect(); current.silentSink?.disconnect();
        current.analyser = undefined; clearInterval(current.meter); clearInterval(current.statsMeter);
        try {
          const source = context.createMediaStreamSource(remote);
          const analyser = context.createAnalyser(); analyser.fftSize = 256;
          // Only the native audio element reaches speakers. Keep analysis inaudible.
          const sink = context.createGain(); sink.gain.value = 0;
          source.connect(analyser); analyser.connect(sink); sink.connect(context.destination);
          current.source = source; current.analyser = analyser; current.silentSink = sink;
        } catch { log('analyser.unavailable'); }
        const samples = new Uint8Array(256);
        let heard = false, statsLevel = 0, statsAt = 0, statsPending = false;
        // Some embedded browsers deliver the remote audio only to the native player.
        // Decoded RTP levels still provide actual audio-driven mouth movement there.
        current.statsMeter = setInterval(() => {
          if (run !== current || current.closing || statsPending || !pc.getStats) return;
          statsPending = true;
          void pc.getStats().then(stats => {
            if (run !== current || current.closing) return;
            stats.forEach(report => {
              if (report.type === 'inbound-rtp' && report.kind === 'audio' && typeof report.audioLevel === 'number') {
                statsLevel = report.audioLevel; statsAt = Date.now();
              }
            });
          }).catch(() => {}).finally(() => { statsPending = false; });
        }, 150);
        current.meter = setInterval(() => {
          if (run !== current || current.closing || disposed) return;
          let rms = 0;
          if (current.analyser) {
            current.analyser.getByteTimeDomainData(samples);
            rms = Math.sqrt(samples.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / samples.length);
          }
          if (rms < .009 && Date.now() - statsAt < 450) rms = statsLevel;
          if (current.audio.paused || current.audio.muted || current.playbackBlocked) rms = 0;
          if (rms > .009 && !heard) { heard = true; log('audio.signal', { level: rms, context: context.state }); }
          callbacks.onSpeech?.({ speaking: rms > .009, level: Math.min(1, rms * 7) });
        }, 50);
      });
      await context.resume(); log('context.resumed', { context: context.state }); if (run !== r || r.closing) return;
      const availability = await environment.fetch('/api/live', { signal: r.abort.signal });
      if (!availability.ok || !(await availability.json() as { configured?: boolean }).configured) throw Error('Голос ещё не настроен. Добавьте ключ OpenAI в настройках локального приложения.');
      if (run !== r || r.closing) return;
      const mic = await environment.microphone();
      if (run !== r || r.closing) { mic.getTracks().forEach(track => track.stop()); return; }
      r.mic = mic; log('microphone.ready');
      for (const track of mic.getTracks()) {
        track.addEventListener('ended', () => { if (run === current && !current.closing) stop('Микрофон отключён.'); });
        pc.addTrack(track, mic); log('microphone.track', { enabled: track.enabled, muted: track.muted, track: track.readyState });
      }
      await pc.setLocalDescription(await pc.createOffer());
      if (run !== r || r.closing) return;
      if (pc.iceGatheringState !== 'complete') await new Promise<void>((resolve, reject) => {
        const done = () => { if (pc.iceGatheringState === 'complete') { clear(); resolve(); } };
        const aborted = () => { clear(); reject(Error('cancelled')); };
        const timer = setTimeout(() => { clear(); reject(Error('Не удалось подключить микрофон к серверу.')); }, 10000);
        function clear() { clearTimeout(timer); pc.removeEventListener('icegatheringstatechange', done); current.abort.signal.removeEventListener('abort', aborted); }
        pc.addEventListener('icegatheringstatechange', done); current.abort.signal.addEventListener('abort', aborted, { once: true }); done();
      });
      if (run !== r || r.closing) return;
      log('offer.send');
      const response = await environment.fetch('/api/live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sdp: pc.localDescription?.sdp, language }), signal: r.abort.signal });
      log('offer.response', { status: response.status });
      const result = await response.json() as { error?: string; transport?: { sdp?: string } };
      if (run !== r || r.closing) return;
      if (!response.ok) throw Error(result.error || 'Не удалось подключить Нави.');
      if (!result.transport?.sdp?.startsWith('v=0')) throw Error('Не удалось согласовать голосовое соединение.');
      await pc.setRemoteDescription({ type: 'answer', sdp: result.transport.sdp });
      log('answer.applied', { connection: pc.connectionState, ice: pc.iceConnectionState });

    } catch (cause) {
      log('start.failed', { code: cause instanceof Error ? cause.name : 'unknown' });
      if (r && (run !== r || r.closing)) return;
      const message = cause instanceof DOMException && cause.name === 'NotAllowedError' ? 'Разрешите микрофон, чтобы поговорить с Нави.' : cause instanceof Error ? cause.message : 'Не удалось подключить Нави.';
      if (r) stop(message); else emit('error', message);
    }
  }
  return { start, stop: () => stop(), greet, resumePlayback, dispose: () => { stop(); disposed = true; } };
}
