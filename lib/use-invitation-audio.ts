"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { VoiceClip } from "./invitations";
import { createInvitationPlayer, type PlayerState, type SpeechFrame } from "./invitation-player";
export type { SpeechFrame } from "./invitation-player";

export function useInvitationAudio(onSpeech?: (frame: SpeechFrame) => void) {
  const output = useRef(onSpeech);
  useLayoutEffect(() => { output.current = onSpeech; }, [onSpeech]);
  const controller = useRef<ReturnType<typeof createInvitationPlayer> | null>(null);
  const [state, setState] = useState<PlayerState>({ playing: false, busy: false, error: "" });
  const getController = useCallback(() => controller.current ||= createInvitationPlayer({
    onSpeech: speech => output.current?.(speech), onState: setState,
  }), []);
  const play = useCallback((clip: VoiceClip) => getController().play(clip), [getController]);
  const stop = useCallback(() => controller.current?.stop(), []);

  useEffect(() => {
    const current = getController();
    return () => {
      current.dispose();
      if (controller.current === current) controller.current = null;
    };
  }, [getController]);
  return { play, stop, ...state };
}
