// The visitor's first name, typed on the name step. Navi shows it and says it aloud at a public booth, so only a
// short name made of letters passes: up to three words, no digits or symbols, nothing from the blocklist below.
// Anything else is no name at all; the screen asks again and the visitor can continue without one.

// Word starts and whole words that must never be spoken by the booth. Matching is by word, so names such as
// Хуан or Сукхроб are not caught by a shorter stem.
const blockedStarts = ['хуй','хуе','хуё','хуя','пизд','ебан','ебат','ебал','ёбан','уеб','долбоеб','долбоёб','пидор','пидар','гандон','залуп','дроч','шлюх','мудак','мудил','говн','fuck','shit','cunt','bitch','whore','slut','nigg','fagg','asshole','porn'];
const blockedWords = new Set(['бля','блять','блядь','сука','суки','жопа','жопу','срака','член','хер','dick','cock','pussy','penis','sex','секс','ass','fag']);

export function visitorName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 24) return null;
  if (!/^\p{L}[\p{L}\p{M}'’-]*(?: \p{L}[\p{L}\p{M}'’-]*){0,2}$/u.test(name)) return null;
  const words = name.toLocaleLowerCase('ru').split(/[ '’-]+/).filter(Boolean);
  if (words.some(word => blockedWords.has(word) || blockedStarts.some(stem => word.startsWith(stem)))) return null;
  return name.split(' ').map(word => word.charAt(0).toLocaleUpperCase('ru') + word.slice(1)).join(' ');
}

// A contact the team can use: an email, a phone number (7 to 15 digits) or a Telegram @username. The request step
// checks it on screen before sending; the leads route applies the same rule.
export function validContact(value: string) {
  const contact = value.trim(), digits = contact.replace(/\D/g, '').length;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    || (/^\+?[0-9 ()-]{7,25}$/.test(contact) && digits >= 7 && digits <= 15)
    || /^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(contact);
}
