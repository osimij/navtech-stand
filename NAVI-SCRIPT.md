# Navi — approved booth script

Sienna / Eleven v3. Output-only: the visitor chooses on the screen. All spoken text comes from this approved catalogue; there is no free-form dialogue or visitor prompt.

## Boundaries

- No microphone, transcription or listening. Camera data stays local.
- No improvised facts, personal assessment, vacancies, promises or product claims.
- Results use the existing local scoring; ties remain ties.
- Only approved text is sent for speech synthesis. Contact fields and images are excluded. The one visitor text Navi says is the first name typed on the name step, and only after `visitorName` accepts it (letters only, 2–24 characters, up to three words, no blocklisted word). Lines with a name are synthesized each time and never cached.
- Touch hints: at most one every 6.5 seconds, up to 12 per visitor. The visual reaction can still run.
- Screen changes cancel obsolete speech. Mute, reset, hide, settings and the ten-minute cap stop narration. No automatic voice fallback or paid retry.
- Reduced motion disables animated gestures, gaze movement and mouth motion.

## Русский

### Screen lines

- Welcome: Привет! Я Нави. Здесь нет правильных ответов — просто выберите, как вы подошли бы к задаче. Интересно, что получится.
- Name (after the language tap): Привет! Я Нави. Как вас зовут?
- Hello: Очень приятно, {имя}! Впереди восемь рабочих ситуаций. Выбирайте то, что ближе вам. Нажмите «Начать». Without a name: Впереди восемь рабочих ситуаций. Правильных ответов нет. Выбирайте то, что ближе вам. Нажмите «Начать».
- 1: Заказов стало меньше. С чего вы начнёте разбираться?
- 2: Принято. Отчёт снова собирают вручную. За какую часть вы бы взялись?
- 3: Нужно разбирать входящие обращения. Какая часть задачи вам ближе?
- 4: «Сделайте сервис лучше». Техническое задание на три слова. С чего начнёте?
- 5: Инструмент иногда ошибается. Что вам важнее проверить?
- 6: Половина позади. Представьте: пара часов без встреч. Да, такое тоже бывает. Какой задачей займётесь?
- 7: До разбора проекта один день. Что стоит показать команде?
- 8: И последний выбор. Какой результат порадует вас больше?
- request, name (only if skipped): Как вас зовут? Так команде будет проще к вам обратиться.
- request, contact: Как с вами связаться? Телефон, почта или Telegram. Введите на экране, вслух не нужно.
- request, topic: О чём вы хотите поговорить с командой?
- request, send: Проверьте заявку и отправьте её.
- success: Спасибо, {имя}! Заявка у команды NavTech. Хорошего форума! Without a name: Готово, заявка сохранена. Спасибо, что заглянули!

Result: «{имя}, в»/«В»ашим ответам ближе роль «…»., the approved role summary from the local role catalogue, then «Хотите оставить заявку? Команда NavTech свяжется с вами.»; a separate fixed line for ties. No generated assessment.

### Touch lines

**welcome**

- Привет! Я Нави. Моя часть — говорить. Ваша — выбирать на экране. Начнём?
- Восемь ситуаций, никаких собеседований. Даже вопроса «кем вы видите себя через пять лет» не будет.
- Я уже на рабочем месте. Правда, рабочее место — это весь экран. Нажмите «Начать» — покажу, что здесь можно сделать.

**name**

- Достаточно имени. Фамилию оставим для визиток.
- С именем мне будет проще к вам обращаться. Можно и без него — кнопка чуть ниже.
- Напишите имя на экране. Я буду помнить его до конца игры.

**hello**

- Нажмите «Начать» — восемь ситуаций, около двух минут.
- Никаких собеседований. Даже вопроса «кем вы видите себя через пять лет» не будет.
- Я уже на рабочем месте. Правда, рабочее место — это весь экран. Нажмите «Начать».

**quiz**

- Выбирайте то, за что вам было бы интереснее взяться. Здесь можно обойтись без правильного ответа.
- Не торопитесь. У меня следующая встреча — тоже здесь. Выберите подход на экране.
- Если близки два варианта, выберите тот, с которого начали бы в реальной задаче.

