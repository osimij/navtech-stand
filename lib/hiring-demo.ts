export type DemoLanguage = 'ru' | 'en';
export type Availability = 'week' | 'month' | 'unknown';
export type HiringStage = 'clarify' | 'schedule' | 'later' | 'scheduled';
export type DemoOrigin = 'staff_rehearsal' | 'visitor' | 'automated_test';
export const choices: Availability[] = ['week', 'month', 'unknown'];
export const stages: HiringStage[] = ['clarify', 'schedule', 'later', 'scheduled'];
export const focalId = 'HR-04';
export type SampleCase = { id: string; availability: Availability; scheduled: boolean };
export const sampleCases: readonly SampleCase[] = Object.freeze(([
  { id:'HR-01', availability:'unknown', scheduled:false },
  { id:'HR-02', availability:'week', scheduled:false },
  { id:'HR-03', availability:'month', scheduled:false },
  { id:focalId, availability:'unknown', scheduled:false },
  { id:'HR-05', availability:'unknown', scheduled:false },
  { id:'HR-06', availability:'week', scheduled:true },
] satisfies SampleCase[]).map(row=>Object.freeze(row)));
export function caseStage(row: SampleCase): HiringStage {
  return row.scheduled ? 'scheduled' : row.availability === 'unknown' ? 'clarify' : row.availability === 'month' ? 'later' : 'schedule';
}
export function demoQueue(choice: Availability | null) {
  const rows = sampleCases.map(row=>row.id===focalId && choice ? {...row, availability:choice} : {...row});
  const counts: Record<HiringStage,number> = {clarify:0,schedule:0,later:0,scheduled:0};
  for(const row of rows) counts[caseStage(row)]++;
  return {rows, counts, total:rows.length};
}

