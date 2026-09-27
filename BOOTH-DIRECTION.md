> Current direction — 22 September 2026: the main local journey is `/` → eight situational career questions → three practical role matches; `/screen` is current-version anonymous Prism analytics. See [CAREER-EXPLORER.md](CAREER-EXPLORER.md). Earlier five-question and recruitment-demo proposals below are historical alternatives. Paid voice experiments are stopped.

# What the NavTech booth should prove

The quiz is a good invitation to participate. It is weak evidence of an HR product: five preference choices mostly demonstrate a scoring rule. Keep it as the playful entrance, with Navi as the companion and Prism showing the collective pattern. Give HR Agent its own short, concrete proof moment.

## References and what to borrow

- **Duolingo, Video Call with Lily:** a recognizable personality, a short opening and a conversation that reacts to the person's topic. Their team specifically describes fixing the tendency to drag people back to an assigned topic. Navi now allows riddles, shared stories and word association, and preserves those exchanges across screen changes. Borrow the conversational discipline, not Lily's personality. [Duolingo's explanation](https://blog.duolingo.com/ai-and-video-call/)
- **Paradox, Olivia:** conversational recruiting is legible because the interaction has a concrete purpose: application, screening questions or scheduling. This is a better HR reference than a personality quiz. It is not evidence that NavTech already integrates these workflows. [Candidate experience](https://www.paradox.ai/solutions/candidates)
- **Tableau Pulse:** its presentation connects an understandable insight to guided exploration and the underlying metric. Prism should lead with a question, let a touch change the selected evidence, and make the denominator easy to inspect. [Tableau Pulse](https://www.tableau.com/products/tableau-pulse)

## Proposed HR proof: a conversation becomes a useful recruiter note

This is a proposal for the next product demonstration, not an implemented production HR integration.

In about one minute, show three things: the agent asks a relevant follow-up, remembers what was said, and produces an editable summary grounded in those answers. Let the visitor see exactly what a recruiter learned. Do not turn that summary into a suitability score or an automated hiring decision.

A fictional sample can make the idea reviewable immediately:

| Conversation | What the recruiter learns | Evidence |
| --- | --- | --- |
| “Расскажите о задаче, которую вы недавно решили.” — “Я собрал еженедельный отчёт о продажах в Excel.” | Experience described: preparing a weekly sales report in Excel. | The stated task and tool; no claim of proficiency. |
| “Что в этой работе вы хотите улучшить?” — “Каждую неделю вручную объединяю три файла.” | A concrete example to discuss: combining three files manually. | The visitor's example. |
| “Что хотите попробовать дальше?” — “Научиться строить интерактивные отчёты.” | Expressed interest: interactive reporting. | The visitor's stated preference. |

The final screen should say **«Что мы узнали из разговора»**. Each point opens its source answer. One separate line, **«Что ещё уточнить»**, might ask about the report's users and whether the visitor checked its accuracy. These are follow-up questions, not inferred weaknesses. The person can correct the summary before choosing to share anything.

The demonstration should clearly identify itself as a sample. Show a real vacancy only if the NavTech team supplies one. Show an actual ATS integration only after it exists. The present booth voice does not create, save or forward recruiter summaries.

NavTech's public site describes HR-Agent as assisting with applications, criteria-based candidate selection, onboarding and common employee questions. A conversation-to-summary sample is a proposed way to make part of that value tangible, not proof of a currently implemented interview workflow. The synced `sources/` directory contained no usable files during this review. [NavTech product description](https://navtech.tj/)

## Prism: preserve the idea, improve the proof

The aggregate booth insight is worth keeping. In the current local revision:

- Each view starts from a readable question about interests or progression.
- Selecting a chart segment or row updates the count, share and explanation together.
- “Как получен вывод” reveals numerator, denominator and the cohort being counted.
- Sample data is labelled inside every chart. It never merges into live booth records.
- The copy describes sessions and game results, not unique people or measured skills. Product interest does not imply purchase intent or demand across the entire forum.

A small dataset should look like a small dataset. Do not invent trends, causes, significance, links between profile and product preference, or forecasts that the current aggregate endpoint cannot support.

## Voice decision

The local app now uses GPT-Realtime-2.1 with Marin, low reasoning effort and its actual Realtime protocol. Account access and session configuration were verified. Active speech and interfaces support Russian and English only, with Russian as the default. Historical third-language experiments are retained as evidence, not active product support. Human listening in both supported languages remains necessary to judge naturalness. [OpenAI model documentation](https://developers.openai.com/api/docs/models/gpt-realtime-2.1)

The active experience remains local at http://localhost:5173/ and http://localhost:5173/screen. No site has been published by this revision.
