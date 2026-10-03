# Состояние работ

Оперативная память проекта: что сделано, что ждём, что дальше. Общий план —
`plan.md`, правила и адреса — `project-memory.md`.

Обновлено: 03.10.2026

## Сейчас

Четыре шаблона на движке v2 и на проде: №1 off-plan, №2 off-plan ипотека,
№3 Ready cash to cash, №4 Ready cash to mortgage. В работе — №5 Ready mortgage to cash: размечен черновик, собран пакет, ждём «да» Алины на оригинал.

Сквозная проверка 13.09: 8 договоров (по два сценария на каждый из №1–№4) созданы
на проде через `/api/mou` и сверены с локальным рендером боевых шаблонов посимвольно,
включая жирный. Все проверки по шаблонам — 0. Найдено и исправлено: «Load Draft» не
выбирал шаблон черновика, и Create MOU молча генерировал off-plan №1; при исправлении
на несколько минут сломалось создание договоров (необъявленная переменная, c7f06df).
Проверен и путь через интерфейс: Load Draft → Create MOU. Тестовые договоры (14 шт.,
E2E-TEST) убраны в корзину Диска a.tsokur, их строки удалены из DRAFTS_LOG.
Договоры, созданные сайтом, принадлежат a.tsokur@primebridge.estate — бот их
удалить не может, только через Диск под этим аккаунтом.

После проверки GPT (13.09): Preview без выбранного шаблона тоже молча считал по №1.
Теперь `/api/preview`, как и `/api/mou`, отвечает 400 без шаблона, а форма до выбора
шаблона Preview не запрашивает и показывает «Выберите шаблон».
Маршруты Preview / Create MOU / Load Draft покрыты тестом настоящими запросами
(`test/api-routes.test.js`, подменён только Google). Проверено на проде: без шаблона 400,
договор №4 совпал с шаблоном, тестовый договор в корзине, строка журнала удалена.

Передача проекта новому владельцу: `handover.md`. GitHub передан 03.10 —
репозиторий `darrsoon/mou-builder`, локальный remote переключён. Vercel — создан код
передачи `c860d6dc-5a97-46b8-a5b9-f6e4657ce9e4` (действует 24 ч с 03.10 ~07:52),
ждём, пока Даша примет его под своим аккаунтом. Google-документы переехали 03.10:
шаблоны, таблица «MOU Builder» и папка «Готовые MOU» скопированы на d.kim@primebridge.estate
в папку «MOU (Prime Bridge)» `1aj_s4joYlP-8QnEn8fLRTSHdFtjDs2MG`; ID в коде и документах —
новые, правки шаблонов делаем только в новых копиях. Бэкапы и черновики разметки
(БЭКАП…, РАЗМЕТКА…) не копировались — их ID ниже прежние, они в старой папке у tsokuraline@gmail.com.
На Vercel удалены `MOU_TEMPLATES` и `MOU_TEMPLATE_DOC_ID` (03.10): список шаблонов
берётся только из `lib/mou/config.js`. Не заводить их снова — старое значение в них
молча вернуло бы сайт на старые копии шаблонов.

## Правки 03.10 — новая редакция №1 от Даши

Источник — docx `1aX_h4yUCAgWBJb4cZs2lwcayXZOw-VEn` (не менять). Бэкап шаблона №1 до правок —
«Копия 1. DRAFT Off-plan…» `1UueFOjh4uwaW-ACwcJaVkSBKCUODyt3nsUFtqbqcF8o`.
- `patch-template.mjs … agent-to-agency` — Agent/Agents → Agency/Agencies по всему №1 (18 мест), «Property» в ст.1 A.
- `patch-template.mjs … article6-bold` — жирный в ст.6 как в редакции; держатель чека и стороны возврата
  несут `<<жирное>>` из кода (`depositHolder`, `deposit_return_parties`).
- Строка Security deposit в таблице (код, все шаблоны): «(10% of the Selling Price, Security Deposit cheque
  issued by the Buyer in favour of the Seller)».
- Cheque Timing: новый вариант «Later» — чека пока нет, абзац ст.6 без реквизитов; при Later/Delayed
  реквизиты чека больше не обязательны.
