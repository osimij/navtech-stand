export const invitationScripts = {
  ru: [
    "Как вы подходите к рабочим задачам? Восемь ситуаций — и три профессиональные роли по вашим ответам.",
    "Что вам ближе: искать закономерности или придумывать новое? Давайте проверим.",
    "Здесь нет правильных ответов. Восемь ситуаций из реальной работы. Попробуем?",
  ],
  en: [
    "Hey. Which work would you enjoy? Eight situations, three careers to explore.",
    "Spotting patterns or coming up with new ideas? Which sounds more like you?",
    "No résumé. No right answers. Eight real work situations. Want to give it a go?",
  ],
} as const;
export type InvitationLanguage = keyof typeof invitationScripts;
export type VoiceClip = { id: string; language: InvitationLanguage; text: string; src: string; voice: string; preview?: boolean; envelope?: number[] };
export function validVoiceClip(value: unknown): value is VoiceClip {
  if (!value || typeof value !== "object") return false;
  const clip = value as Record<string, unknown>;
  return typeof clip.id === "string" && (clip.language === "ru" || clip.language === "en") && typeof clip.text === "string" && typeof clip.voice === "string" && typeof clip.src === "string" && /^\/audio\/[a-zA-Z0-9_-]+\.(mp3|wav|m4a)$/.test(clip.src) && (clip.preview === undefined || typeof clip.preview === 'boolean') && (clip.envelope === undefined || Array.isArray(clip.envelope) && clip.envelope.length <= 2400 && clip.envelope.every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&n<=1));
}
