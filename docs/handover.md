# Передача проекта новому владельцу

Что передать, в каком порядке и как проверить, что всё работает. Отмечай галочками по ходу.

Участники: **прежний владелец** — Алина (GitHub `AlinaTsokur`, Vercel `tsokurenok-s-projects`,
Google `a.tsokur@primebridge.estate`), **новый владелец** — Даша.

Пока перенос не закончен, сайт продолжает работать у прежнего владельца: ничего
не ломается, пока не поменяли переменные на Vercel.

## Что входит в проект

| Часть | Где сейчас | Что с ней делаем |
|---|---|---|
| Код | GitHub `AlinaTsokur/mou-builder`, ветка `main` | передать репозиторий |
| Сайт | Vercel, проект `mou-builder`, https://mou-builder-rho.vercel.app | передать проект |
| Вход на сайт | OAuth-клиент в Google Cloud | создать новый у нового владельца |
| Шаблоны договоров | Google Docs, 4 документа (ID ниже) | передать владение |
| Справочники и журнал | Google Таблица `1cDlPWsD4gmmbzdaV0spVxLNSAedEXZruizYYtnn7CsQ` | передать владение |
| Готовые договоры | Папка Диска `1hENNhxCor6GO0SX8Psedc3gPmyq_eIaL` | передать владение |
| Разметка шаблонов | Скрипты в репозитории + токен бота в `.env.local` | выпустить свой токен |

Боевые шаблоны:

| № | Шаблон | ID документа |
|---|---|---|
| 1 | Off-plan | `1LLMqzZ1xeSPzVOhVahG4B8l9bQx0KggFBvZUynOY8bU` |
| 2 | Off-plan ипотека | `1RjrVeLZG65Fyzc5h0TFR0sks8D--jJocEXyF2H9fg9g` |
| 3 | Ready cash to cash | `1d-bXwKBO9J8fUQ35vqKWw5KzADJ6lB6fmD4hxeSjy3k` |
| 4 | Ready cash to mortgage | `1slUJ8aQCw8nKIhlKBHWvhUFkLWnLH3k_N_OtwH5sm3Y` |

Остальные шаблоны, бэкапы и папки с тестовыми договорами — в `docs/state.md`.

## Порядок

### 1. Google: документы и доступ

1. Открыть доступ новому владельцу к папке «MOU» (`1wAOozC2ofCV3Hsm16wdJoywK6_jvjZpm`),
   папке «Готовые MOU» (`1hENNhxCor6GO0SX8Psedc3gPmyq_eIaL`) и таблице.
2. Передать владение каждым объектом: правой кнопкой → «Открыть доступ» → у нужного
   человека выбрать «Передать права владельца».
   **Важно:** передать владение можно только внутри одной организации. Если у нового
   владельца почта не на `primebridge.estate`, права владельца Google не отдаст —
   тогда остаётся либо завести ему почту в этом домене, либо сделать копии документов
   у него и вписать новые ID (п. 4).
3. Договоры, созданные сайтом, лежат в папке «Готовые MOU» и принадлежат тому аккаунту,
   под которым их создавали. Старые договоры владельца не меняют — важно, кто владеет
   самой папкой.

### 2. Google Cloud: вход на сайт

Сайт пускает людей внутрь через OAuth-клиент. Клиент прежнего владельца новому
не передаётся — создаётся новый:

1. https://console.cloud.google.com → создать проект.
2. APIs & Services → включить Google Docs API, Google Drive API, Google Sheets API.
3. OAuth consent screen: тип **Internal**, если почта в Google Workspace, иначе
   **External** плюс добавить всех, кто будет пользоваться, в Test users.
4. Credentials → Create credentials → OAuth client ID → Web application.
   - Authorized redirect URI: `https://<адрес сайта>/api/auth/callback/google`
   - для работы на своём компьютере добавить второй: `http://localhost:3000/api/auth/callback/google`
5. Сохранить Client ID и Client secret — они понадобятся в п. 4.

### 3. GitHub: код

1. Прежний владелец: Settings репозитория → Danger Zone → Transfer ownership,
   указать аккаунт нового владельца.
2. Новый владелец принимает передачу по письму.
3. Решить, остаётся ли репозиторий публичным. Сейчас он публичный: код виден всем,
   паролей в нём нет, но видны тексты договоров и ID документов. Рекомендую сделать
   приватным: Settings → Danger Zone → Change visibility.

### 4. Vercel: сайт

