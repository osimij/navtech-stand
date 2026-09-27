import type {GameContext} from './live-game';
import {questions, profiles, scoreAnswers} from './quiz.ts';
import {auditionTexts, type VoiceLanguage} from './voice-catalog.ts';

// Curated spoken copy for output-only TTS. No visitor text or contact fields enter synthesis.
const frames={
 ru:['Заказов стало меньше. С чего вы начнёте разбираться?','Отчёт снова собирают вручную. За какую часть вы бы взялись?','Нужно разбирать входящие обращения. Какая часть задачи вам ближе?','«Сделайте сервис лучше». Техническое задание на три слова. С чего начнёте?','Инструмент иногда ошибается. Что вам важнее проверить?','Представьте: пара часов без встреч. Да, такое тоже бывает. Какой задачей займётесь?','До разбора проекта один день. Что стоит показать команде?','И последний выбор. Какой результат порадует вас больше?'],
 en:['Orders are down. Where would you start looking?','Another report put together by hand. Which part would you take on?','Incoming requests need sorting. Which part of that work interests you?','“Make the service better.” Quite a brief. Where would you start?','The tool gets things wrong sometimes. What would you want to check?','Imagine a couple of hours with no meetings. Yes, it does happen. Which task would you pick?','One day until the project review. What would you show the team?','One last choice. Which result would feel most satisfying?'],
};
export type NarrationCue='screen'|'tap';
// Approved, finite lines. No LLM, prompts, visitor text or inferred traits.
export const tapLines={
 ru:{
  welcome:['Привет! Я Нави. Моя часть — говорить. Ваша — выбирать на экране. Начнём?','Восемь ситуаций, никаких собеседований. Даже вопроса «кем вы видите себя через пять лет» не будет.','Я уже на рабочем месте. Правда, рабочее место — это весь экран. Нажмите «Начать» — покажу, что здесь можно сделать.'],
  quiz:['Выбирайте то, за что вам было бы интереснее взяться. Здесь можно обойтись без правильного ответа.','Не торопитесь. У меня следующая встреча — тоже здесь. Выберите подход на экране.','Если близки два варианта, выберите тот, с которого начали бы в реальной задаче.'],
  result:['Откройте карточки ролей: внутри — конкретные задачи и польза для команды. Что вам ближе?','Это повод сравнить рабочие задачи. За вас карьеру я не выбираю — у меня даже резюме нет.','Можно вернуться к ответам и посмотреть, как изменятся направления. Любопытство здесь только приветствуется.'],
  contact:['Контакт можно оставить на экране, если хотите обсудить продукты NavTech. Это необязательно.','Здесь я помолчу: контакты лучше вводить, а не произносить вслух.','Если пока не хочется оставлять контакт, можно просто вернуться к результату.'],
  success:['Спасибо, что заглянули! Передаю экран следующему любопытному гостю.','Готово! А я пока потренирую приветственный взмах.','До встречи! Было приятно познакомиться через ваши выборы.'],
 },
 en:{
  welcome:['Hi, I’m Navi. I do the talking. You make the choices on screen. Shall we start?','Eight situations, no interview. I won’t even ask where you see yourself in five years.','I’m already at my desk. My desk just happens to be this entire screen. Tap Start and I’ll show you around.'],
  quiz:['Pick the part you’d find most interesting to work on. There’s no right answer to guess.','Take your time. My next meeting is also right here. Choose an approach on screen.','If two options fit, pick the one you would start with on a real task.'],
  result:['Open the role cards to see the actual tasks and their value to a team. Which feels more interesting?','These are work directions to explore. I’m not choosing your career for you. I don’t even have a CV.','You can revisit your answers and see how the directions change. Curiosity is very welcome here.'],
  contact:['You can leave a contact on screen if you’d like to discuss NavTech products. It’s optional.','I’ll keep quiet here. Contact details belong on the screen, not out loud.','If you’d rather not leave a contact, you can simply return to your result.'],
  success:['Thanks for stopping by! The screen is ready for the next curious visitor.','All done! I’ll practice my welcoming wave while I wait.','See you around! It was nice getting to know your choices.'],
 },
} as const;
export function narrationText(game:GameContext,language:VoiceLanguage,cue:NarrationCue='screen',variant=0){
 if(cue==='tap')return tapLines[language][game.phase][variant%3];
 if(game.phase==='welcome')return auditionTexts.welcome[language];
 if(game.phase==='quiz'){
   const previous=game.step>0?questions[game.step-1]?.options[game.answers[game.step-1]]:undefined;
   // A short acknowledgement of the selected approach only; no invented personal ability.
   const lead=previous && game.step===1 ? (language==='ru'?'Принято. ':'Got it. '):previous&&game.step===5?(language==='ru'?'Половина позади. ':'We’re past halfway. '):'';
   return lead+frames[language][game.step];
 }
 if(game.phase==='result'){
   const result=scoreAnswers(game.answers), role=profiles[result.top[0].index];
   if(result.tied)return language==='ru'?'В ответах несколько направлений набрали одинаковую поддержку. Откройте роли и сравните рабочие задачи.':'A few directions came through equally in your choices. Open the roles and compare the work involved.';
   return language==='ru'?`Вашим ответам ближе роль «${role.title}». ${role.summary} Посмотрите, какие задачи стоят за ней.`:`Your choices lean toward the ${role.name} role. ${role.en.summary} Take a look at the tasks behind it.`;
 }
 if(game.phase==='contact')return language==='ru'?'Если хотите обсудить продукты с командой, оставьте контакт на экране. Это необязательно.':'If you’d like to discuss the products with the team, you can leave a contact on screen. It’s optional.';
 return language==='ru'?'Готово, заявка сохранена. Спасибо, что заглянули!':'Your request is saved. Thanks for stopping by!';
}
