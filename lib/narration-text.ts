import type {GameContext} from './live-game';
import {questions, profiles, scoreAnswers} from './quiz.ts';
import {auditionTexts, type VoiceLanguage} from './voice-catalog.ts';
import {visitorName} from './visitor-name.ts';

// Curated spoken copy for output-only TTS. No contact fields enter synthesis. The one visitor text Navi may say is
// the first name typed on the name step, and only after `visitorName` accepts it; lines with a name are never cached.
const frames={
 ru:['Заказов стало меньше. С чего вы начнёте разбираться?','Отчёт снова собирают вручную. За какую часть вы бы взялись?','Нужно разбирать входящие обращения. Какая часть задачи вам ближе?','«Сделайте сервис лучше». Техническое задание на три слова. С чего начнёте?','Инструмент иногда ошибается. Что вам важнее проверить?','Представьте: пара часов без встреч. Да, такое тоже бывает. Какой задачей займётесь?','До разбора проекта один день. Что стоит показать команде?','И последний выбор. Какой результат порадует вас больше?'],
 en:['Orders are down. Where would you start looking?','Another report put together by hand. Which part would you take on?','Incoming requests need sorting. Which part of that work interests you?','“Make the service better.” Quite a brief. Where would you start?','The tool gets things wrong sometimes. What would you want to check?','Imagine a couple of hours with no meetings. Yes, it does happen. Which task would you pick?','One day until the project review. What would you show the team?','One last choice. Which result would feel most satisfying?'],
};
// The request steps after the result, one field per screen: name (only if the visitor skipped it), contact, topic, send.
export const contactSteps=['name','reach','topic','consent'] as const;
export type ContactStep=typeof contactSteps[number];
const contactLines={
 ru:{name:'Как вас зовут? Так команде будет проще к вам обратиться.',reach:'Как с вами связаться? Телефон, почта или Telegram. Введите на экране, вслух не нужно.',topic:'О чём вы хотите поговорить с командой?',consent:'Проверьте заявку и отправьте её.'},
 en:{name:'What’s your name? It helps the team address you.',reach:'How can the team reach you? Phone, email or Telegram. Type it on screen, no need to say it.',topic:'What would you like to talk to the team about?',consent:'Check your request and send it.'},
};
export type NarrationCue='screen'|'tap';
// Approved, finite lines. No LLM, prompts, visitor text or inferred traits.
export const tapLines={
 ru:{
  welcome:['Привет! Я Нави. Моя часть — говорить. Ваша — выбирать на экране. Начнём?','Восемь ситуаций, никаких собеседований. Даже вопроса «кем вы видите себя через пять лет» не будет.','Я уже на рабочем месте. Правда, рабочее место — это весь экран. Нажмите «Начать» — покажу, что здесь можно сделать.'],
  name:['Достаточно имени. Фамилию оставим для визиток.','С именем мне будет проще к вам обращаться. Можно и без него — кнопка чуть ниже.','Напишите имя на экране. Я буду помнить его до конца игры.'],
  hello:['Нажмите «Начать» — восемь ситуаций, около двух минут.','Никаких собеседований. Даже вопроса «кем вы видите себя через пять лет» не будет.','Я уже на рабочем месте. Правда, рабочее место — это весь экран. Нажмите «Начать».'],
  quiz:['Выбирайте то, за что вам было бы интереснее взяться. Здесь можно обойтись без правильного ответа.','Не торопитесь. У меня следующая встреча — тоже здесь. Выберите подход на экране.','Если близки два варианта, выберите тот, с которого начали бы в реальной задаче.'],
  result:['Откройте карточки ролей: внутри — конкретные задачи и польза для команды. Что вам ближе?','Это повод сравнить рабочие задачи. За вас карьеру я не выбираю — у меня даже резюме нет.','Можно вернуться к ответам и посмотреть, как изменятся направления. Любопытство здесь только приветствуется.'],
  contact:['Заявка необязательна. Если передумаете, можно просто вернуться к результату.','Здесь я помолчу: контакты лучше вводить, а не произносить вслух.','Команда NavTech свяжется с вами, чтобы обсудить HR Agent и Prism.'],
  success:['Спасибо, что заглянули! Передаю экран следующему любопытному гостю.','Готово! А я пока потренирую приветственный взмах.','До встречи! Было приятно познакомиться через ваши выборы.'],
 },
 en:{
  welcome:['Hi, I’m Navi. I do the talking. You make the choices on screen. Shall we start?','Eight situations, no interview. I won’t even ask where you see yourself in five years.','I’m already at my desk. My desk just happens to be this entire screen. Tap Start and I’ll show you around.'],
  name:['A first name is plenty. Surnames are for business cards.','Your name lets me talk to you properly. You can also skip it — the option is just below.','Type your name on screen. I’ll remember it until the end of the game.'],
  hello:['Tap Start. Eight situations, about two minutes.','No interview. I won’t even ask where you see yourself in five years.','I’m already at my desk. My desk just happens to be this entire screen. Tap Start.'],
  quiz:['Pick the part you’d find most interesting to work on. There’s no right answer to guess.','Take your time. My next meeting is also right here. Choose an approach on screen.','If two options fit, pick the one you would start with on a real task.'],
  result:['Open the role cards to see the actual tasks and their value to a team. Which feels more interesting?','These are work directions to explore. I’m not choosing your career for you. I don’t even have a CV.','You can revisit your answers and see how the directions change. Curiosity is very welcome here.'],
  contact:['The request is optional. If you change your mind, you can simply return to your result.','I’ll keep quiet here. Contact details belong on the screen, not out loud.','The NavTech team will get in touch to discuss HR Agent and Prism.'],
  success:['Thanks for stopping by! The screen is ready for the next curious visitor.','All done! I’ll practice my welcoming wave while I wait.','See you around! It was nice getting to know your choices.'],
 },
} as const;
export function narrationText(game:GameContext,language:VoiceLanguage,cue:NarrationCue='screen',variant=0,typedName?:unknown){
 const name=typedName===undefined?null:visitorName(typedName);
 if(cue==='tap')return tapLines[language][game.phase][variant%3];
 if(game.phase==='welcome')return auditionTexts.welcome[language];
 if(game.phase==='name')return language==='ru'?'Привет! Я Нави. Как вас зовут?':'Hi there! I’m Navi. What’s your name?';
 if(game.phase==='hello'){
   if(language==='ru')return (name?`Очень приятно, ${name}! Впереди восемь рабочих ситуаций.`:'Впереди восемь рабочих ситуаций. Правильных ответов нет.')+' Выбирайте то, что ближе вам. Нажмите «Начать».';
   return (name?`Nice to meet you, ${name}! Eight work situations are next.`:'Eight work situations are next. There are no right answers.')+' Pick whatever feels closest to you. Tap Start when you’re ready.';
 }
 if(game.phase==='quiz'){
   const previous=game.step>0?questions[game.step-1]?.options[game.answers[game.step-1]]:undefined;
   // A short acknowledgement of the selected approach only; no invented personal ability.
   const lead=previous && game.step===1 ? (language==='ru'?'Принято. ':'Got it. '):previous&&game.step===5?(language==='ru'?'Половина позади. ':'We’re past halfway. '):'';
   return lead+frames[language][game.step];
 }
 if(game.phase==='result'){
   // Navi then asks the question the result screen puts beside it: whether the visitor would like to leave a request.
   const result=scoreAnswers(game.answers), role=profiles[result.top[0].index];
   const ask=language==='ru'?' Хотите оставить заявку? Команда NavTech свяжется с вами.':' Would you like to leave a request? The NavTech team will get in touch.';
   if(result.tied)return (language==='ru'?`${name?`${name}, в`:'В'} ответах несколько направлений набрали одинаковую поддержку. Откройте роли и сравните рабочие задачи.`:`${name?`${name}, a`:'A'} few directions came through equally in your choices. Open the roles and compare the work involved.`)+ask;
   return (language==='ru'?`${name?`${name}, в`:'В'}ашим ответам ближе роль «${role.title}». ${role.summary}`:`${name?`${name}, your`:'Your'} choices lean toward the ${role.name} role. ${role.en.summary}`)+ask;
 }
 if(game.phase==='contact')return contactLines[language][contactSteps[game.step]??'reach'];
 if(language==='ru')return name?`Спасибо, ${name}! Заявка у команды NavTech. Хорошего форума!`:'Готово, заявка сохранена. Спасибо, что заглянули!';
 return name?`Thank you, ${name}! The NavTech team has your request. Enjoy the forum!`:'Your request is saved. Thanks for stopping by!';
}
