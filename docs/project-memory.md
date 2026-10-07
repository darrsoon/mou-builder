# MOU Builder — память проекта

Файл-память: правила, договорённости и планы. Обновляется по ходу работы.
Последнее обновление: 22.08.2026.

## 1. Что это и где лежит

- Приложение: Next.js на Vercel (проект `mou-builder`, команда Tsokurenok's projects).
  Код: github.com/AlinaTsokur/mou-builder, ветка `main` — пушим напрямую в main.
- Генерация: копия Google Doc шаблона → движок v2 обрабатывает условные маркеры →
  подстановка значений → готовый MOU в папку «Готовые MOU».
- Данные: Google Таблица «MOU Builder» (вкладки PROJECTS, LISTS, AGENTS, DRAFTS_LOG;
  план — добавить TEMPLATES). Базы данных нет и пока не нужна.
- Шаблоны: папка «MOU (Prime Bridge)» на Google Диске `d.kim@primebridge.estate`
  ([«MOU (Prime Bridge)»](https://drive.google.com/drive/folders/1aj_s4joYlP-8QnEn8fLRTSHdFtjDs2MG), `1aj_s4joYlP-8QnEn8fLRTSHdFtjDs2MG`).
  С 03.10.2026 — рабочие копии после переезда; правки шаблонов делаем только в них. Коннектор Claude подключён к аккаунту
  `kkorobkova84@gmail.com` — папка расшарена на него как редактору.
- Переезд на рабочий аккаунт позже = копирование файлов + замена 3-4 ID (spreadsheetId,
  outputFolderId, ID шаблонов). Ничего в коде к аккаунту не привязано.

## 2. Как устроены шаблоны (движок v2)

- Условия живут в самом Google Doc:
  - `{{#if flag}} … {{/if}}` — инлайн, блоки, вложенность, отрицание `{{#if !flag}}`
  - `{{#row flag}}` — для строк таблиц
  - `{{placeholder}}` — подстановка значений
- Код больше не ищет фразы договора. Текст можно править в документе без участия
  программиста; нельзя менять только имена флагов и плейсхолдеров.
- Жирный/курсив — родное форматирование Google Doc. Маркеры `<< >>` остаются только
  для значений, собираемых кодом (блоки сторон).
- Неизвестный флаг не ломает документ: текст сохраняется, имя флага попадает в отчёт.
- Эталонная разметка off-plan: `templates/offplan-v2-template.md`.
- ВАЖНО: шаблоны должны быть Google Docs, а не .docx — при чтении .docx теряется
  жирный шрифт (проверено 22.08.2026).

## 3. Согласованные правила

### Депозиты
- Шаблон Off-plan (с депозитом) предполагает минимум один депозит. Оба без депозита =
  отдельный шаблон «1.2 NO DEPOSIT CHEQUES».
- Определение Liquidated Damages удаляется, когда ОБА депозита включены.
  ⚠️ В текущих шаблонах это правило не отражено — см. отчёт аудита.
- Ст. Buyer/Seller Default: предложение «shall pay AED X as liquidated damages, being an
  amount equal to the Security Deposit» присутствует всегда. X = свой депозит, если есть,
  иначе депозит другой стороны. Лид-фраза: есть депозит → «The forfeited Security Deposit
  shall be distributed», нет → «This amount shall be distributed».
- Распределение 80% стороне / 20% агенту другой стороны; нет агента → 100% стороне.
- Вариант без реквизитов чека = чека ещё нет (Delayed). Зеркально для Seller.
- Держатель чека (`{{buyer_deposit_holder}}` / `{{seller_deposit_holder}}`): оба агента →
  чек Buyer без реквизитов у Seller's Agency, с реквизитами у Buyer's Agency; чек Seller
  у Seller's Agency. Один агент → оба чека у него. Агентов нет → чек держит противоположная
  сторона, ст. Deposit Release «the Agent» → «the Parties».
- Чек от третьего лица = галочка в форме → фраза про undertaking letter.
- Возврат чеков: `{{deposit_return_parties}}` = «the Buyer and to the Seller» / «the Buyer» /
  «the Seller».

### Агентства
- Агентства — стороны договора: юрблок в шапке (компания, представитель, должность,
  лицензия, адрес) из вкладки AGENTS.
- Комиссию можно отключить при живом агенте (флаги `seller_agent_fee` / `buyer_agent_fee`).
  Обе выключены → строка Agency Fee удаляется целиком.
- В тексте используются роли («The Buyer's Agent»), не названия компаний.
- `{{agencies_word}}`: два агента → «Agencies», один → «the Agency».

### NOC / Transfer fee
- Условие NOC берётся из колонки Transfer Fee Label вкладки PROJECTS (= «NOC Fee»),
  не по имени застройщика. Лейбл в таблице и фраза про NOC в определениях — из одного
  источника.

### Прочее
- Ст. Effective Date: аннулирование MOU за 2 рабочих дня — фиксированный текст.
- LPC-пункт (Late Payment Charges) не добавляем. ⚠️ В шаблоне 1.2 он присутствует — решить.
- Ручное отключение статей в форме оставляем → нумерация `{{article_*_number}}` динамическая.
- Threshold top-up = 0 → строка удаляется (`{{#row has_top_up}}`).
- Способ оплаты Amount to Seller → `{{amount_to_seller_payment_text}}`.
- Блоки подписей: `{{seller_signature_block}}` / `{{buyer_signature_block}}` — строка
  Name/Signature/Date на каждого участника. Подписи агентств и финальная таблица — по флагам.

## 4. Шаблоны (папка «MOU»)

| # | Файл (ссылка) | Группа | Статей | Google Doc ID |
|---|------|--------|--------|-----|
| 1 | [Off-plan](https://docs.google.com/document/d/1qedPsMWpFLRFqjxPwuK53fXY_43AkkSC5bGc_rAXG0k/edit) | Off-plan | 17 | `1qedPsMWpFLRFqjxPwuK53fXY_43AkkSC5bGc_rAXG0k` |
| 1.2 | [Off-plan NO DEPOSIT CHEQUES](https://docs.google.com/document/d/1BsYaITx4_FvELewiKx4yquzPwkAjDYpb1SoV4bToYIo/edit) | Off-plan | 15 | `1BsYaITx4_FvELewiKx4yquzPwkAjDYpb1SoV4bToYIo` |
| 2 | [Off-plan–mortgage](https://docs.google.com/document/d/1tx7RSibxrjdPz3DWjCxzA7Fy_L8CHgIK4JbsJa8Fo9o/edit) — **v2, по чистовику** (06.10) | Off-plan | 18 | `1tx7RSibxrjdPz3DWjCxzA7Fy_L8CHgIK4JbsJa8Fo9o` |
| 3 | [Cash to cash READY](https://docs.google.com/document/d/1OvFwfDrZ57blOIblZCSuNa53B6xUgdfQvxsQQ-qGEbQ/edit) — **v2, по чистовику** (06.10) | Ready | 18 | `1OvFwfDrZ57blOIblZCSuNa53B6xUgdfQvxsQQ-qGEbQ` |
| 4 | [Cash to Mortgage READY](https://docs.google.com/document/d/1OG7MFlEDx3a8RyqJbjtqBjfvhj2aMUQIplJcyaPm2Zs/edit) — **v2, по чистовику** (06.10) | Ready | 19 | `1OG7MFlEDx3a8RyqJbjtqBjfvhj2aMUQIplJcyaPm2Zs` |
| 5 | [Mortgage to cash READY](https://docs.google.com/document/d/1UTrKSLj69RrNQAgoavPCTUdU1CJ37sfK9IB9KcC6AyU/edit) — **v2, по чистовику** (06.10) | Ready | 18 | `1UTrKSLj69RrNQAgoavPCTUdU1CJ37sfK9IB9KcC6AyU` |
| 6 | [Mortgage to mortgage READY](https://docs.google.com/document/d/1vty7EFqiiYQs2sgh8gHvxDDPexn8T63ZO4GQ3K1u8C0/edit) — **v2, по чистовику** (06.10) | Ready | 20 | `1vty7EFqiiYQs2sgh8gHvxDDPexn8T63ZO4GQ3K1u8C0` |

Прежние №3–№6 (до пересборки 06.10): `1G8vUZTj…`, `1fsVQKEK…`, `1hhruVEi…`, `1qdoj3EI…` — лежат в той же
папке; прежний №2 (`1VKkYr8F…`) — в корзине Диска с 07.10. В реестре пока новый только №2; №3–№6 подключим после Off-plan (`docs/state.md`).
| C3-1 | [С3 Cash](https://docs.google.com/document/d/1LQ44RjVSj0QrY8sp2IdHpfLyJoXqFInK5CmZCS4v6nY/edit) | C3 | 18 | `1LQ44RjVSj0QrY8sp2IdHpfLyJoXqFInK5CmZCS4v6nY` |
| C3-2 | [С3 Mortgage](https://docs.google.com/document/d/1erVDJoIJPa_2Wj5SFT5HcGZSOBhww2GwfAaa5HfktbI/edit) | C3 | 19 | `1erVDJoIJPa_2Wj5SFT5HcGZSOBhww2GwfAaa5HfktbI` |

Все шаблоны заново загружены Алиной 22.08.2026 — ID изменились, старые недействительны.
Актуальный аудит: `docs/templates-audit-2026-08.md` (версия 2).
Папка «Готовые MOU» удалена 22.08.2026 — создать заново, в конфиге мёртвый ID.
Таблица [«MOU Builder»](https://docs.google.com/spreadsheets/d/168OI2_TjSLZSUpxWIkaXcCoGfgpiWa_hVh2QrN-Fzb8/edit) — `168OI2_TjSLZSUpxWIkaXcCoGfgpiWa_hVh2QrN-Fzb8`,
копия Алины с правом записи. Та, что прописана в конфиге (`1rI2ePSq…`), принадлежит другому
аккаунту, у Алины там только просмотр — надо переключить `MOU_SPREADSHEET_ID`.
Вкладка REVIEW в этой таблице — согласование правок шаблонов галочками.

## 5. План

1. ✅ Движок v2 (`lib/google/template-engine.js`) — готов, 20 тестов.
2. ✅ Аудит всех 8 шаблонов (текст + форматирование) — `docs/templates-audit-2026-08.md`.
3. Алина решает по расхождениям из аудита (разделы A–F) и удаляет старые .docx.
4. Реестр шаблонов → вкладка TEMPLATES в таблице (ID, название, группа, движок).
5. Вырезать из кода старый путь (поиск фраз, генерация таблицы подписей, старые
   тексты/статьи/правила). Остаётся только v2.
6. Разметить шаблоны, подключить, протестировать на реальных сделках.
7. Новый интерфейс: пошаговая форма (сделка → стороны → агентства → финансы → депозиты →
   проверка), живая валидация у полей, автозаполнение из справочников, липкая панель
   Preview/Create.
8. Позже: переезд на рабочий Google-аккаунт; ипотечные шаблоны 6–7; при необходимости —
   БД (Neon) для истории и статусов.

## 6. Открытые вопросы

- Ипотечные шаблоны: нужны новые поля — банк покупателя, банк продавца (Seller's Bank),
  сумма кредита, Liability Letter. Уточнить состав.
- Нужно ли для Seller поддержать чек от третьего лица (в шаблоне 2 такая фраза есть).
- Юрлицо как сторона: в C3-шаблонах Seller = компания (Trade License, shareholders).
  Нужен отдельный вариант блока стороны «компания vs физлицо».
- Переезд на рабочий аккаунт: кто будет владельцем папок и таблицы.

## 8. Правка Google Docs роботом

Что умеет и не умеет доступ к докам:

- **Drive-коннектор Claude** — только чтение, поиск и смена имени/папки. Записать текст
  в существующий док не может (поэтому появлялись копии вместо правок).
- **Docs API (OAuth-токен или сервисный аккаунт)** — хирургические правки на месте:
  меняется только указанный диапазон, оформление не трогается. Режим предложений
  («рекомендации» с галочками) через API недоступен.
- **Предложения с галочками** получаются одним путём: выгрузить .docx → внести правки
  как tracked changes (`w:ins`/`w:del`) → залить обратно с конвертацией. Риск —
  круговая конвертация может сдвинуть списки/отступы. Не проверено.
- **Playwright MCP** (добавлен 22.08.2026, user scope) — управление реальным Chrome
  под профилем `~/.claude-browser-profile`. Позволяет работать в интерфейсе Докс так же,
  как человек, включая режим предложений. Медленно, годится для точечных задач,
  не для сотен правок.

Проверено 22.08.2026: предложения в грантовом доке Алины оставил живой аккаунт
(Maxim Fedyukov), а не API-бот — либо руками, либо агентом в браузере.

## 9. Прямой доступ бота к Google (OAuth)

С 03.10.2026 бот работает от **d.kim@primebridge.estate**. Прежний проект `mou-bot-506311`
и клиент `mou-bot-cli` (аккаунт Алины) больше не используются.

- Проект Google Cloud «MOU App» (`prime-bridge-ad-site`, аккаунт adminad@primebridge.estate),
  Docs/Drive/Sheets включены, consent screen Internal — токен не истекает через 7 дней.
- OAuth-клиент бота — `mou-bot-web` (Web application, Client ID начинается с
  `167360552151-u8vg04…`), redirect `https://developers.google.com/oauthplayground`.
  Клиент `MOU App` (`167360552151-r8jli8…`) — вход на сайт, для бота не годится, не трогать.
- Refresh token получается в OAuth Playground со своими credentials (шестерёнка →
  Use your own OAuth credentials), scopes documents, drive, spreadsheets, вход под d.kim.
- В облачных сессиях Claude ключи — в переменных окружения «Work»: `GOOGLE_BOT_CLIENT_ID`,
  `GOOGLE_BOT_CLIENT_SECRET`, `GOOGLE_BOT_REFRESH_TOKEN`. `scripts/google-bot.mjs` берёт их
  оттуда, если нет `.env.local`.
- `invalid_client` — ID и секрет не от одного клиента или вставлены с ошибкой;
  `invalid_grant` — токен отозван, получить новый в Playground.
- ID шаблонов, таблицы и папки сменились 03.10 (переезд на d.kim@primebridge.estate);
  в разделах 4 и 10 ниже уже новые ID, источник правды — `lib/mou/config.js`.
  Бэкапы и черновики разметки (БЭКАП…, РАЗМЕТКА…) не копировались — их ID прежние,
  файлы лежат в старой папке «MOU» `1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm` у tsokuraline@gmail.com.

## 10. Актуальные адреса (03.10.2026)

Папка [«MOU (Prime Bridge)»](https://drive.google.com/drive/folders/1aj_s4joYlP-8QnEn8fLRTSHdFtjDs2MG)
— основная. Всё, что вне её, считаем устаревшим.

- Таблица «MOU Builder»: `168OI2_TjSLZSUpxWIkaXcCoGfgpiWa_hVh2QrN-Fzb8` (лежит в папке).
  Старая `1rI2ePSq…` принадлежит другому аккаунту, у Алины там только просмотр — не использовать.
- Папка [«Готовые MOU»](https://drive.google.com/drive/folders/1-gkMgBa_BQAlRC11tDacdSPElZj9vXiH):
  `1-gkMgBa_BQAlRC11tDacdSPElZj9vXiH`, создана заново внутри «Автоматизации».
- Реестр всех 9 шаблонов — в `MOU_TEMPLATES` (Vercel, Production) и в дефолтах `lib/mou/config.js`.
- Вкладка REVIEW в таблице — согласование правок шаблонов галочками.

Env в Vercel обновлены только для Production: preview-ветками не пользуемся, пушим в `main`.

Переезд на рабочую почту сделан 03.10.2026 — ID выше уже новые.
