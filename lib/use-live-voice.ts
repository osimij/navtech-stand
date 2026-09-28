"use client";
import type { VoiceOptions } from './voice-options';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createBoothVoice as createLiveVoice } from './booth-voice-client';
import type { LiveState } from './live-client';
import type { VoiceLanguage, CreativeAction } from './live';
import type { GameContext } from './live-game';
import type { DemoContext } from './live-demo';
import type { SpeechFrame } from './invitation-player';
export function useLiveVoice(onSpeech?: (frame: SpeechFrame) => void, onCaption?: (text: string) => void, onActivity?: () => void, onDiagnostic?: (event:string,details?:Record<string,string|number|boolean>)=>void) {
  const output = useRef({ onSpeech, onCaption, onActivity, onDiagnostic });
  useLayoutEffect(() => { output.current = { onSpeech, onCaption, onActivity, onDiagnostic }; }, [onSpeech, onCaption, onActivity, onDiagnostic]);
  const controller = useRef<ReturnType<typeof createLiveVoice> | null>(null);
  const [state, setState] = useState<LiveState>({ phase: 'idle', error: '' });
  const getController = useCallback(() => controller.current ||= createLiveVoice({
    onDiagnostic: (event, details) => {
      output.current.onDiagnostic?.(event,details);
      void fetch('/api/live/diagnostics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, details }), keepalive: true }).catch(() => {});
    },
    onActivity: () => output.current.onActivity?.(),
    onSpeech: frame => output.current.onSpeech?.(frame), onCaption: text => output.current.onCaption?.(text), onState: setState,
  }), []);
  const start = useCallback((language: VoiceLanguage, action?: CreativeAction, options?: VoiceOptions) => getController().start(language, action, options), [getController]);
  const updateGame = useCallback((game: GameContext) => getController().updateGame(game), [getController]);
  const setName = useCallback((name: string) => getController().setName(name), [getController]);
  const updateDemo = useCallback((demo: DemoContext) => getController().updateDemo(demo), [getController]);
  const stop = useCallback(() => controller.current?.stop(), []);
  const resumePlayback = useCallback(() => controller.current?.resumePlayback(), []);
  const creative = useCallback((action: CreativeAction) => controller.current?.creative(action), []);
  const greet = useCallback(() => controller.current?.greet(), []);
  useEffect(() => {
    const current = getController();
    return () => { current.dispose(); if (controller.current === current) controller.current = null; };
  }, [getController]);
  return { ...state, start, stop, updateGame, setName, updateDemo, greet, creative, resumePlayback, busy: ['connecting', 'ready', 'closing'].includes(state.phase) };
}
