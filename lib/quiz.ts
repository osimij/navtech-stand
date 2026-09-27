export const QUIZ_VERSION = "career-explorer-v2";
export const CONSENT_VERSION = "navtech-followup-v1";
export type QuizLanguage = 'ru' | 'en';
// Curated preference mapping, not a validated assessment or a skills measurement.
export const profiles = [
  {
    "id": "data_analyst",
    "name": "Data Analyst",
    "title": "Аналитик данных",
    "summary": "Объяснять, что произошло и почему.",
    "work": "Очищаете таблицы, сравниваете периоды и сегменты, проверяете причины изменений. Результат — понятный вывод для команды, а не просто график.",
    "format": "Исследование за ноутбуком, вопросы коллегам и короткие разборы результатов.",
    "skills": [
      "SQL и таблицы",
      "Проверка качества данных",
      "Базовая статистика и визуализация"
    ],
    "project": "Возьмите открытые данные о заказах. Найдите причину изменения выручки: цена, количество или состав заказов. Сделайте один график и записку из трёх выводов.",
    "en": {
      "title": "Data Analyst",
      "summary": "Explain what happened and why.",
      "work": "Clean tables, compare periods and segments, and investigate changes. Deliver a finding the team can act on, not just a chart.",
      "format": "Focused analysis, questions for colleagues, and short readouts.",
      "skills": [
        "SQL and spreadsheets",
        "Data quality checks",
        "Basic statistics and visualization"
      ],
      "project": "Use an open orders dataset. Explain a revenue change through price, volume or order mix. Deliver one chart and a three-point memo."
    }
  },
  {
    "id": "data_scientist",
    "name": "Data Scientist",
    "title": "Специалист по анализу и моделированию данных",
    "summary": "Проверять, можно ли предсказать результат.",
    "work": "Готовите данные, строите простую исходную модель, сравниваете её с более сложной и проверяете ошибки на новых данных.",
    "format": "Эксперименты, программирование и обсуждение того, где прогноз полезен, а где ему нельзя доверять.",
    "skills": [
      "Python и обработка данных",
      "Вероятности и статистика",
      "Проверка моделей без утечки данных"
    ],
    "project": "На открытых данных о продажах сравните прогноз «как на прошлой неделе» с простой моделью. Отложите последний месяц для проверки и покажите ошибки обоих вариантов.",
    "en": {
      "title": "Data Scientist",
      "summary": "Test whether an outcome can be predicted.",
      "work": "Prepare data, build a simple baseline, compare it with a more complex model, and test errors on unseen data.",
      "format": "Experiments, coding, and discussion of when a prediction is useful or unreliable.",
      "skills": [
        "Python and data preparation",
        "Probability and statistics",
        "Model validation without data leakage"
      ],
      "project": "Compare a last-week baseline with a simple sales forecasting model. Hold out the final month and report both models’ errors."
    }
  },
  {
    "id": "ml_engineer",
    "name": "ML Engineer",
    "title": "Инженер машинного обучения",
    "summary": "Превращать модель в надёжный сервис.",
    "work": "Подключаете готовую модель к приложению, проверяете скорость и ошибки, отслеживаете качество после запуска и предусматриваете откат.",
    "format": "Код, тестовые запуски и совместная работа с разработчиками и авторами моделей.",
    "skills": [
      "Python и основы ML",
      "API, контейнеры и тесты",
      "Мониторинг качества и задержек"
    ],
    "project": "Возьмите готовую модель классификации текста. Сделайте API, добавьте проверку входных данных и замерьте время ответа на 100 запросах. Опишите, что делать при сбое.",
    "en": {
      "title": "ML Engineer",
      "summary": "Turn a model into a reliable service.",
      "work": "Connect a trained model to an app, test speed and failures, monitor quality after release, and provide a rollback.",
      "format": "Code, test runs, and collaboration with software and data science teams.",
      "skills": [
        "Python and ML foundations",
        "APIs, containers and tests",
        "Quality and latency monitoring"
      ],
      "project": "Wrap a pretrained text classifier in an API. Validate inputs, measure response time over 100 requests, and document failure handling."
    }
  },
  {
    "id": "automation_engineer",
    "name": "Automation Engineer",
    "title": "Инженер автоматизации",
    "summary": "Убирать повторяющуюся ручную работу.",
    "work": "Соединяете формы, таблицы и сервисы: данные проходят нужные шаги, ошибки видны, повторный запуск не создаёт дубликаты.",
    "format": "Разбор процесса с людьми, сборка интеграций и проверка нестандартных случаев.",
    "skills": [
      "Логика процессов и API",
      "Python или инструменты автоматизации",
      "Обработка ошибок и повторных событий"
    ],
    "project": "Соедините тестовую форму заявки с таблицей и уведомлением. Проверьте пустое поле, повторную отправку и недоступный сервис. Добавьте журнал ошибок.",
    "en": {
      "title": "Automation Engineer",
      "summary": "Remove repetitive manual work.",
      "work": "Connect forms, tables and services so data follows a workflow, failures are visible, and retries do not create duplicates.",
      "format": "Workflow discovery with people, integration work, and edge-case testing.",
      "skills": [
        "Workflow logic and APIs",
        "Python or automation tools",
        "Error handling and duplicate events"
      ],
      "project": "Connect a test request form to a table and notification. Test an empty field, duplicate submission and unavailable service. Add an error log."
    }
  },
  {
    "id": "bi_developer",
    "name": "BI Analyst / Developer",
    "title": "Аналитик и разработчик BI",
    "summary": "Собирать общую картину из разных источников.",
    "work": "Договариваетесь о смысле показателей, связываете источники и строите обновляемый дашборд, где можно проверить вывод по данным.",
    "format": "Работа с таблицами и моделями данных, настройка обновлений и обсуждение показателей с бизнесом.",
    "skills": [
      "SQL и модели данных",
      "BI-инструмент и понятные графики",
      "Определения KPI и контроль обновлений"
    ],
    "project": "Объедините учебные таблицы заказов и возвратов. Сделайте дашборд с выручкой, возвратами и фильтром по месяцу. Для каждого показателя укажите формулу и источник.",
    "en": {
      "title": "BI Analyst / Developer",
      "summary": "Build a shared picture from several data sources.",
      "work": "Define metrics, connect data sources, and build a refreshing dashboard whose conclusions can be checked.",
      "format": "Data modeling, refresh pipelines, and metric discussions with business teams.",
      "skills": [
        "SQL and data modeling",
        "A BI tool and clear charts",
        "KPI definitions and refresh checks"
      ],
      "project": "Join sample orders and returns. Build a dashboard with revenue, returns and a month filter. Document each metric’s formula and source."
    }
  },
  {
    "id": "product_analyst",
    "name": "Product Analyst",
    "title": "Продуктовый аналитик",
    "summary": "Проверять, какие изменения помогают людям.",
    "work": "Исследуете путь пользователя, находите места потерь, предлагаете гипотезу и оцениваете результат изменения по понятной метрике.",
    "format": "Анализ событий продукта и разговоры с дизайнером, разработчиками и менеджером.",
    "skills": [
      "SQL и событийные данные",
      "Воронки, когорты и метрики",
      "Дизайн экспериментов и интерпретация"
    ],
    "project": "На учебных событиях интернет-магазина постройте путь от товара до оплаты. Найдите один провал, предложите изменение и запишите, по какой метрике проверите его эффект.",
    "en": {
      "title": "Product Analyst",
      "summary": "Test which product changes help people.",
      "work": "Investigate user journeys, find drop-offs, form a hypothesis, and evaluate a change against a clear metric.",
      "format": "Product event analysis and collaboration with design, engineering and product teams.",
      "skills": [
        "SQL and event data",
        "Funnels, cohorts and metrics",
        "Experiment design and interpretation"
      ],
      "project": "Build a product-to-payment funnel from sample shop events. Find one drop-off, propose a change, and define the metric to evaluate its effect."
    }
  },
  {
    "id": "software_engineer",
    "name": "Software Engineer",
    "title": "Разработчик программного обеспечения",
    "summary": "Строить функции, на которые можно положиться.",
    "work": "Превращаете задачу пользователя в работающую функцию, проектируете данные, пишете код и тесты, исправляете ошибки и поддерживаете продукт.",
    "format": "Разработка по небольшим задачам, проверка кода с коллегами и разбор проблем после запуска.",
    "skills": [
      "Один язык программирования",
      "Структуры данных, HTTP и базы данных",
      "Git, тестирование и отладка"
    ],
    "project": "Сделайте небольшой сервис бронирования времени. Не допускайте двойную запись, проверяйте ввод и добавьте тесты на отмену и повторный запрос.",
    "en": {
      "title": "Software Engineer",
      "summary": "Build features people can rely on.",
      "work": "Turn a user need into a working feature, design data structures, write code and tests, fix bugs and maintain the product.",
      "format": "Small implementation tasks, code reviews, and investigation of production problems.",
      "skills": [
        "One programming language",
        "Data structures, HTTP and databases",
        "Git, testing and debugging"
      ],
      "project": "Build a small time-slot booking service. Prevent double booking, validate input, and test cancellations and repeated requests."
    }
  },
  {
    "id": "product_designer",
    "name": "UX / Product Designer",
    "title": "Дизайнер цифровых продуктов",
    "summary": "Делать сложные действия понятными.",
    "work": "Наблюдаете, как люди выполняют задачу, находите затруднения, собираете прототип и проверяете, стал ли путь понятнее.",
    "format": "Разговоры с пользователями, схемы и прототипы, тесты и работа рядом с разработчиками.",
    "skills": [
      "Исследования и проверка гипотез",
      "Прототипы и визуальная иерархия",
      "Доступность и тестирование удобства"
    ],
    "project": "Переделайте форму записи на событие в кликабельном прототипе. Дайте трём людям пройти её без подсказок. Зафиксируйте затруднения и исправьте два главных.",
    "en": {
      "title": "UX / Product Designer",
      "summary": "Make complex actions understandable.",
      "work": "Observe people doing a task, identify friction, prototype an interaction, and check whether it becomes easier to use.",
      "format": "User conversations, flows and prototypes, usability tests and engineering collaboration.",
      "skills": [
        "User research and hypothesis testing",
        "Prototyping and visual hierarchy",
        "Accessibility and usability testing"
      ],
      "project": "Redesign an event registration form as a clickable prototype. Ask three people to complete it unaided. Record friction and fix the two biggest issues."
    }
  }
] as const;
export const questions = [
  {
    "id": "shop",
    "title": "В магазине стало меньше заказов. Что вам интереснее выяснить?",
    "en": "An online shop is getting fewer orders. What would you investigate?",
    "options": [
      {
        "text": "На каком шаге покупатели уходят и какое изменение проверить",
        "en": "Where shoppers leave and which change to test",
        "scores": [
          1,
          0,
          0,
          0,
          0,
          3,
          0,
          0
        ]
      },
      {
        "text": "Не изменились ли цены, товары или сами данные о продажах",
        "en": "Whether prices, product mix or sales data have changed",
        "scores": [
          3,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      },
      {
        "text": "Что мешает людям оформить заказ — понаблюдать за ними",
        "en": "What stops people placing an order by watching them try",
        "scores": [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          3
        ]
      },
      {
        "text": "Не ломается ли оплата и как исправить эту ошибку",
        "en": "Whether checkout is broken and how to fix it",
        "scores": [
          0,
          0,
          0,
          0,
          0,
          0,
          3,
          1
        ]
      }
    ]
  },
  {
    "id": "report",
    "title": "Команда каждую неделю вручную собирает отчёт. За что возьмётесь?",
    "en": "The team builds a report by hand every week. What would you take on?",
    "options": [
      {
        "text": "Собрать обновляемый экран с показателями из разных таблиц",
        "en": "Build a refreshing dashboard from several tables",
        "scores": [
          1,
          0,
          0,
          0,
          3,
          0,
          0,
          0
        ]
      },
      {
        "text": "Настроить сбор и отправку отчёта, включая сбои и повторы",
        "en": "Automate collection and delivery, including failures and retries",
        "scores": [
          0,
          0,
          0,
          3,
          0,
          0,
          1,
          0
        ]
      },
      {
        "text": "Проверить цифры и объяснить, почему они изменились",
        "en": "Check the numbers and explain why they changed",
        "scores": [
          3,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "text": "Попробовать предсказать спрос на следующую неделю",
        "en": "Try to predict demand for next week",
        "scores": [
          0,
          3,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    "id": "delivery",
    "title": "Нужен сервис, который сортирует входящие обращения. Какую часть выберете?",
    "en": "A service needs to sort incoming requests. Which part would you choose?",
    "options": [
      {
        "text": "Сравнить способы распознавания тем и проверить ошибки",
        "en": "Compare ways to identify topics and check their errors",
        "scores": [
          1,
          3,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "text": "Запустить готовую модель так, чтобы она отвечала быстро и стабильно",
        "en": "Make a trained model respond quickly and reliably",
        "scores": [
          0,
          0,
          3,
          0,
          0,
          0,
          1,
          0
        ]
      },
      {
        "text": "Сделать приложение, где обращения удобно хранить и обрабатывать",
        "en": "Build the app that stores and processes requests",
        "scores": [
          0,
          0,
          1,
          0,
          0,
          0,
          3,
          0
        ]
      },
      {
        "text": "Связать почту, таблицу и уведомления без ручного переноса",
        "en": "Connect email, a table and notifications without manual copying",
        "scores": [
          0,
          0,
          0,
          3,
          1,
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    "id": "unclear",
    "title": "Вам говорят: «Сделайте сервис лучше». С чего интереснее начать?",
    "en": "Someone says, “Make this service better.” Where would you start?",
    "options": [
      {
        "text": "Посмотреть, как человек выполняет задачу и где путается",
        "en": "Watch someone complete a task and see where they get stuck",
        "scores": [
          0,
          0,
          0,
          0,
          0,
          1,
          0,
          3
        ]
      },
      {
        "text": "Выбрать изменение и метрику, чтобы проверить пользу",
        "en": "Choose a change and a metric to test its value",
        "scores": [
          0,
          1,
          0,
          0,
          0,
          3,
          0,
          0
        ]
      },
      {
        "text": "Договориться о показателях и привести источники к общим определениям",
        "en": "Agree on metrics and consistent definitions across sources",
        "scores": [
          0,
          0,
          0,
          1,
          3,
          0,
          0,
          0
        ]
      },
      {
        "text": "Разобрать данные по периодам, найти закономерности и слабые места",
        "en": "Compare periods to find patterns and weak spots",
        "scores": [
          3,
          0,
          0,
          0,
          1,
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    "id": "failure",
    "title": "Новый инструмент иногда ошибается. Какую проверку вы бы выбрали?",
    "en": "A new tool sometimes gets things wrong. What would you test?",
    "options": [
      {
        "text": "На каких примерах прогноз неверен и лучше ли он простого правила",
        "en": "Where predictions fail and whether they beat a simple rule",
        "scores": [
          0,
          3,
          1,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "text": "Как меняются скорость и качество модели под нагрузкой",
        "en": "How a model’s speed and quality change under load",
        "scores": [
          0,
          0,
          3,
          1,
          0,
          0,
          0,
          0
        ]
      },
      {
        "text": "Понимают ли люди, что делать после сообщения об ошибке",
        "en": "Whether people know what to do after an error message",
        "scores": [
          0,
          0,
          0,
          0,
          0,
          0,
          1,
          3
        ]
      },
      {
        "text": "Стало ли людям проще выполнить задачу после изменения",
        "en": "Whether a change made the task easier for people",
        "scores": [
          0,
          0,
          0,
          0,
          0,
          3,
          0,
          1
        ]
      }
    ]
  },
  {
    "id": "focus",
    "title": "На что вам приятнее потратить пару часов сосредоточенной работы?",
    "en": "Which task would you enjoy focusing on for a couple of hours?",
    "options": [
      {
        "text": "Связать таблицы так, чтобы один показатель считался одинаково везде",
        "en": "Connect tables so a metric means the same thing everywhere",
        "scores": [
          0,
          0,
          0,
          0,
          3,
          1,
          0,
          0
        ]
      },
      {
        "text": "Менять модель и разбираться, почему её прогноз стал точнее",
        "en": "Adjust a model and understand why its predictions improved",
        "scores": [
          1,
          3,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "text": "Собрать процесс, который сам обрабатывает заявки и сообщает о сбоях",
        "en": "Build a workflow that handles requests and reports failures",
        "scores": [
          0,
          0,
          1,
          3,
          0,
          0,
          0,
          0
        ]
      },
      {
        "text": "Написать функцию и проверить сложные случаи автоматическими тестами",
        "en": "Write a feature and test its edge cases automatically",
        "scores": [
          0,
          0,
          0,
          1,
          0,
          0,
          3,
          0
        ]
      }
    ]
  },
  {
    "id": "deliverable",
    "title": "До показа проекта один день. Какой результат вы хотите подготовить?",
    "en": "There is one day before a project review. What would you prepare?",
    "options": [
      {
        "text": "Разбор пути пользователя и план проверки одного улучшения",
        "en": "A user-journey analysis and a plan to test one improvement",
        "scores": [
          0,
          0,
          0,
          0,
          0,
          3,
          0,
          1
        ]
      },
      {
        "text": "Кликабельный прототип, который уже попробовали несколько людей",
        "en": "A clickable prototype that a few people have already tried",
        "scores": [
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          3
        ]
      },
      {
        "text": "График и короткое объяснение неожиданного изменения в данных",
        "en": "A chart and a short explanation of an unexpected data change",
        "scores": [
          3,
          1,
          0,
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "text": "Работающий сервис с моделью, замерами задержки и планом отката",
        "en": "A working model service with latency measurements and rollback",
        "scores": [
          0,
          0,
          3,
          0,
          0,
          0,
          1,
          0
        ]
      }
    ]
  },
  {
    "id": "done",
    "title": "Какой момент в конце проекта даст вам больше удовлетворения?",
    "en": "Which outcome would feel most satisfying at the end of a project?",
    "options": [
      {
        "text": "Команда открывает один дашборд и может проверить каждую цифру",
        "en": "The team opens one dashboard and can verify every number",
        "scores": [
          0,
          1,
          0,
          0,
          3,
          0,
          0,
          0
        ]
      },
      {
        "text": "Рутинные шаги выполняются сами, а ошибки не теряются",
        "en": "Routine steps run automatically and failures never disappear",
        "scores": [
          0,
          0,
          0,
          3,
          0,
          0,
          0,
          1
        ]
      },
      {
        "text": "Функция работает правильно даже при неожиданных действиях",
        "en": "A feature works correctly even when people do unexpected things",
        "scores": [
          0,
          0,
          0,
          1,
          0,
          0,
          3,
          0
        ]
      },
      {
        "text": "Модель работает в приложении, а её качество можно отследить",
        "en": "A model runs in the app and its quality can be monitored",
        "scores": [
          0,
          0,
          3,
          0,
          0,
          1,
          0,
          0
        ]
      }
    ]
  }
];
export function scoreAnswers(answers: number[]) {
 if (answers.length !== questions.length || answers.some((value, index) => !Number.isInteger(value) || value < 0 || value >= questions[index].options.length)) throw new Error('Ответьте на все восемь вопросов.');
 const scores = profiles.map(() => 0), primary = profiles.map(() => 0);
 answers.forEach((answer, q) => questions[q].options[answer].scores.forEach((points, i) => { scores[i] += points; if (points === 3) primary[i]++; }));
 const ranked = scores.map((score, index) => ({score, index, primary: primary[index]})).sort((a,b) => b.score-a.score || b.primary-a.primary || a.index-b.index);
 return { profile: profiles[ranked[0].index].id, index: ranked[0].index, scores, ranked, top: ranked.slice(0,3), tied: ranked[0].score === ranked[1].score };
}
export function roleEvidence(answers: number[], index: number, language: QuizLanguage) {
 return answers.map((a,q) => ({points: questions[q].options[a].scores[index], text: language === 'en' ? questions[q].options[a].en : questions[q].options[a].text})).filter(x=>x.points>0).sort((a,b)=>b.points-a.points).slice(0,2).map(x=>x.text);
}
export const legacyProfileNames: Record<string,string> = {data:'Data Science (v1)',ai:'AI & автоматизация (v1)',product:'Продукт и стратегия (v1)',systems:'Архитектура систем (v1)'};
export const intents=[{id:"business",label:"Для бизнеса",detail:"Показать продукты моей команде"},{id:"career",label:"Для карьеры",detail:"Познакомиться с NavTech как кандидату"},{id:"explore",label:"Из любопытства",detail:"Просто узнать направления"},{id:"unspecified",label:"Не уточняли",detail:"Тест без предварительного выбора цели"}] as const;
export const interestLabels:Record<string,string>={hr:"HR Agent",prism:"Prism",both:"Оба продукта",career:"Карьера в NavTech"};
export type Stats = {
 started:number; completed:number; leads:number; profiles:{profile:string;count:number}[];
 intents:{intent:string;count:number}[]; interests:{interest:string;count:number}[]; hours:{hour:string;count:number}[];
 patterns:{question:string;counts:number[]}[]; legacy:{started:number;completed:number}; excluded:number; version:string; updatedAt:string;
};