- Агентства: по умолчанию выбирается PRIME BRIDGE ровно как в AGENTS, реквизиты подставляются сразу;
  ячейки AGENTS чистятся (`cleanAgent`: «#» у лицензии, переносы, должность в ячейке имени).
Проверки №1: check-markup, check-scenarios, check-combinations (9216) — 0; №2–№4 — 0.
Шаблоны №2–№4 по-прежнему с «Agent» — редакция пришла только для №1.

## Правки 03.10 (вечер)

- Суммы без «.00», если копеек нет (`money()` в helpers — все шаблоны и Commission Agreement); с копейками — два знака.
- «provided» → «issued» в строках депозита таблицы ст.4 в шаблонах №5, №6, C3-1, C3-2 (текст-образец),
  поиск в `scripts/markup/offplan-edits.mjs` обновлён под новый текст.
- C3-1, C3-2: строка депозита — «AED 000,000.00 / (10% of the Selling Price, Security Deposit cheque issued by the Buyer
  in favour of the Seller)», оформление как в №1 (при разметке C3 искать уже этот текст).
- Обновлённая редакция №1 (docx 1aX_h4yU…, вечер 03.10): `patch-template … redaction-1003` (20 правок текста
  и жирного), в коде — «Mr(s).» у представителя по POA, держатель «the **Buyer’s Agency** as **stakeholder**»,
  «upon signing this **Agreement**». Абзац про банк Покупателя Даша из №1 убрала — шаблон №1 совпадает с docx.
- 1.2 (no deposit cheques) `1BsYaITx…` — содержимое обновлено из docx Даши `1lXf-lodo…` (ID тот же, на сайте не
  используется). Отличия 1.2 от №1 вне депозитов: «by Credit Card» в Transfer Fee, абзац LPC с датой, «third party».
- Имена файлов: «<docTitle> <юнит>» (docTitle в реестре `lib/mou/config.js`), «Commission Agreement <юнит>».

- 04.10: из таблицы подписей в колонтитуле №1 убрана строка «Company Stamp» (`scripts/remove-footer-stamp.mjs`);
  жирный №1 сверен с docx (`scripts/sync-bold-from-docx.mjs`, 55 слов).

## Commission Agreement (03.10)

Отдельный документ к MOU, секция «Commission Agreement» внизу формы, кнопка Create Commission Agreement,
маршрут `/api/commission`, логика `lib/mou/commission.js`. Документ кладётся в «Готовые MOU» и пишется в DRAFTS_LOG.
- Шаблоны (копии .docx Даши `1nwKtbLm…` и `1WGHPes9…`, размечены `scripts/markup-commission.mjs`):
  7 (1 agency) `13KTXRtzB0lfbjYYza4yeUBZExFQrzpO-VCHGf_aqXCA`, 8 (2 agencies) `1YdVvN1OhhFBtnL-Yu5WfANRDDAAKWQQkYnoXp5yQCHI`.
- Стороны: Seller (обычно) или Buyer из MOU + 1–2 агентства; или компания + одна компания (шаблон 7,
  флаг `payer_is_company`). Если платят обе стороны сделки — два отдельных соглашения.
- Агентства не обязаны совпадать с MOU, реквизиты — из AGENTS. Комиссия по умолчанию 2,1% от Selling Price.
- Дата соглашения — дата создания (сегодня), выбирается вручную в редких случаях; дата MOU — из формы MOU.
- Срок оплаты: «in full on the day of transfer» или «within N (words) business days following the Transfer Date», N в форме.
- Кнопка «Create MOU and Commission Agreement» в нижней панели — оба документа по одной форме.
- Подписи — блок как в конце MOU (FIRST/SECOND/THIRD PARTY, Company, Represented by, Signature, Date, Company Stamp).
- Вёрстка (`patch-commission-layout.mjs`): дата соглашения в шапке ({{ca_date_header}}, «3 October, 2026»),
  пустые строки перед п.3 и п.4, заголовки держатся со следующим абзацем.
- Ждём текст для договора только между агентствами (до трёх) — шаблона нет.

## Отложено: Property с платформы (03.10)

Идея — по номеру юнита подтягивать в Property данные с app.primebridge.estate (проект, тип, спальни,
площадь, локация, при наличии цены). API у платформы нет, данные только со страниц после входа; учётку
блокируют за частые входы. Варианты: через AutoPost (`primebridge-estate/pb-autopost`, `lib/platform.ts`)
или напрямую с отдельной учёткой в env Vercel. Для работы нужны: доступ к app.primebridge.estate в сети
облачной среды и доступ сессии к репозиторию pb-autopost. Title Deed, аренда, Additional Information — руками.

## Шаблоны на движке v2

| # | Шаблон | Размечен | Бэкап до разметки | Правок |
|---|--------|----------|-------------------|--------|
| 1 | Off-plan `1qedPsMWpFLRFqjxPwuK53fXY_43AkkSC5bGc_rAXG0k` | 30.08 | `1KThc8Zq0G50zppR_cRGech6nhyyZSsTwzdw2_uM2RTo` | 170 |
| 2 | Off-plan ипотека `1VKkYr8FoFlLlHOVx_aoasdgZzYtB8hP4zaioqm4OaB0` | 05.09 | `12Zcp4G28uLcBEh0XtF1ulgAotC8uju6UV6oPBRMCcU8` | 179 |
| 3 | Ready cash to cash `1G8vUZTjrnBjSdstRNyEuoypRVVoRg8udywTu5g-e1Jk` | 08.09 | `121Mwvo-6GlqkEJ3fMZ52DsdF4XrvdTVm9UpcY6L_0o4` | 178 |
| 4 | Ready cash to mortgage `1fsVQKEKGYNng0ND1kkensdIqUOOQ7h_KgobDCoKwN-E` | 13.09 | `1HxLbN1-SpgGVej2avkZLFkDMgMM6i2d_hoylOJyPWEA` | 182 |

Чинить начертание после разметки: `fix-bold.mjs <шаблон> <бэкап>`, для шаблонов
с ипотечной раскладкой ст.7–8 (№2, №4) — с флагом `--mortgage`.

Разметка неидемпотентна: повторный прогон по уже размеченному документу его сломает.
Перед прогоном по оригиналу бэкап делается сам (`--original`).

## №5 Ready mortgage to cash — черновик

Черновик `1-zyRMRg_qjbjRt5TtEBZW4gZaSkdStLHZjaRj48gvoc` (185 правок, стиль — 0 расхождений,
сценарии — 0), пакет 19 договоров `1SdMGVK92gK0cylUTl1Pf_lyBlhtFUbnG` — совпадает с рендером.
Разметка: `node scripts/markup-ready-mortgage-cash.mjs [--original]`, затем
`fix-bold.mjs <шаблон> <бэкап>` (без `--mortgage`: ст.7–8 как в №3). Проверки — с флагами
`--ready --seller-mortgage`. В реестр `lib/mou/config.js` не вписан — до разметки оригинала;
при вписывании: `sellerMortgage: true`, articles `ready-mortgage-cash-v2`, defaults как у №3
плюс `mortgageReleaseFee: "960"`.

## Папки с тестовыми договорами

Договоры для проверки глазами, сгенерированы тем же кодом, что и сайт, и сверены
с шаблоном слово в слово (`scripts/verify-batch.mjs`).

- №1 off-plan, 16 договоров: `1dlghjYRbyV86tPdpSF-D5naSYpoHyOzY`
- №2 off-plan ипотека, 16 договоров: `1LULl4rudx4ceyH4XvsZ3vnIF1ithM8CE`
- №3 Ready cash to cash, 18 договоров: `1lGuaPXKl2cE0HvzJCTk7bS2GxvqSwnJB`
- №4 Ready cash to mortgage, 18 договоров: `1TSfJWJYJLvpUtdw6Tf_tncpY7XwFW2C4` (сверены с боевым)

Устаревшие пакеты переименовываются в «УСТАРЕЛО — …», а не удаляются.

## Ждём ответа Миши

1. «Bailing» в строке ADM Fee — что это должно значить.
2. Нужен ли админ-сбор 575 в готовых объектах и в ипотеке.
3. Type of Area в готовых объектах: в исходнике №3 стояло «Residential - Household
   Living», сейчас так подставляется только для Garden Residence и C3, для остальных
   «Residential». Пока оставлено как есть.

Плюс вопрос 24 из ревью: включать ли артикль «the» в определяемый термин в шапке.

## Решения, принятые Алиной

- В готовых объектах способ оплаты Продавцу зашит: только Manager's Cheque,
  поле в форме заблокировано (06.09).
- Суммы NOC и ADM в готовых объектах фиксированные, но правятся перед генерацией:
  Developer NOC 2 750, Community NOC 1 050, ADM Electronic 919, ADM Valuation 1 037.
- ADM Fee в ипотеке и готовых объектах — ровно 2% от Selling Price, без админ-части.
- Номер проекта в готовых объектах вводится вручную, номер парковки — конкретный.
- «REVENUE ACCOU» в строке ADM Fee — не опечатка, так и должно быть.
- Суммы сборов по умолчанию — свои у каждого шаблона, из его исходника, и правятся
  в форме (13.09). Лежат в реестре `lib/mou/config.js`, поле `defaults`. У №4 ADM
  Electronic 1,392 (как в исходнике №4), не 919 как в №3.
- В №4 новая строка Unit Verification / Search Certificate: поле с подстановкой 103.50 (13.09).
- В №4 статья 10 без «for an amount equal to the agreed Selling Price» — как в №2 (13.09).
- В №4 убраны два пустых абзаца в конце документа — иначе мог появиться пустой лист.
- Определение Liquidated Damages при двух депозитах убирается (комментарий Даши), при этом
  в статье про одобрение застройщика остаётся «neither Party shall be entitled to claim
  the liquidated damages». Нестыковку нашёл GPT 13.09; Алина решила оставить как есть —
  не поднимать повторно.
- Документ 14 пакетов (фиксированный депозит) проверен 13.09: суммы 150,000 и 120,000
  на месте во всех пакетах. Замечание GPT про 167,000 было ошибкой — он перепутал файлы.
- №5 (13.09): Mortgage Release Fee — поле с подстановкой 960; банк Продавца — выпадашка
  со списком банков и своим вариантом; деньги Покупателя в ст.10 — Own funds (по умолчанию)
  или Own funds, Personal Loan, Equity Release; сумма Продавцу — вся Selling Price одной
  строкой с припиской про Liability Letter, как в исходнике.
- Personal Cheque в ст.10 №5 (и №6) держат по правилу депозитных чеков: агентство Продавца,
  без него — агентство Покупателя, без агентств — сам Покупатель (13.09).
- Мягкий режим валидации оставлен: договор создаётся даже с пропусками, пока на
  Vercel нет `MOU_REQUIRE_VALIDATION=true`. Включать — решение Алины.

## Дальше

1. №5 Ready mortgage to cash `1hhruVEiqBbNhib4NNmtTX-gNvGwpCw6rsMJ76Iqhk1g` — черновик и пакет
   готовы (см. выше), ждём «да» на разметку оригинала.
2. №6 Ready mortgage to mortgage `1qdoj3EIr_RdTCjoC1v12aijgX26LXJKowcPyjncIY3c` — 20 статей,
   ADM Electronic 1,392, строка Unit Verification есть.
3. C3-1 и C3-2 — нужен блок стороны-юрлица, его ещё нет.

Бот к Google с 03.10 работает от d.kim@primebridge.estate: проект Google Cloud «MOU App»
(`prime-bridge-ad-site`, аккаунт adminad@primebridge.estate), consent screen Internal —
токен не истекает через 7 дней. OAuth-клиент бота — `mou-bot-web` (Web application,
redirect `https://developers.google.com/oauthplayground`), refresh token получен через
OAuth Playground со своими credentials. Клиент `MOU App` в том же проекте — вход на сайт,
не трогать. В облачных сессиях Claude ключи лежат в переменных окружения «Work»
(`GOOGLE_BOT_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN`); `scripts/google-bot.mjs` берёт их
оттуда, если нет `.env.local`. Перевыпуск — так же через Playground.

Порядок работы с новым шаблоном: прочитать документ с комментариями → задать Алине
вопросы по расхождениям → разметить черновик → проверки → пакет договоров →
по «да» Алины разметить оригинал → вписать в реестр `lib/mou/config.js`.
