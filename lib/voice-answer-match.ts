// Spoken answers on the question screens: turns what the visitor said into one of the answers, or nothing.
// Local and deterministic, no model. An answer is recognized by the words of its heading or text, or by its position
// («второй», "the third one"). When two answers are equally likely, or nothing is clear, the result is null and the
// visitor is asked again. Touch always works as well.
export type SpokenCandidate = { heading: string; text: string };
export type SpokenMatch = { index: number; by: 'words' | 'position' };

const ordinals = [
 ['первый','первая','первое','первого','первую','первом','first'],
 ['второй','вторая','второе','второго','вторую','втором','second'],
 ['третий','третья','третье','третьего','третью','третьем','third'],
 ['четвертый','четвертая','четвертое','четвертого','четвертую','четвертом','последний','последняя','последнее','последнего','последнюю','fourth','last'],
];
// Plain numbers only count when they clearly name an answer («вариант два», "number three") or are said alone,
// since "one" and «один» are common inside ordinary sentences.
const numbers = [['один','одна','1','one'],['два','две','2','two'],['три','3','three'],['четыре','4','four']];
const pointers = new Set(['номер','вариант','ответ','пункт','number','option','answer','choice']);
const stopwords = new Set([
 'этот','этого','этой','этом','эту','который','которая','которые','какой','какая','какие','какую','чтобы','если','тоже','также',
 'очень','просто','давайте','давай','наверное','думаю','хочу','выбираю','выберу','выбрал','выбрала','пожалуйста','вариант','ответ',
 'номер','пункт','было','будет','есть','свой','свою','свои','сами','сама','само','самый','только','меня','него','нему','когда','тогда',
 'this','that','these','those','with','from','have','which','what','where','whether','would','could','should','about','there',
 'their','they','them','then','than','into','your','just','like','pick','choose','think','maybe','please','option','answer',
 'number','choice','will','want','does',
]);

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = (text: string) => normalize(text).split(' ').filter(Boolean);
// Russian and English inflect at the end of a word, so a shortened stem that is a prefix of the other word's stem
// counts as the same word: «цены»/«цена», «оплаты»/«оплату», "shoppers"/"shop".
const stem = (word: string) => word.length > 5 ? word.slice(0, -2) : word.slice(0, -1);
const content = (text: string) => [...new Set(words(text).filter(word => word.length >= 4 && !stopwords.has(word) && !/^\d+$/.test(word)).map(stem))];
const same = (a: string, b: string) => a.startsWith(b) || b.startsWith(a);

function byWords(said: string[], candidates: SpokenCandidate[]): number | null {
 const found = candidates.map(candidate => {
  const heading = content(candidate.heading), text = content(candidate.text);
  const hits = said.map((word): number => heading.some(h => same(word, h)) ? 2 : text.some(t => same(word, t)) ? 1 : 0);
  // A heading word says more than a word from the longer answer text.
  return { score: hits.reduce((sum, hit) => sum + hit, 0), matched: hits.filter(Boolean).length };
 });
 const best = Math.max(...found.map(f => f.score)), index = found.findIndex(f => f.score === best);
 if (!best || found.filter(f => f.score === best).length > 1) return null;
 // At least half of what was said has to point to this answer, so a passing remark that happens to share one word
 // («мой знакомый работает в банке») is not taken for «Работа оплаты».
 return found[index].matched * 2 >= said.length ? index : null;
}

function byPosition(said: string[], count: number): number | null {
 const found: number[] = [];
 said.forEach((word, at) => {
  const ordinal = ordinals.findIndex(forms => forms.includes(word));
  const number = numbers.findIndex(forms => forms.includes(word));
  if (ordinal >= 0) found.push(ordinal);
  else if (number >= 0 && (said.length <= 2 || pointers.has(said[at - 1]))) found.push(number);
 });
 // The last position mentioned wins («не первый, а второй», "the first… no, the third"), unless it is a question
 // between two («первый или второй?»).
 if (new Set(found).size > 1 && (said.includes('или') || said.includes('or'))) return null;
 const last = found.at(-1);
 return last !== undefined && last < count ? last : null;
}

export function matchSpokenAnswer(transcript: string, candidates: SpokenCandidate[]): SpokenMatch | null {
 const all = words(transcript);
 if (!all.length) return null;
 const index = byWords(content(transcript), candidates);
 if (index !== null) return { index, by: 'words' };
 const position = byPosition(all, candidates.length);
 return position === null ? null : { index: position, by: 'position' };
}
