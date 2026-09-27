export const realtimeVoices = ['alloy','ash','ballad','coral','echo','sage','shimmer','verse','marin','cedar'] as const;
export type RealtimeVoice = typeof realtimeVoices[number];
export type VoiceOptions = { voice?: RealtimeVoice; narration?: boolean };
export function isRealtimeVoice(value: unknown): value is RealtimeVoice {
  return typeof value === 'string' && (realtimeVoices as readonly string[]).includes(value);
}
export function savedVoice(language: 'ru'|'en'): RealtimeVoice {
  try { const value = localStorage.getItem(`navi-voice-${language}`); if (isRealtimeVoice(value)) return value; } catch { /* Private browsing still permits the default voice. */ }
  return 'marin';
}
export function saveVoice(language: 'ru'|'en', voice: RealtimeVoice) {
  try { localStorage.setItem(`navi-voice-${language}`, voice); window.dispatchEvent(new Event('navi-voice-change')); } catch { /* Selection remains usable for this page. */ }
}
