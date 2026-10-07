# Состояние работ

Оперативная память проекта: что сделано, что ждём, что дальше. Общий план —
`plan.md`, правила и адреса — `project-memory.md`.

Обновлено: 07.10.2026

## Сейчас

**Порядок (Даша, 07.10): сначала до конца доводим Off-plan (№1, №2), потом готовые объекты (№3–№6).**
Вопросы по готовым шаблонам задаём Даше, только когда до них дойдём (список — «Отложенные вопросы»).

№2–№6 пересобраны 06.10 по чистовикам Даши (см. ниже). В реестр в ветке `claude/exciting-shannon-2uya7o`
вписан только новый №2; №3–№6 в реестре прежние (на сайте — прежние №3, №4 на v2, №5, №6 старым движком),
новые документы №3–№6 ждут своей очереди.

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

## Off-plan проверен целиком (07.10)

№1 (на сайте) и новый №2 (ветка): check-markup, check-scenarios, check-combinations (9216 у каждого) — 0;
жирный №1 = драфт 1 (docx, 0 расхождений), стиль №2 = его чистовик (кроме выравнивания и ст.7–8 из №1);
№1 «всё включено» = драфт 1 и «без депозитов» = чистовик 1.2 пословно (кроме подстановок и правил).
Пакеты по 16 договоров (см. «Папки с тестовыми договорами») созданы кодом сайта и сверены
`verify-batch.mjs` — все совпадают с рендером, маркеров нет, жирный на месте.
Найдено и исправлено: в №2 «ADREC» в конце ст.4 потерял жирный после правки двойной точки.
`generate-batch.mjs` теперь переносит договоры в папку тестов (раньше они оставались и в «Готовых MOU»).
Осталось по Off-plan: «Manager's Cheque or Cheque» в №2 (вопрос Даше), дефис «third party reason»
(в эталоне без дефиса, грамматически с ним — решает Даша), слияние ветки в `main` и проверка №2 на проде.

## Commission Agreement: подсветка и правки шаблона «8» (07.10)

Подсветка вставленного — как в MOU (`highlightValues: true` в /api/commission): даты, юнит, цена,
стороны, реквизиты агентств (название, должность, представитель, лицензия, адрес — companyBlock),
комиссии и суммы прописью, срок оплаты, имена в подписях. Роль «Seller/Buyer» (payer_role) — без
подсветки. Проверено PDF тестового соглашения на 2 агентства.
Шаблон «8. Commission Agreement (2 agencies)»: «agrees to pay Third Party» → «agrees to pay the Third
Party»; абзац «…the Third Party shall / each be the sole recipient…» был разорван на два — склеен.
В «7» (1 agency) таких мест нет.

## WHEREAS B: «agrees to purchase the Property» без запятой (07.10)

Даша: убрать запятую после «purchase» во всех №1–№6. Убрана в шаблонах сайта №1, №3, №4, №5, №6 (старые
№5/№6 — старым движком) и в новых №3, №6 (в новом №2, №4, №5 её не было). Замена сняла жирный со слова
«Property» там, где он был (№1, новые №3 и №6) — возвращён. Для пересборки по чистовикам правка
«WHEREAS B: без запятой» добавлена в READY_CASH_CLEAN и READY_MORTGAGE_MORTGAGE_CLEAN.
check-scenarios по №1, №3, №4 сайта и новым №3, №6 — 0.

## Вставленное из формы — жёлтым (07.10)

Даша: всё, что вставлено в договор, на выходе выделено жёлтым. Значения при подстановке оборачиваются
метками ⟦ ⟧ (`markValue` в lib/mou/helpers.js; символы частной области Unicode Google Docs молча
вырезает — не годятся), после подстановки и жирного генератор красит текст между метками в жёлтый
(1,1,0 — как в шаблонах) и удаляет метки (`buildValueHighlightRequests` в lib/google/docs.js).
В блоках сторон, подписей, строке депозита — только сами значения (имя, гражданство, паспорт, EID,
доля, суммы, проценты), связки вроде «, nationality:» не красятся. Не красятся служебные подстановки:
номера статей, agencies_word, вводная «Similarly…», держатель чека, кому возвращают чеки, Transfer Fee
label и т.п. (`NOT_HIGHLIGHTED`). MOU (`highlightValues: true` в /api/mou, generate-sample,
generate-batch) и Commission Agreement (/api/commission, с 07.10). Если метка осталась —
генератор пишет «value mark left» в список неподставленного. Остальная жёлтая заливка — из самих
шаблонов (например «the Seller’s Agency as stakeholder» в №1). Проверено PDF на примерах №1 и №2.