1. Новый владелец регистрируется на https://vercel.com (удобнее — входом через GitHub).
2. Прежний владелец: проект `mou-builder` → Settings → General → Transfer project,
   выбрать аккаунт нового владельца. Новый владелец подтверждает запрос.
3. После переноса проверить, что проект связан с репозиторием нового владельца:
   Settings → Git. Если связи нет — подключить заново.
4. Settings → Environment Variables. **Старые значения прочитать нельзя**, часть
   нужно задать заново:

| Переменная | Что вписать |
|---|---|
| `GOOGLE_CLIENT_ID` | из нового OAuth-клиента (п. 2) |
| `GOOGLE_CLIENT_SECRET` | из нового OAuth-клиента (п. 2) |
| `GOOGLE_ALLOWED_DOMAIN` | домен почты, которой разрешён вход, например `primebridge.estate`. Пусто — пускает всех |
| `NEXTAUTH_URL` | адрес сайта целиком, например `https://mou-builder.vercel.app` |
| `NEXTAUTH_SECRET` | новая случайная строка: `openssl rand -base64 32` |
| `MOU_SPREADSHEET_ID` | ID таблицы MOU Builder |
| `MOU_OUTPUT_FOLDER_ID` | ID папки «Готовые MOU» |
| `MOU_TEMPLATES` | можно не задавать: список шаблонов живёт в коде, `lib/mou/config.js` |
| `MOU_TEMPLATE_DOC_ID` | не нужна, осталась от версии с одним шаблоном |
| `MOU_PROJECTS_SHEET` `MOU_LISTS_SHEET` `MOU_LOG_SHEET` `MOU_RULES_SHEET` `MOU_AGENTS_SHEET` | названия листов таблицы: `PROJECTS`, `LISTS`, `DRAFTS_LOG`, `RULES`, `AGENTS`. Если не задавать — берутся эти же значения |

5. Deployments → Redeploy, чтобы новые переменные подхватились.
6. Если адрес сайта поменялся: вписать новый `NEXTAUTH_URL` и добавить его redirect URI
   в OAuth-клиент (п. 2.4), иначе вход будет падать с ошибкой `redirect_uri_mismatch`.

### 5. Работа на своём компьютере

```bash
git clone https://github.com/<новый владелец>/mou-builder.git
cd mou-builder
npm install
cp .env.example .env.local   # вписать свои значения
npm run dev                  # откроется http://localhost:3000
```

Нужен Node 20 или новее.

Проверки перед пушем: `npm test`, `npx next build`, для серверного кода ещё
`npm run check:undef`.

### 6. Токен бота для разметки шаблонов

Скрипты, которые размечают шаблоны (`scripts/markup-*.mjs`) и собирают пакеты
тестовых договоров, ходят в Google не через сайт, а под отдельным аккаунтом-ботом.
Токен лежит в `.env.local` и в репозиторий не попадает.

Новому владельцу нужно выпустить свой:

1. В Google Cloud создать ещё один OAuth-клиент, тип **Desktop app**.
2. Вписать в `.env.local`:
   ```
   GOOGLE_BOT_CLIENT_ID=...
   GOOGLE_BOT_CLIENT_SECRET=...
   ```
3. `node scripts/google-auth.mjs`, открыть ссылку в браузере, выбрать аккаунт,
   разрешить все права. Скрипт допишет `GOOGLE_BOT_REFRESH_TOKEN`.
4. Аккаунту бота нужен доступ на редактирование к шаблонам и папке «MOU».

Пока consent screen в режиме Testing, токен живёт 7 дней. Ошибка `invalid_grant`
означает, что он истёк — перевыпустить тем же способом.

## Проверка после переноса

- [ ] Сайт открывается, вход через Google работает.
- [ ] В разделе Template видны все шаблоны.
- [ ] Создать договор по шаблону №1 — открывается, маркеров `{{ }}` в нём нет.
- [ ] Строка появилась в листе `DRAFTS_LOG`, договор лежит в папке «Готовые MOU».
- [ ] Load Draft подставляет данные и выбирает шаблон черновика.
- [ ] Локально: `npm test` — все тесты проходят.
- [ ] Тестовый договор убрать в корзину, строку из журнала удалить.

## Что прочитать новому владельцу

- `CLAUDE.md` — правила работы с проектом.
- `docs/state.md` — что сделано, что в работе, ID шаблонов и бэкапов.
- `docs/project-memory.md` — решения по договорам, принятые с заказчиком.
- `docs/plan.md` — план работ.
- `docs/templates-audit-2026-08.md` — разбор расхождений между шаблонами.
