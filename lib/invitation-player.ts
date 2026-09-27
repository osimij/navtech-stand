import type { VoiceClip } from "./invitations";

export type SpeechFrame = { speaking: boolean; level: number };
export type PlayResult = "started" | "cancelled" | "failed";
export type PlayerState = { playing: boolean; busy: boolean; error: string };
type Environment = {
  createAudio: () => HTMLAudioElement;
  createContext: () => AudioContext | null;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
};
const browser: Environment = {
  createAudio: () => new Audio(),
  createContext: () => typeof AudioContext === "undefined" ? null : new AudioContext(),
  requestFrame: callback => requestAnimationFrame(callback),
  cancelFrame: id => cancelAnimationFrame(id),
};

export function createInvitationPlayer({ onSpeech, onState }: {
  onSpeech?: (frame: SpeechFrame) => void;
  onState?: (state: PlayerState) => void;
} = {}, environment: Environment = browser) {
  let audio: HTMLAudioElement | null = null, context: AudioContext | null = null;
  let analyser: AnalyserNode | null = null, source: MediaElementAudioSourceNode | null = null;
  let serial = 0, frame = 0, disposed = false, cancelPending: (() => void) | null = null;
  let state: PlayerState = { playing: false, busy: false, error: "" };

  function update(patch: Partial<PlayerState>) {
    state = { ...state, ...patch };
    if (!disposed) onState?.(state);
  }
  function closeMouth() {
    environment.cancelFrame(frame); frame = 0;
    onSpeech?.({ speaking: false, level: 0 });
  }
  function stop() {
    serial++; cancelPending?.(); cancelPending = null;
    audio?.pause();
    if (audio) audio.currentTime = 0;
    closeMouth(); update({ playing: false, busy: false });
  }
  function play(clip: VoiceClip): Promise<PlayResult> {
    if (disposed) return Promise.resolve("cancelled");
    stop(); update({ busy: true, error: "" });
    const id = serial;
    return new Promise(resolve => {
      let outcome: PlayResult | undefined;
      const current = () => !disposed && id === serial;
      const finish = (result: PlayResult) => {
        if (outcome) return;
        outcome = result;
        if (current()) cancelPending = null;
        resolve(result);
      };
      cancelPending = () => finish("cancelled");
      const reset = () => { closeMouth(); update({ playing: false, busy: false }); };
      const fail = (cause?: unknown) => {
        if (!current() || outcome === "cancelled") { finish("cancelled"); return; }
        // Settle before pause: pause may synchronously fire its own event.
        finish("failed"); audio?.pause(); reset();
        update({ error: cause instanceof Error && cause.name === "NotAllowedError"
          ? "Нажмите на Нави или кнопку голоса, чтобы разрешить звук."
          : "Не удалось воспроизвести запись. Проверьте аудиофайл и повторите." });
      };
      try {
        audio ||= environment.createAudio();
        if (!context) {
          let candidate: AudioContext | null = null, attached = false;
          try {
            candidate = environment.createContext();
            if (candidate) {
              const meter = candidate.createAnalyser(); meter.fftSize = 256;
              const input = candidate.createMediaElementSource(audio); attached = true;
              input.connect(meter); meter.connect(candidate.destination);
              context = candidate; analyser = meter; source = input;
            }
          } catch {
            void candidate?.close().catch(() => {});
            // An attached element stays routed through its graph, even if setup failed.
            if (attached) audio = environment.createAudio();
          }
        }
        const player = audio;
        player.preload = "auto"; player.src = clip.src;
        // A queued event from the previous source can reach the new handlers.
        player.onpause = () => { if (current() && player.paused) { reset(); finish("cancelled"); } };
        player.onended = () => { if (current() && player.ended) reset(); };
        player.onwaiting = () => { if (current()) { closeMouth(); update({ playing: false, busy: true }); } };
        player.onerror = () => fail();
        player.onplaying = () => {
          if (!current()) return;
          update({ playing: true, busy: true });
          onSpeech?.({ speaking: true, level: 0 });
          const samples = new Uint8Array(analyser?.fftSize || 256);
          let last = -Infinity;
          const tick = (time: number) => {
            if (!current() || player.paused || player.ended) { closeMouth(); return; }
            if (time - last >= 50) {
              let level = 0;
              if (analyser) {
                analyser.getByteTimeDomainData(samples);
                let sum = 0; for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
                level = Math.min(1, Math.sqrt(sum / samples.length) * 7);
              } else if (clip.envelope?.length) {
                level = clip.envelope[Math.min(clip.envelope.length - 1, Math.floor(player.currentTime * 20))] || 0;
              }
              onSpeech?.({ speaking: true, level }); last = time;
            }
            frame = environment.requestFrame(tick);
          };
          environment.cancelFrame(frame); frame = environment.requestFrame(tick);
        };
        // Both calls happen synchronously inside the initiating gesture.
        const ready = context?.resume();
        void Promise.all([player.play(), ready]).then(
          () => finish(current() ? "started" : "cancelled"), fail,
        );
      } catch (cause) { fail(cause); }
    });
  }
  function dispose() {
    if (disposed) return;
    disposed = true; stop();
    if (audio) audio.onpause = audio.onended = audio.onwaiting = audio.onerror = audio.onplaying = null;
    source?.disconnect(); analyser?.disconnect();
    void context?.close().catch(() => {});
    audio = null; context = null; analyser = null; source = null;
  }
  return { play, stop, dispose, getState: () => ({ ...state }) };
}