## Обязательные поля — строгий режим в форме (07.10)

Даша: все поля обязательны. Create MOU и «MOU and Commission Agreement» не создают договор, пока в разделах
есть хоть один пропуск (сумма чипов «Needs info»): справа «MOU was not created» со списком полей, форма
прокручивается к первому разделу с пропуском (mouPrecheck в app/page.js). У сторон обязательны и Title,
у представителя по POA — все поля, включая POA EID целиком. Пустые обязательные поля сторон подсвечены
тоном «Needs info»; по наведению на плашку раздела или чип — список того, чего не хватает.
Сервер по-прежнему мягкий (MOU_REQUIRE_VALIDATION не включён) — блокирует форма. Commission Agreement
отдельной кнопкой — без этой блокировки. Проверено локально (Playwright, подменены только сессия и
/api/init): запрос на создание не уходит, список и подсветка видны.

## Emirates ID — галочкой (07.10)

Даша: у Продавца и Покупателя галочка «Has Emirates ID». Отмечена — поле EID видно и обязательно
(номер целиком 784-XXXX-XXXXXXX-X, иначе на плашке раздела «Party N: EID» и ошибка в validateMou);
не отмечена — поля нет, EID в договор не идёт, даже если номер остался. Черновики без галочки:
ID есть, если номер введён (`partyHasEid` в lib/mou/helpers.js). У представителя по доверенности
(POA EID) — как раньше, необязательное поле. Тест: test/party-eid.test.js.

## Подписи: заголовок не висит один внизу страницы (07.10)

Даша: «THE SELLER» остался внизу страницы, а подпись уехала на следующую. В PDF цепочка «не отрывать
от следующего» держалась, а в редакторе Google её порвал. Теперь заголовки «THE SELLER», «THE BUYER»,
«SELLER’S AGENCY», «BUYER’S AGENCY» — один абзац со строкой подписи (перенос строки внутри абзаца),
такой абзац не разрывается. `scripts/fix-signature-headings.mjs <id>` (входит в apply-layout-fixes,
повтор безопасен): если между заголовком и подписью был интервал (№1, 12 pt) — пустая строка, если не
было (№2) — одиночный перенос. Применено к №1 и новому №2; check-scenarios, check-combinations — 0,
PDF последней страницы №1 до/после — визуально так же. №3–№6 — когда дойдём (через apply-layout-fixes).

## Форма: строка разделов закреплена (07.10)

Чипы разделов (Template, Agreement, … Articles) закреплены под верхней панелью и видны при прокрутке
(просьба Даши). Высоты панелей — CSS-переменные `--topbar-h` / `--nav-h` (`useStickyHeights` в
app/page.js); от них считаются отступ Preview и прокрутка к разделу. На телефоне чипы в одну строку
с горизонтальной прокруткой.

## Пересборка №2–№6 по чистовикам (06.10)

Чистовики Даши (docx 03.10) лежат на общем диске — бот видит их только с `supportsAllDrives`.
Google-копии в папке «MOU (Prime Bridge)» («ЧИСТОВИК N (Google-копия docx 03.10, не править)»):
№2 `1Sy4FpNvcO2ahf2uL3sU6Os-rZcI_GZEXIrvWYql56Bo`, №3 `17VDP2-Ca5DI_3FNbUkj1gYWDVEjSAg85INVhdkN4r4Y`,
№4 `1Suj6HTQxfljkzRWQ0mHmq4NJ1EECTzyDeF1dF4S3mhs`, №5 `1EREXr3_5zj_o2Lq0M0AYLB-8wvHCWaUR1fWbryingxw`,
№6 `1mB9S9exCjrUNZDK6Yj_dNs-xHfYuKMMahA69SxWxOFU`.

Новые шаблоны («N. DRAFT … — НОВЫЙ (чистовик 03.10, v2)»), в реестре `lib/mou/config.js`:

| # | Шаблон | ID | Правок | Комбинаций без замечаний |
|---|--------|----|--------|--------------------------|
| 2 | Off-plan ипотека | `1tx7RSibxrjdPz3DWjCxzA7Fy_L8CHgIK4JbsJa8Fo9o` | 162 | 9216 |
| 3 | Ready cash to cash | `1OvFwfDrZ57blOIblZCSuNa53B6xUgdfQvxsQQ-qGEbQ` | 158 | 6144 |
| 4 | Ready cash to mortgage | `1OG7MFlEDx3a8RyqJbjtqBjfvhj2aMUQIplJcyaPm2Zs` | 164 | 6144 |
| 5 | Ready mortgage to cash | `1UTrKSLj69RrNQAgoavPCTUdU1CJ37sfK9IB9KcC6AyU` | 188 | 12288 |
| 6 | Ready mortgage to mortgage | `1vty7EFqiiYQs2sgh8gHvxDDPexn8T63ZO4GQ3K1u8C0` | 168 | 6144 |

Прежние шаблоны не тронуты и служат бэкапом: №2 `1VKkYr8F…`, №3 `1G8vUZTj…`, №4 `1fsVQKEK…`,
№5 `1hhruVEi…`, №6 `1qdoj3EI…` (полные ID — в таблице «Шаблоны на движке v2» ниже). После слияния
в `main` — переименовать прежние в «УСТАРЕЛО — …», у новых убрать «— НОВЫЙ (…)» из имени.

Как собрано (для каждого): `markup-*.mjs` по Google-копии чистовика → `scripts/rebuild-from-clean.sh`
(жирный из чистовика `fix-bold`, статьи о дефолте из №1 `copy-default-articles`, `apply-layout-fixes`,
`fix-payment-text-plain`, `fix-signature-gap`, `fix-article4-gap`) → check-markup, check-scenarios,
check-combinations — 0 замечаний; check-style — жирный совпадает с чистовиком (расхождения только
выравнивание по ширине и отступы ст.7–8 из №1); текст «всё включено» сверен с чистовиком пословно
(`render-text.mjs` + `dump-text.mjs` + `word-diff.py`): отличаются только подстановки и правила ниже.

Правки разметки (`scripts/markup/*`): ищут уже «Agency» (`toAgency` в `offplan-edits.mjs` переводит все
find/replace), «Security Deposit:», «Upon signing this Agreement», абзац Продавца без реквизитов чека
размечается (в чистовиках он есть), образцы 000,000 / 000000 / 00.00.2026 — в конфиге `*_CLEAN`.
`article78: "copy"` — статьи 7–8 не размечаются, их целиком приносит copy-default-articles.
Новые конфиги: `OFFPLAN_MORTGAGE_CLEAN`, `READY_CASH_CLEAN`, `READY_MORTGAGE_CLEAN`,
`READY_MORTGAGE_CASH_CLEAN`, `READY_MORTGAGE_MORTGAGE_CLEAN`; dry-run: `node scripts/markup/dry-run.mjs clean-N`.

Что поправлено в чистовиках при разметке (текст Даши иначе не трогали):
- №3: в строке Security deposit стоял текст строки Agency Fee — заменён образцом строки депозита
  (её всё равно собирает движок). Подпись «Security deposit:» со строчной оставлена, как в чистовике.
- №4, №6: убран абзац «The Seller shall cooperate with the Buyer’s financing bank…» (решение 05.10;
  чистовики 03.10 его ещё содержали). В №2 он остаётся.
- №2, №4, №6: «Mortgage Pre-Approval for an amount equal to the agreed Selling Price» → без суммы
  (решение 04.09 / 13.09, как было в живых №2/№4).
- №5, №6: у подписи агентства Продавца стояла дата Покупателя; в №6 плейсхолдеры подписей
  агентств были испорчены скриптом Agency (`{{seller_Agency_name}}`) — возвращены.
- №2: точка в конце ст.4 в чистовике уже есть — старая правка её больше не добавляет.
- Скобка ADM Fee в №3–№6 по-прежнему приводится к «valuation, whatever comes higher)».

Следствие переноса статей 7–8 из №1: в №2–№6 распределение liquidated damages («This amount shall be
distributed as follows: a) 80% … b) 20%») теперь показывается и без депозитов — как в №1 (чистовик 1.2).