**result**

- Откройте карточки ролей: внутри — конкретные задачи и польза для команды. Что вам ближе?
- Это повод сравнить рабочие задачи. За вас карьеру я не выбираю — у меня даже резюме нет.
- Можно вернуться к ответам и посмотреть, как изменятся направления. Любопытство здесь только приветствуется.

**contact**

- Заявка необязательна. Если передумаете, можно просто вернуться к результату.
- Здесь я помолчу: контакты лучше вводить, а не произносить вслух.
- Команда NavTech свяжется с вами, чтобы обсудить HR Agent и Prism.

**success**

- Спасибо, что заглянули! Передаю экран следующему любопытному гостю.
- Готово! А я пока потренирую приветственный взмах.
- До встречи! Было приятно познакомиться через ваши выборы.

## English

### Screen lines

- Welcome: Hi, I’m Navi. There are no right answers here — just choose how you would approach the task. Let’s see what comes up.
- Name (after the language tap): Hi there! I’m Navi. What’s your name?
- Hello: Nice to meet you, {name}! Eight work situations are next. Pick whatever feels closest to you. Tap Start when you’re ready. Without a name: Eight work situations are next. There are no right answers. Pick whatever feels closest to you. Tap Start when you’re ready.
- 1: Orders are down. Where would you start looking?
- 2: Got it. Another report put together by hand. Which part would you take on?
- 3: Incoming requests need sorting. Which part of that work interests you?
- 4: “Make the service better.” Quite a brief. Where would you start?
- 5: The tool gets things wrong sometimes. What would you want to check?
- 6: We’re past halfway. Imagine a couple of hours with no meetings. Yes, it does happen. Which task would you pick?
- 7: One day until the project review. What would you show the team?
- 8: One last choice. Which result would feel most satisfying?
- request, name (only if skipped): What’s your name? It helps the team address you.
- request, contact: How can the team reach you? Phone, email or Telegram. Type it on screen, no need to say it.
- request, topic: What would you like to talk to the team about?
- request, send: Check your request and send it.
- success: Thank you, {name}! The NavTech team has your request. Enjoy the forum! Without a name: Your request is saved. Thanks for stopping by!
- Result: «{name}, your»/«Your» choices lean toward the … role., the role summary, then «Would you like to leave a request? The NavTech team will get in touch.»

Result: «{имя}, в»/«В»ашим ответам ближе роль «…»., the approved role summary from the local role catalogue, then «Хотите оставить заявку? Команда NavTech свяжется с вами.»; a separate fixed line for ties. No generated assessment.

### Touch lines

**welcome**

- Hi, I’m Navi. I do the talking. You make the choices on screen. Shall we start?
- Eight situations, no interview. I won’t even ask where you see yourself in five years.
- I’m already at my desk. My desk just happens to be this entire screen. Tap Start and I’ll show you around.

**name**

- A first name is plenty. Surnames are for business cards.
- Your name lets me talk to you properly. You can also skip it — the option is just below.
- Type your name on screen. I’ll remember it until the end of the game.

**hello**

- Tap Start. Eight situations, about two minutes.
- No interview. I won’t even ask where you see yourself in five years.
- I’m already at my desk. My desk just happens to be this entire screen. Tap Start.

**quiz**

- Pick the part you’d find most interesting to work on. There’s no right answer to guess.
- Take your time. My next meeting is also right here. Choose an approach on screen.
- If two options fit, pick the one you would start with on a real task.

**result**

- Open the role cards to see the actual tasks and their value to a team. Which feels more interesting?
- These are work directions to explore. I’m not choosing your career for you. I don’t even have a CV.
- You can revisit your answers and see how the directions change. Curiosity is very welcome here.

**contact**

- The request is optional. If you change your mind, you can simply return to your result.
- I’ll keep quiet here. Contact details belong on the screen, not out loud.
- The NavTech team will get in touch to discuss HR Agent and Prism.

**success**

- Thanks for stopping by! The screen is ready for the next curious visitor.
- All done! I’ll practice my welcoming wave while I wait.
- See you around! It was nice getting to know your choices.

