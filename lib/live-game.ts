export type GameContext = {
  phase: 'welcome' | 'name' | 'hello' | 'quiz' | 'result' | 'contact' | 'success';
  step: number; answers: number[]; selected: number | null; interest: string;
};
type Catalog = Pick<typeof import('./quiz'), 'questions' | 'profiles' | 'scoreAnswers' | 'interestLabels'>;
export type GameGuide = ReturnType<typeof createGameGuide>;
export function createGameGuide(catalog: Catalog) {
  function parse(value: unknown): GameContext | null {
    if (!value || typeof value !== 'object') return null;
    const v = value as Partial<GameContext>;
    if (!['welcome','name','hello','quiz','result','contact','success'].includes(v.phase || '') || !Number.isInteger(v.step) || v.step! < 0 || v.step! >= catalog.questions.length || !Array.isArray(v.answers) || v.answers.length > catalog.questions.length || v.answers.some(a => !Number.isInteger(a) || a < 0 || a > 3) || (v.selected !== null && (!Number.isInteger(v.selected) || v.selected! < 0 || v.selected! > 3))) return null;
    if (['result','contact','success'].includes(v.phase!) && v.answers.length !== catalog.questions.length) return null;
    return { phase: v.phase!, step: v.step!, answers: [...v.answers], selected: v.selected!, interest: typeof v.interest === 'string' && Object.hasOwn(catalog.interestLabels, v.interest) ? v.interest : '' };
  }
  function cue(game: GameContext, previous: GameContext | null, language: 'ru'|'en' = 'ru') {
    const changedScreen = !previous || game.phase !== previous.phase || game.step !== previous.step;
    const prefix = 'Current touch-screen state. Keep the conversation language, translating screen text if needed. Use these facts when relevant; do not interrupt. ';
    if (game.phase === 'welcome' || game.phase === 'name' || game.phase === 'hello') return { speak: false, text: prefix + 'Welcome screen. The game has not started.' };
    if (game.phase === 'quiz') {
      const original = catalog.questions[game.step];
      const question = language==='en' ? {...original,title:original.en,options:original.options.map(o=>({...o,text:o.en}))} : original;
      const choice = game.selected === null ? '' : `Visitor selected: ${question.options[game.selected].text}. `;
      if (!changedScreen) return { speak: false, text: `Question ${game.step + 1} selection update: ${choice || 'No selection yet.'} Do not repeat the question; wait for the next screen or a spoken question.` };
      const last = game.step > 0 && game.answers[game.step - 1] !== undefined ? `Previous choice: ${language==='en'?catalog.questions[game.step - 1].options[game.answers[game.step - 1]].en:catalog.questions[game.step - 1].options[game.answers[game.step - 1]].text}. ` : '';
      return { speak: changedScreen, text: prefix + `Question ${game.step + 1}/${catalog.questions.length}: ${question.title} Choices: ${question.options.map(o => o.text).join(' / ')}. ${last}${choice}` + (changedScreen ? 'If there is a pause, react briefly to the actual previous choice or help frame the current decision. Never announce screen contents or add a generic help offer. Touch selects the answer. Do not repeat an introduction or read all choices.' : 'This is a context update only. Do not narrate the click or repeat the question. Wait for the next screen or a spoken question.') };
    }
    if (game.phase === 'result') {
      const result = catalog.scoreAnswers(game.answers);
      const leaders = catalog.profiles.filter((_, i) => result.scores[i] === Math.max(...result.scores)).map(p => language==='en'?p.name:p.title).join(' + ');
      const top = result.top.map(match => {const role=catalog.profiles[match.index];return language==='en'?{...role,...role.en}:role;});
      return { speak: changedScreen, text: prefix + `Result shown: ${leaders}. ${result.tied ? 'These directions tied; do not pick a single winner.' : ''} Top three roles: ${top.map(role=>`${role.title}: ${role.summary}. Actual work: ${role.work}. Work format: ${role.format}`).join('; ')}. These are work preferences, not demonstrated skills or a hiring assessment. The visitor may be an experienced professional. Explain relevant work problems and the role’s value, never suggest internships, skills to learn or a starter project; do not recite the assessment caveat or pitch products unasked. Then listen.` };

    }
    if (game.phase === 'contact') return { speak: changedScreen, text: prefix + `Optional demo/contact form; topic: ${catalog.interestLabels[game.interest] || 'not chosen'}. ${changedScreen ? 'The visitor may leave a contact on screen if they want the team to follow up. Leave them quiet space.' : 'Topic updated. No announcement needed.'} No form values are shared with you. Never request or read out personal contact information. Do not claim it is saved yet. Answer questions when asked.` };
    return { speak: changedScreen, text: prefix + 'The request was successfully saved. If the conversation has paused, thank them briefly, then listen quietly. Do not promise a date or claim that a message was sent. The next participant starts a new conversation.' };
  }
  return { parse, cue };
}