Движок и форма: набор статей `ready-mortgage-mortgage-v2` (20 статей) для №6; в реестре у №5
`sellerMortgage`, у №6 `ready + mortgage + sellerMortgage`, суммы по умолчанию из чистовиков
(№6: ADM Electronic 1,392, Mortgage Release Fee 960, без Unit Verification). Выбор Buyer Funds в
форме — только у №5 (в №6 у Покупателя ипотека). Проверки знают №6: флаги `--ready --mortgage --seller-mortgage`.

Вопросы по №2 (Off-plan ипотека, оставлено как в чистовике) — задать сейчас:
- «ADM Verification Certificate» вместо «ADM Valuation Certificate» (в №4–№6 — Valuation) — опечатка?
- «by Manager's Cheque or Cheque» в строке суммы Продавцу (было «by Manager's Cheque»).

### Отложенные вопросы (готовые объекты — задать, когда дойдём до №3–№6)
- №3: «Security deposit:» со строчной (в остальных «Security Deposit:»).
- (из «Ждём ответа Миши» ниже — Bailing, админ-сбор 575, Type of Area — тоже про готовые объекты.)

### Записи реестра для №3–№6 (вписать в `lib/mou/config.js`, когда дойдём)
```js
{ id: "1OvFwfDrZ57blOIblZCSuNa53B6xUgdfQvxsQQ-qGEbQ", label: "3. Ready — cash to cash", docTitle: "Cash to Cash Memorandum of Understanding (MOU)",
  engine: "v2", articles: "ready-cash-v2", ready: true,
  defaults: { admElectronicFee: "919", admValuationFee: "1,037", developerNocFee: "2,750", communityNocFee: "1,050" } },
{ id: "1OG7MFlEDx3a8RyqJbjtqBjfvhj2aMUQIplJcyaPm2Zs", label: "4. Ready — cash to mortgage", docTitle: "Cash to Mortgage Memorandum of Understanding (MOU)",
  engine: "v2", articles: "ready-mortgage-v2", ready: true, mortgage: true, unitVerification: true,
  defaults: { admElectronicFee: "1,392", admValuationFee: "1,037", developerNocFee: "2,750", communityNocFee: "1,050", unitVerificationFee: "103.50" } },
{ id: "1UTrKSLj69RrNQAgoavPCTUdU1CJ37sfK9IB9KcC6AyU", label: "5. Ready — mortgage to cash", docTitle: "Mortgage to Cash Memorandum of Understanding (MOU)",
  engine: "v2", articles: "ready-mortgage-cash-v2", ready: true, sellerMortgage: true,
  defaults: { admElectronicFee: "919", admValuationFee: "1,037", developerNocFee: "2,750", communityNocFee: "1,050", mortgageReleaseFee: "960" } },
{ id: "1vty7EFqiiYQs2sgh8gHvxDDPexn8T63ZO4GQ3K1u8C0", label: "6. Ready — mortgage to mortgage", docTitle: "Mortgage to Mortgage Memorandum of Understanding (MOU)",
  engine: "v2", articles: "ready-mortgage-mortgage-v2", ready: true, mortgage: true, sellerMortgage: true,
  defaults: { admElectronicFee: "1,392", admValuationFee: "1,037", developerNocFee: "2,750", communityNocFee: "1,050", mortgageReleaseFee: "960" } },
```

## №1: правый край текста 16,75 см (05.10)

В эталонном docx поля 2,2 см (текст 16,6 см), а таблицы 16,72 см — Payment Table вылезала за текст.
По просьбе Даши правый край всего текста — 16,75 см по линейке: левое поле 2,2 см, правое 2,05 см,
все три таблицы (шапка, Property Details, Payment Table) растянуты пропорционально до 16,75 см.
Там же правый отступ всех абзацев обнулён (было −0,07 и −0,82 см — абзацы о депозите в Article 6
вылезали за край почти на сантиметр), а 4 абзаца «по левому краю» («The Selling Price…», «Any
governmental…», «(hereinafter referred to as the … Agency)») переведены на выравнивание по ширине,
как весь текст. Скрипт `scripts/fix-text-width.mjs <id> [см]`, повторный запуск ничего не меняет.
Проверено PDF на копии.