export const demoCopy = {
  ru: {
    sample:'Пример данных', language:'Язык', reset:'Начать заново', navi:'Нави — подсказать следующий шаг', hint:'Нажмите — подскажу',
    intro:'Что задерживает найм?', sub:'Один отклик. Одно уточнение. Понятный следующий шаг для команды.', start:'Разобраться за минуту',
    mode:'Учебный сценарий · без микрофона', step:'HR-Agent · разбор отклика', caseTitle:'Когда можно назначить интервью?',
    caseId:'Вымышленный отклик', factLabels:['Вакансия','Опыт','Доступность для интервью'],
    sourceFacts:['Специалист поддержки','2 года в службе поддержки','Готов обсудить удобное время'],
    missing:'В отклике нет конкретного срока. Уточните его и посмотрите, что изменится в очереди.',
    pick:'Выберите ответ кандидата', options:{week:'На этой неделе',month:'В следующем месяце',unknown:'Пока не уточнили'},
    evidence:'Исходный отклик', sourceTitle:'Учебная анкета HR-04 · авторский пример', sourcePrefix:'Точные поля исходной анкеты',
    preserved:'Исходная анкета сохранена. Уточнение показано отдельно.', clarification:'Уточнение в этом сценарии',
    resultTitles:{week:'Одна неясность снята.',month:'Срок понятен. Встречу — позже.',unknown:'Сначала уточним время.'},
    actions:{week:'Рекрутеру — предложить время интервью на этой неделе.',month:'Рекрутеру — согласовать дату следующего контакта.',unknown:'Рекрутеру — уточнить доступность для интервью.'},
    resultNote:'Решение о кандидате остаётся за человеком. Здесь мы организуем работу с откликом.',
    prismTitle:'Где очередь ждёт ответа', denominator:'вымышленных откликов', change:'Ждут уточнения', before:'до', after:'после',
    stageLabels:{clarify:'Уточнить доступность',schedule:'Согласовать время',later:'Вернуться позже',scheduled:'Встреча назначена'},
    insightReduced:'У двух откликов всё ещё нет срока. Начните с них.', insightSame:'У трёх откликов нет срока. Уточнение — следующий шаг.',
    revise:'Измените ответ — очередь пересчитается', explore:'Посмотреть, кто ждёт уточнения', all:'Показать всю очередь', queue:'Учебная очередь',
    youChanged:'Вы изменили', unchanged:'Без уточнения', next:'Для вашей команды', pilot:'Проверить один процесс',
    pilotText:'Возьмите один поток откликов: какие данные нужны рекрутеру и где очередь останавливается?',
    handoff:'Разобрать задачу моей команды', download:'Скачать пример плана', downloadDone:'Пример плана подготовлен к скачиванию.',
    handoffTitle:'Покажите этот пример команде NavTech.', handoffText:'Какой этап найма задерживается у вас? Обсудим один процесс и данные, которые нужны для пилота.',
    notSent:'Контакты не отправлены. Встреча не назначена.', close:'Вернуться к результату',
    naviIntro:'Попробуем убрать одну неясность из найма. Вы управляете примером.', naviCase:'Без срока рекрутеру трудно предложить встречу. Выберите ответ кандидата.',
    naviWeek:'Теперь можно предложить время. В Prism видно, у кого ещё не хватает уточнения.', naviMonth:'Этот отклик подождёт. А вот два других всё ещё требуют уточнения.', naviUnknown:'Честный ответ: пока не знаем. Очередь не меняется — нужен ещё один вопрос.',
    staff:'Репетиция', staffTitle:'Журнал этой вкладки', staffNote:'Только анонимные действия. При закрытии вкладки журнал исчезнет. Нажатие «обсудить» — намерение, не квалифицированный лид.',
    origin:'Источник следующего запуска', origins:{staff_rehearsal:'Репетиция команды',visitor:'Посетитель',automated_test:'Автоматический тест'},
    export:'Скачать журнал JSON', noEvents:'Запусков пока нет.', backQuiz:'Текущая игра', liveBooth:'Аналитика стенда',
    rule:'Авторские данные и локальные правила. Не подключено к рабочей HR-системе.',
    briefTitle:'Пример плана пилота · NavTech HR-Agent × Prism', sampleWarning:'ПРИМЕР ДАННЫХ. Не план вашей компании и не результат проверки реальных кандидатов.',
    briefSections:['Задача','Действие HR-Agent в примере','Вопрос руководителя для Prism','Нужные данные','Ответственный','Граница пилота','Как проверить успех','Допущения'],
    briefValues:['Не терять отклики из-за неуточнённого времени интервью.','', 'Какие отклики ждут уточнения доступности и сколько их в очереди?', 'Анкета, ответ о доступности, статус и дата последнего контакта. Источник и доступ согласовать с владельцем данных.', 'Назначить ответственного рекрутера и владельца процесса — пока не определены.', 'Один согласованный поток откликов; рекрутер проверяет каждое действие.', 'Сначала измерить долю откликов без срока и время до подтверждения времени интервью. Затем сравнить на сопоставимом потоке; цель согласовать с владельцем.', 'Шесть вымышленных откликов; данные заданы локально. Реальные интеграции, сроки, цена и экономия не оценены.'],
    measurements:'Наблюдение в примере', human:'Автоматического отбора, отправки приглашений и бронирования встреч нет.',
  },
  en: {
    sample:'Sample data', language:'Language', reset:'Start again', navi:'Navi — suggest the next step', hint:'Tap for a hint',
    intro:'What is holding up hiring?', sub:'One application. One clarification. A clear next step for the team.', start:'Explore in a minute',
    mode:'Sample scenario · no microphone', step:'HR-Agent · application review', caseTitle:'When can we arrange an interview?',
    caseId:'Fictional application', factLabels:['Role','Experience','Interview availability'], sourceFacts:['Support specialist','2 years in customer support','Happy to discuss a suitable time'],
    missing:'The application gives no specific timing. Clarify it and see what changes in the queue.', pick:'Choose the candidate’s reply',
    options:{week:'This week',month:'Next month',unknown:'Not clarified yet'}, evidence:'Original application', sourceTitle:'Sample form HR-04 · authored example', sourcePrefix:'Exact fields from the original form', preserved:'The original form is preserved. The clarification is shown separately.', clarification:'Clarification in this scenario',
    resultTitles:{week:'One uncertainty resolved.',month:'Timing is clear. Interview later.',unknown:'First, clarify the timing.'},
    actions:{week:'Recruiter: propose an interview time this week.',month:'Recruiter: agree when to follow up.',unknown:'Recruiter: ask about interview availability.'},
    resultNote:'The hiring decision stays with a person. This example organizes the work around an application.',
    prismTitle:'Where the queue needs an answer', denominator:'fictional applications', change:'Awaiting clarification',before:'before',after:'after',
    stageLabels:{clarify:'Clarify availability',schedule:'Agree a time',later:'Follow up later',scheduled:'Interview scheduled'},
    insightReduced:'Two applications still have no timeframe. Start with those.',insightSame:'Three applications have no timeframe. Clarification is the next step.',
    revise:'Change the reply — the queue recalculates',explore:'See who needs clarification',all:'Show the full queue',queue:'Sample queue',youChanged:'You changed',unchanged:'Not clarified',
    next:'For your team',pilot:'Test one process',pilotText:'Take one application stream: what does the recruiter need, and where does the queue stall?',
    handoff:'Discuss my team’s process',download:'Download sample plan',downloadDone:'The sample plan is ready to download.',handoffTitle:'Show this example to the NavTech team.',handoffText:'Which hiring step stalls in your organization? Let’s discuss one process and the data a pilot would need.',notSent:'No contact details sent. No meeting booked.',close:'Back to the result',
    naviIntro:'Let’s remove one uncertainty from hiring. You control the example.',naviCase:'Without a timeframe, it is hard to propose a meeting. Choose the candidate’s reply.',naviWeek:'Now a recruiter can propose a time. Prism shows who still needs clarification.',naviMonth:'This application can wait. Two others still need clarification.',naviUnknown:'An honest answer: we do not know yet. The queue stays the same — ask one more question.',
    staff:'Rehearsal',staffTitle:'This tab’s event log',staffNote:'Anonymous actions only. Closing this tab clears the log. A discussion click indicates intent, not a qualified lead.',origin:'Origin of the next run',origins:{staff_rehearsal:'Staff rehearsal',visitor:'Visitor',automated_test:'Automated test'},export:'Download JSON log',noEvents:'No runs yet.',backQuiz:'Current game',liveBooth:'Booth analytics',rule:'Authored data and local rules. Not connected to a production HR system.',
    briefTitle:'Sample pilot plan · NavTech HR-Agent × Prism',sampleWarning:'SAMPLE DATA. Not a plan for your company or an evaluation of real applicants.',
    briefSections:['Task','HR-Agent action in this example','Management question for Prism','Required data','Owner','Pilot scope','How to measure success','Assumptions'],
    briefValues:['Keep applications moving by clarifying interview availability.','','Which applications need availability clarification, and how many are in the queue?','Application, availability reply, status and last-contact date. Agree the source and access with the data owner.','Assign a recruiter and process owner — not yet specified.','One agreed application stream; a recruiter checks each action.','First measure the share without a timeframe and time until interview timing is confirmed. Compare a similar stream; agree a target with its owner.','Six fictional applications, authored locally. Real integrations, delivery dates, price and savings have not been assessed.'],measurements:'Observation in the sample',human:'No automatic selection, invitations or meeting bookings.',
  },
} as const;

export function sampleBrief(language: DemoLanguage, choice: Availability) {
  const c=demoCopy[language === 'en' ? 'en' : 'ru'], queue=demoQueue(choice);
  const sections=c.briefSections.map((heading,index)=>`## ${heading}\n\n${index===1?c.actions[choice]:c.briefValues[index]}`).join('\n\n');
  return `# ${c.briefTitle}\n\n${c.sampleWarning}\n\n${c.sourceTitle}\n\n${c.sourceFacts.map((fact,i)=>`- ${c.factLabels[i]}: “${fact}”`).join('\n')}\n\n${c.clarification}: ${c.options[choice]}\n\n${sections}\n\n## ${c.measurements}\n\n${c.change}: 3 → ${queue.counts.clarify} / ${queue.total}.\n${stages.map(stage=>`- ${c.stageLabels[stage]}: ${queue.counts[stage]} / ${queue.total}`).join('\n')}\n\n${c.human}\n${c.rule}\n`;
}