## №1: пустая строка перед «The forfeited Security Deposit…» (05.10)

В статьях о дефолте Покупателя и Продавца пустая строка перед «The forfeited Security Deposit shall be
distributed as follows:» пропадала: движок, вырезая соседний блок {{#if !buyer_deposit}}, забирал её
как разделитель. Теперь это перенос строки (\u000b) в начале абзаца: «{{#if buyer_deposit}}\u000bThe
forfeited…». `scripts/fix-forfeited-gap.mjs <id>`. Проверено на копии: PDF + check-combinations
(9216 комбинаций, 0 замечаний).

## №1: одинаковый отступ текста в таблицах (05.10)

В Property Details было поле ячейки 0 + отступ абзаца 2 pt, в Payment Table — стандартное поле ~5 pt:
текст начинался на разном расстоянии от рамки. Теперь в обеих поле ячейки слева/справа 2 pt,
отступы абзацев в ячейках 0 (строку-заголовок не трогаем). `scripts/fix-table-padding.mjs <id> [pt]`
(заменяет 5 pt из fix-payment-table-indent.mjs). Проверено PDF на копии.
Колонтитул с подписями (таблица) — поле ячеек слева 0, ширина 16,75 см, строки начинаются по краю
текста: `scripts/fix-footer-align.mjs <id> [см]`.
Номер в ссылках «Article N» внутри текста (WHEREAS A/B, ст. 7/8) — жирный, как слово Article:
`scripts/fix-article-ref-bold.mjs <id>`.
Payment Table по колонкам как Property Details (левая 8,43 см, правая 8,32, всего 16,75 —
разделитель колонок на одной линии): `scripts/fix-payment-columns.mjs <id>`.

## Commission Agreement «7»: нижнее поле (05.10)

Нижнее поле шаблона «7» (одно агентство) было 5,7 см при пустом колонтитуле (у «8» — 2,2 см,
у MOU — 3,2 см) — с двумя продавцами последний абзац Article 2 уезжал на 2-ю страницу.
Поле уменьшено до 3,2 см (91.1 pt, как в MOU), по согласию Даши. Проверено PDF на копии её
договора The Row-B5-07-15: Article 2 целиком на 1-й странице, 2-я начинается с «3. Governing Law».

## Agency вместо Agent, Title Deed N/A, чистовики №2–№6 (06.10)

- «Agent» → «Agency» по тексту шаблонов №1–№6 (тело и колонтитулы, «the Agent», «Agents» → «Agencies»,
  «agents’» → «agencies’»): `scripts/fix-agency-wording.mjs <id>`. C3 НЕ трогать (Даша): старый движок
  (lib/google/docs.js) ищет в их тексте фразы со словом «Agent». Commission Agreement — «Agent» не было.
- Title Deed пустой — в договор «N/A» во всех шаблонах (normalizeForm), в форме не считается обязательным.
- Даша дала чистовики (docx, 03.10) как эталон для №2–№6: №2 `1dFoxeFeI27gIuinjKcFtRtuI_EheRH1e`,
  №3 `1gnwGupIsGfqCCVqfqOPFfTipZRCg9CVB`, №4 `1PF9rWkaiEcdBhlaG66pp9bLgyLsIdC9J`,
  №5 `1b4vthq_LJOxddmEeWRtoAjN0khkyDIqy`, №6 `1_4UtEmXwXtvikjlHmLu6t38X8Dp6mAlM`. Живые №2–№5 — старая
  редакция (~30–100 строк отличий). План: разметка (scripts/markup/*) на Google-копии чистовика — сейчас
  не находит 32–37 правок из ~180 (новые формулировки, образцы значений), поправить правки; затем
  жирный из чистовика, copy-default-articles из №1, apply-layout-fixes, проверки, замена с бэкапом.
  Порядок: №5 («да» Даши 06.10), №3, №4, №2; №6 — разметки ещё нет.
  Что мешает разметке на чистовиках (dry-run): «Agent» → «Agency» в find/replace правок; «Security Deposit:»
  с заглавной; строка депозита в таблице «…Selling Price, Security Deposit cheque issued by the Buyer in favour
  of the Seller)»; «Upon signing this Agreement» с заглавной; образцы 000,000 / 000000 / 00.00.2026 вместо
  528,013 / 174369 / 14.04.2026; абзац Продавца без реквизитов чека в чистовике уже есть (правка вставляла
  его сама); «to the Buyer’s Agency on the Transfer Date» (строчная the); «via agencies’ email»; «respective
  Agencies»; колонтитул «Seller’s Agency signature». Статьи 7/8 после разметки — copy-default-articles из №1.
- Статьи о дефолте (liquidated damages, распределение 80/20 всегда) скопированы из №1 в живые №2–№4
  (`scripts/copy-default-articles.mjs <№1> <шаблон>`), check-scenarios + check-combinations — 0 замечаний.
  В №1 там же подсветка как в чистовике: жёлтым только суммы (`scripts/fix-ld-highlight.mjs`). `scripts/markup/dry-run.mjs <ключ> [id]`
  теперь принимает документ третьим аргументом. «.00» в №5/№6 — образцы значений, уйдут с разметкой.

## №1 без депозитов — по чистовику 1.2 (06.10)

Даша: эталон для off-plan без Security cheques — чистовик 1.2 «NO DEPOSIT CHEQUES»
(`1lXf-lodoCXjaDhH8nyo7v0U3YhhMud3x`). Сверка текста варианта «Ни у кого» из №1 с ним:
- распределение liquidated damages («This amount shall be distributed as follows: a) 80% … b) 20% …»)
  было под {{#if any_deposit}} — без депозитов пропадало. Условие снято (`scripts/fix-ld-distribution.mjs`),
  проверка: check-scenarios + check-combinations (9216, 0);
- Location: «Yas Island, Abu Dhabi» → «…, Abu Dhabi, UAE» (formatPropertyLocation);
- 07.10: «purchase, the Property» уже совпадает с 1.2; «any third-party reason» в первых абзацах статей
  о дефолте → «any third party reason», как в драфте №1 (docx `1aX_h4yU…`) и 1.2 (решение 07.10).
  «third-party, or other fees» и «third-party offers» — с дефисом, как в драфте. Теперь вариант «Ни у
  кого» №1 совпадает с 1.2 пословно (кроме подстановок и строк, которые зависят от данных сделки).
В №2–№4 распределение без депозитов ещё под условием — по просьбе.

## AGENTS из формы + способ оплаты обычным шрифтом (06.10)

AGENTS: при создании MOU / Commission Agreement новые агентства и новые представители сохраняются во
вкладку (`syncAgents` в lib/google/sheets.js, тест test/agents-sync.test.js): строка = агентство +
представитель; поправленные в форме лицензия/адрес — во всех строках агентства, должность — в строке
представителя; пустые поля формы таблицу не затирают; сбой записи договор не отменяет. В форме у
Representative — список представителей выбранного агентства, выбор подставляет должность.

«Manager's Cheque or Cash» в Payment Table — обычным шрифтом и без точки (код + `fix-payment-text-plain.mjs`
для №1–№6). Правило Даши: правки оформления применять к шаблонам №1–№6.

## Пустые строки без депозитов + форма (06.10)

Тесты Off-plan (обе стороны с чеком / только Покупатель / никто) показали: без депозитов пропадали пустые
строки перед статьёй после Article 5 и после статьи о дефолте Продавца, и перед «The … shall have no
further claim». Причина — движок, вырезая блок, забирает соседнюю пустую строку, а после статьи о депозите
и статьи о возврате депозита отступ был интервалом абзаца. `scripts/fix-nodeposit-gaps.mjs` (входит в
apply-layout-fixes): пустая строка перед такой статьёй — отдельным абзацем (его и забирает блок), перед
«The … shall have no further claim» и «Upon … Default» — перенос \v. Применено к №1–№4, проверка:
check-scenarios (теперь ловит и ПРОПАВШУЮ пустую строку — сравнение с «всё включено») + check-combinations.
В №2/№4 в статье о дефолте Продавца пустых строк не было вовсе — добавлены, как в №1.

Форма: на плашках разделов считаются все поля, которые печатаются в MOU — Title Deed, парковка, Project No.
(готовые), реквизиты включённых агентств (Representative, License, Address). Блок Signatures убран, дата
подписи в договор не идёт (слово «Date:» в подписях остаётся пустым).

## Правки оформления №1 — во всех шаблонах MOU (05.10)

По просьбе Даши правки 1–10 из списка за 05.10 применены ко всем шаблонам MOU: №1, №2, №3, №4,
№5, №6, C3-1, C3-2 (1.2 убран из выбора — не трогали; Commission Agreement — другие правки).
Один прогон: `node scripts/apply-layout-fixes.mjs <id>` — поля 2,2 / 2,05 см и текст по ширине до 16,75 см
(в №2–№6 и C3 поля были 2,54 / 2,54), отступы ячеек 2 pt, колонки Payment Table как у Property Details,
колонтитул по краю текста, жирные номера в «Article N», пустые строки в статьях о дефолте,
«не отрывать от следующего». В старых шаблонах (№5, №6, C3) условий {{#if}} нет — правки 9–10 там не нужны.
Проверка: на копиях; №2–№4 — check-scenarios + check-combinations (0 замечаний), №5, №6, C3 — PDF
(ни одна страница не кончается заголовком). check-scenarios теперь ловит «пустая строка + \v» как две
пустые подряд (так поймали лишний перенос в №2 и №4 — там перед «This amount…» уже была пустая строка).
В №2 текст статей о дефолте ещё старый (не редакция №1): лишние пустые строки внутри списка a)/b),
нет пустой строки перед «Upon Seller Default» — поправить, когда Даша дойдёт до №2.

## Ничего не висит внизу страницы в одиночку (05.10)

Баги: «SELLER’S AGENCY» оставался внизу 6-й страницы без своих Company/Date/Stamp;
«WHEREAS:» и «Article 11» висели одни внизу страницы. Скрипт
`scripts/fix-keep-with-next.mjs <id>` (повторный запуск ничего не меняет), применён к №1:
- заголовки (Article …, BY AND BETWEEN:, AND, WHEREAS:) и абзацы, которые кончаются «:»
  (28 шт.), плюс пустая строка сразу после них — «Не отрывать от следующего»;
- от последнего Article (Electronic signature) до конца — «Не отрывать от следующего» и
  «Не разрывать абзац»: Article 17 переносится вместе со всеми подписями.
Внизу предыдущей страницы остаётся пустое место — раздвинуть текст по высоте Google Docs
не умеет. Проверено PDF на копии, 4 сценария: ни одна страница не кончается заголовком.
Если Даша правит шаблон и добавляет новый Article — прогнать скрипт ещё раз.
Остальные шаблоны — по просьбе Даши.

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
  жирный №1 сверен с docx (`scripts/sync-bold-from-docx.mjs`, 55 слов). «Company Stamp» убран из колонтитула и в №2–№4.
- 04.10: перед «THE SELLER» во всех шаблонах (1–6, C3, 1.2) ровно одна пустая строка без интервалов, в №1 убран
  интервал после «Article 9» (`scripts/fix-signature-gap.mjs`, повторный запуск безопасен).
- 04.10: движок — разделитель у удалённого блока ищется с пропуском уже удаляемых абзацев (ст.6: депозит
  только у Покупателя больше не оставляет пустую строку перед «Upon successful completion»). №1: пустая
  строка перед ст.4 заменена интервалом над заголовком (`scripts/fix-article4-gap.mjs`). check-combinations
  под новые формулировки; №1 и №2 — 9216 комбинаций без замечаний.

- 05.10: абзац «The Seller shall cooperate with the Buyer’s financing bank…» оставлен только в №2 и C3-2,
  из №4 и №6 удалён вместе с пустой строкой перед ним (по решению Даши).

- 05.10: списки — национальности Russian Federation / UAE / Kazakhstan первыми, агентства — PRIME BRIDGE первым,
  остальное по алфавиту; cleanAgent распознаёт перепутанные Position/Representative (в AGENTS 11 строк поправлены);
  дата чека в договоре dd.mm.yyyy; подписи нескольких сторон — без пустого абзаца между ними; таблица ст.4 №1–№4 —
  поля ячеек 5 пт, абзацы без отступа, строки без минимальной высоты (`scripts/fix-payment-table-indent.mjs`).

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
- Подписи (04.10): «Name: …   Signature: ____» и «Date:»; у компании Name — должность и представитель («Manager Mikhail Slobodchikov») и строка «Company Stamp».
- Вёрстка (`patch-commission-layout.mjs`): дата соглашения в шапке ({{ca_date_header}}, «3 October, 2026»),
  пустые строки перед п.3 и п.4, заголовки держатся со следующим абзацем.
- Ждём текст для договора только между агентствами (до трёх) — шаблона нет.

## Отложено: Property с платформы (03.10)

Идея — по номеру юнита подтягивать в Property данные с app.primebridge.estate (проект, тип, спальни,
площадь, локация, при наличии цены). API у платформы нет, данные только со страниц после входа; учётку
блокируют за частые входы. Варианты: через AutoPost (`primebridge-estate/pb-autopost`, `lib/platform.ts`)
или напрямую с отдельной учёткой в env Vercel. Для работы нужны: доступ к app.primebridge.estate в сети
облачной среды и доступ сессии к репозиторию pb-autopost. Title Deed, аренда, Additional Information — руками.

05.10 попробовали: поиск юнита в Property по базе IT-команды (Neon, `UNITS_DB_URL` из Vercel AutoPost,
только чтение) — подставлял Unit Number, Property Type, Bedrooms, Area, Parking. По просьбе Даши
откатили в тот же день (revert 7b13d2f, aad1fa7), `UNITS_DB_URL` с Vercel mou-builder убрана.
Код можно вернуть из этих коммитов.

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

## №5 Ready mortgage to cash

С 06.10 — пересобран по чистовику (см. «Пересборка №2–№6»), вписан в реестр. Прежний черновик
`1-zyRMRg_qjbjRt5TtEBZW4gZaSkdStLHZjaRj48gvoc` и пакет `1SdMGVK92gK0cylUTl1Pf_lyBlhtFUbnG` — по старой
редакции, устарели.

## Папки с тестовыми договорами

Договоры для проверки глазами, сгенерированы тем же кодом, что и сайт, и сверены
с шаблоном слово в слово (`scripts/verify-batch.mjs`).

- №1 off-plan, 16 договоров (07.10): `1SQjNjY_GQwtoGA5v3eXxQ9GETKzLQ7xC`
- №2 off-plan ипотека, новый шаблон, 16 договоров (07.10): `1ZkJMYw1C2yZr7NElKQj-9M4VwSzrdWTj`
- устарели (переименованы «УСТАРЕЛО — …»): №1 `1dlghjYRbyV86tPdpSF-D5naSYpoHyOzY`, №2 `1LULl4rudx4ceyH4XvsZ3vnIF1ithM8CE`
- №3 Ready cash to cash, 18 договоров: `1lGuaPXKl2cE0HvzJCTk7bS2GxvqSwnJB`
- №4 Ready cash to mortgage, 18 договоров: `1TSfJWJYJLvpUtdw6Tf_tncpY7XwFW2C4` (сверены с боевым)

Устаревшие пакеты переименовываются в «УСТАРЕЛО — …», а не удаляются. Пакеты №2–№4 выше собраны
по прежним шаблонам (до пересборки 06.10).

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

Off-plan (сейчас):
1. Ответы Даши по №2 (Off-plan mortgage): «Manager's Cheque or Cheque» в строке суммы Продавцу.
   (07.10, решение Даши: в №2 строка «ADM Verification Certificate: AED 925.75 / to be paid by the Buyer
   to DMT ADREC – REVENUE ACCOU upon request by Bank transfer or Card» — как в чистовике, не Valuation.) В №2 по его чистовику «any third-party reason» с дефисом и без «or»
   перед ним — выровнять с №1, если Даша скажет.
2. ✅ 07.10 ветка залита в `main` (9306447): на сайте новый №2, закреплённая строка разделов, галочка
   Emirates ID, склеенные заголовки подписей. Осталось: проверить №2 на проде (Load Draft → Create MOU),
   тестовый договор — в корзину; прежний №2 переименовать в «УСТАРЕЛО — …», у нового убрать «— НОВЫЙ (…)».

Готовые объекты (потом):
3. Отложенные вопросы, вписать №3–№6 в реестр (записи выше), переименовать файлы, проверка на проде.
4. C3-1 и C3-2 — нужен блок стороны-юрлица, его ещё нет.

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
