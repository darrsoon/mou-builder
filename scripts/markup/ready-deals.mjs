import { OFFPLAN_MORTGAGE, MORTGAGE_ARTICLE_REFS } from "./offplan-deals.mjs";

// Значения демо-сделок готовых шаблонов для разметки: №3 (cash to cash), №4 (cash to mortgage)
// и №5 (mortgage to cash).
// Правки собираются тем же buildEdits, что и off-plan: документы почти совпадают,
// отличается платёжная таблица и статья про состояние объекта.

export const ARTICLES_READY_CASH = [
  [1, "article_sale_offer_number"],
  [2, "article_effective_date_number"],
  [3, "article_property_details_number"],
  [4, "article_payment_table_number"],
  [5, "article_reservation_period_number"],
  [6, "article_security_deposit_number"],
  [7, "article_buyer_default_number"],
  [8, "article_seller_default_number"],
  [9, "article_deposit_release_number"],
  [10, "article_buyer_own_funds_number"],
  [11, "article_seller_outstanding_charges_number"],
  [12, "article_vacant_on_transfer_number"],
  [13, "article_property_hold_number"],
  [14, "article_developer_approval_number"],
  [15, "article_aml_number"],
  [16, "article_amicable_dispute_number"],
  [17, "article_entire_agreement_number"],
  [18, "article_electronic_signature_number"],
];

const VACANT = "The Seller confirms that the Property shall be vacant on the Transfer Date";
const RENTED = "The Seller confirms that the Property is currently leased at a rent of";

// Демо-сделка у готовых шаблонов одна и та же: объект, суммы, номер проекта
const READY_DEMO = {
  agreementDate: "14/04/2026",
  agreementDateLong: "April 14, 2026",
  location: "Saadiyat Island, Abu Dhabi, UAE",
  bedrooms: "2BHK+Maid",
  area: "140.55",
  unitNumber: "201",
  typeOfAreaValue: "Residential - Household Living",
  titleDeedValue: "2026/0000",
  parkingLabel: "Car Parking Spaces:",
  hasAdditionalInformation: false,
  // в готовом объекте есть номер проекта, вводится руками (Алина, 06.09.2026)
  propertyExtra: [
    { find: "2023/278930", replace: "{{project_number}}", note: "номер проекта" },
  ],
  // платёжная таблица: застройщику платить нечего, цены по SPA нет
  priceValue: "AED 5,280,135.00",
  hasOriginalPrice: false,
  hasDeveloperBalanceRow: false,
  hasThresholdRow: false,
  amountToSellerWithin: "to be paid by the Buyer to the Seller",
  // ADM-строки идут в feeEdits, отдельного блока не нужно
  admEdits: [],
  // определение NOC fee в готовых шаблонах своё и живёт всегда: NOC-сборы есть в каждой сделке
  hasNocDefinition: false,
  buyerLd80: "AED 263,000",
  buyerLd20: "AED 65,000",
  sellerLd80: "AED 263,600",
  sellerLd20: "AED 65,900",
  disputeCopyTail: ", with a copy of such email or letter delivered to Seller’s agent and Buyer’s agent for their reference",
  article5RefCount: 2,
};

// ст. про состояние объекта: в документе оба варианта подряд — свободен и сдан в аренду.
// Показываем ровно один, второй абзац удаляется целиком.
const TENANCY_EDITS = [
  { find: VACANT, insertBefore: "{{#if !property_rented}}", note: "аренда: открыть вариант «свободен»" },
  { find: "furnishings existing at the time of viewing, unless otherwise agreed in writing.", nth: 0,
    replace: "furnishings existing at the time of viewing, unless otherwise agreed in writing.{{/if}}",
    note: "аренда: закрыть вариант «свободен»" },
  { find: RENTED, insertBefore: "{{#if property_rented}}", note: "аренда: открыть вариант «сдан»" },
  { find: "AED 150,000.00", replace: "AED {{annual_rent}}", note: "годовая аренда" },
  { find: "(One hundred… dirhams)", replace: "({{annual_rent_words}})", note: "аренда прописью" },
  { find: "12 December 2027", replace: "{{tenancy_end_date}}", note: "срок договора аренды" },
  { find: "the Seller shall transfer an equivalent amount to the Buyer on the Transfer Date.",
    replace: "the Seller shall transfer an equivalent amount to the Buyer on the Transfer Date.{{/if}}",
    note: "аренда: закрыть вариант «сдан»" },
];

export const READY_CASH = {
  ...READY_DEMO,
  projectName: "the Source",
  amountToSellerText: "Manager’s Cheque",
  // вместо Transfer Fee — два NOC-сбора и три строки ADM
  feeEdits: [
    { find: "AED 2,750.00", replace: "AED {{developer_noc_fee}}", note: "Developer NOC Fee" },
    { find: "ALDAR DEVELOPMENT L.L.C – O.P.C", replace: "{{developer_name}}", within: "{{developer_noc_fee}}",
      note: "получатель Developer NOC Fee" },
    { find: "AED 1,050.00", replace: "AED {{community_noc_fee}}", note: "Community NOC Fee" },
    { find: "ALDAR PROPERTIES PJSC", replace: "{{developer_legal_name}}", within: "{{community_noc_fee}}",
      note: "получатель Community NOC Fee" },
    { find: "AED 106,521.70", replace: "AED {{adm_fee}}", note: "ADM Fee" },
    { find: "AED 919.00", replace: "AED {{adm_electronic_fee}}", note: "ADM Electronic Fee" },
    { find: "AED 1,037.00", replace: "AED {{adm_valuation_fee}}", note: "ADM Valuation Certificate" },
  ],
  // в определениях застройщик другой; в таблице он же станет {{developer_name}}
  developerDefinitionName: "NATION WIDE HOLDING - L.L.C",
  // в ст.7 между абзацами пустая строка и нет пробела после точки — свой вариант правки
  noDepositLdEdits: [
    { find: "{{buyer_liquidated_damages_amount}} as liquidated damages, being an amount equal to the Security Deposit, "
        + "which the Parties agree is not a penalty.\n\nThis amount shall be distributed as follows:",
      replace: "{{buyer_liquidated_damages_amount}} as liquidated damages{{#if any_deposit}}, being an amount equal to the Security Deposit{{/if}}, "
        + "which the Parties agree is not a penalty.\n{{#if any_deposit}}\nThis amount shall be distributed as follows:{{/if}}",
      note: "ст.7 без депозитов" },
    { find: "{{seller_liquidated_damages_amount}} as liquidated damages, being an amount equal to the Security Deposit, "
        + "which the Parties agree is not a penalty.\nThis amount shall be distributed as follows:",
      replace: "{{seller_liquidated_damages_amount}} as liquidated damages{{#if any_deposit}}, being an amount equal to the Security Deposit{{/if}}, "
        + "which the Parties agree is not a penalty.\n{{#if any_deposit}}This amount shall be distributed as follows:{{/if}}",
      note: "ст.8 без депозитов" },
  ],

  articles: ARTICLES_READY_CASH,
  agencyMarkersAfterPrevious: false,

  pre: [
    // дата в шапке прижата табами: плейсхолдер длиннее и переносился бы на вторую строку
    { find: "\t\t\t\t\t\t\t\t    \t", replace: "", note: "шапка: убрать табы перед датой" },
    // разделитель между двумя вариантами абзаца Покупателя в ст.6 — как «_____» в №2
    { find: "___", replace: "", nth: 0, note: "ст.6: убрать разделитель «___»" },
    // скобка в строке ADM Fee не закрывалась — приводим к виду №1
    { find: "or as per ADM valuation (whatever comes higher) to be paid",
      replace: "or as per ADM valuation, whatever comes higher) to be paid", note: "ст.4: скобка в ADM Fee" },
    // ст.8: разделитель «—-» и хвост абзаца оставляли по мягкому переносу,
    // из-за них в договоре появлялись пустые строки вокруг фразы о дефолте Продавца
    { find: "—-\u000bUpon Seller Default", replace: "—-Upon Seller Default", note: "ст.8: перенос после разделителя" },
    { find: "not a penalty. \u000b\nThis amount shall be distributed",
      replace: "not a penalty.\nThis amount shall be distributed", note: "ст.8: перенос в конце абзаца" },
    // двойные пробелы исходника
    { find: "REVENUE ACCOU  on the Transfer Date by a Manager", replace: "REVENUE ACCOU on the Transfer Date by a Manager",
      note: "двойной пробел, ADM Fee" },
    { find: "REVENUE ACCOU  on the Transfer Date by Manager", replace: "REVENUE ACCOU on the Transfer Date by Manager",
      note: "двойной пробел, ADM Electronic Fee" },
  ],

  // ст.12 — свободен или сдан в аренду
  extra: TENANCY_EDITS,
};

// ═══ №4 Ready cash to mortgage — 19 статей
// Статьи 1–12 и 14–19 устроены как в ипотечном №2 (дефолты, отказ банка, оценка),
// блок объекта и сборов — как в №3, статья 13 про аренду — тоже из №3.
export const ARTICLES_READY_MORTGAGE = [
  [1, "article_sale_offer_number"],
  [2, "article_effective_date_number"],
  [3, "article_property_details_number"],
  [4, "article_payment_table_number"],
  [5, "article_reservation_period_number"],
  [6, "article_security_deposit_number"],
  [7, "article_buyer_default_number"],
  [8, "article_seller_default_number"],
  [9, "article_deposit_release_number"],
  [10, "article_mortgage_approval_number"],
  [11, "article_bank_valuation_number"],
  [12, "article_seller_outstanding_charges_number"],
  [13, "article_vacant_on_transfer_number"],
  [14, "article_property_hold_number"],
  [15, "article_developer_approval_number"],
  [16, "article_aml_number"],
  [17, "article_amicable_dispute_number"],
  [18, "article_entire_agreement_number"],
  [19, "article_electronic_signature_number"],
];

export const READY_MORTGAGE = {
  ...READY_DEMO,
  projectName: "C3 Garden",
  // демо-Покупатель в №4 — без доверенности
  buyerBlockText: "Mr(s). Name Surname, nationality: United Arab Emirates, holder of Passport number: 0000000, "
    + "holder of EID Number 784-1900-0000000-0, Ownership rights \u2013 100%",
  // «только чек», как в №2: текст способа оплаты не трогаем
  amountToSellerText: null,
  // суммы распределения депозита в ст.7–8 — как в исходнике №2
  buyerLd80: "AED 422,410.40",
  buyerLd20: "AED 105,602.60",
  sellerLd80: "AED 422,410.40",
  sellerLd20: "AED 105,602.60",
  feeEdits: [
    { find: "AED 2,750.00", replace: "AED {{developer_noc_fee}}", note: "Developer NOC Fee" },
    { find: "ALDAR DEVELOPMENT L.L.C – O.P.C", replace: "{{developer_name}}", within: "{{developer_noc_fee}}",
      note: "получатель Developer NOC Fee" },
    { find: "AED 1,050.00", replace: "AED {{community_noc_fee}}", note: "Community NOC Fee" },
    { find: "ALDAR PROPERTIES PJSC", replace: "{{developer_legal_name}}", within: "{{community_noc_fee}}",
      note: "получатель Community NOC Fee" },
    { find: "AED 106,521.70", replace: "AED {{adm_fee}}", note: "ADM Fee" },
    // суммы из исходника №4, в форме подставляются по умолчанию и правятся (Алина, 13.09.2026)
    { find: "AED 1,392.00", replace: "AED {{adm_electronic_fee}}", note: "ADM Electronic Fee" },
    { find: "AED 1,037.00", replace: "AED {{adm_valuation_fee}}", note: "ADM Valuation Certificate" },
    { find: "AED 103.50", replace: "AED {{unit_verification_fee}}", note: "Unit Verification / Search Certificate" },
  ],
  article78: "mortgage",
  agencyMarkersAfterPrevious: true,
  articles: ARTICLES_READY_MORTGAGE,

  pre: [
    // дата в шапке прижата табами (в №4 на один таб больше, чем в №3)
    { find: "\t\t\t\t\t\t\t\t    \t\t", replace: "", note: "шапка: убрать табы перед датой" },
    // разделитель между двумя вариантами абзаца Покупателя в ст.6
    { find: "_______", replace: "", note: "ст.6: убрать разделитель «_______»" },
    // ст.8: в №4, в отличие от №2, обе фразы про распределение уже стоят через разделитель
    // «_____». Приводим к виду исходника №2 — дальше ипотечные правки ст.7–8 возвращают
    // вторую фразу под условием seller_deposit, итоговый текст тот же, что в №2.
    { find: "This amount shall be distributed as follows:\n_____\nThe forfeited Security Deposit shall be distributed as follows:\u000ba) ",
      replace: "This amount shall be distributed as follows:\na) ", note: "ст.8: к раскладке №2" },
    // ссылки на ипотечные статьи: при выключенных депозитах нумерация сдвигается
    { find: "described in Articles 10 and 11", replace: MORTGAGE_ARTICLE_REFS, nth: 0, note: "ст.7 ссылка на ст.10–11" },
    { find: "described in Articles 10 and 11", replace: MORTGAGE_ARTICLE_REFS, nth: 0, note: "ст.8 ссылка на ст.10–11" },
    { find: "specified in Article 5 of this MOU",
      replace: "specified in Article {{article_reservation_period_number}} of this MOU", note: "ст.10 ссылка на ст.5" },
    // заголовок ст.10 приклеен к тексту мягким переносом — отдельным абзацем, как в №2
    { find: "Article 10\u000b", replace: "Article 10\n", note: "ст.10: заголовок отдельным абзацем" },
    // скобка в строке ADM Fee не закрывалась — приводим к виду №1
    { find: "or as per ADM valuation (whatever comes higher) to be paid",
      replace: "or as per ADM valuation, whatever comes higher) to be paid", note: "ст.4: скобка в ADM Fee" },
    // двойные пробелы исходника
    { find: "REVENUE ACCOU  on the Transfer Date by a Manager", replace: "REVENUE ACCOU on the Transfer Date by a Manager",
      note: "двойной пробел, ADM Fee" },
    { find: "REVENUE ACCOU  on the Transfer Date by Manager", replace: "REVENUE ACCOU on the Transfer Date by Manager",
      note: "двойной пробел, ADM Electronic Fee" },
    // в конце тела после подписей три пустых абзаца (в №3 их нет): при подписях у края
    // страницы в договоре появлялся бы пустой последний лист. Последний абзац тела
    // удалить нельзя — оставляем его одного
    { find: "Company Stamp\n\n\n", replace: "Company Stamp\n", note: "пустые абзацы в конце документа" },
    // Миша, 04.09.2026 для №2, Алина 13.09.2026 — так же в №4: важен факт пре-одобрения
    { find: "obtained Mortgage Pre-Approval for an amount equal to the agreed Selling Price and that",
      replace: "obtained Mortgage Pre-Approval and that", note: "ст.10: сумма пре-одобрения" },
  ],

  extra: [
    ...OFFPLAN_MORTGAGE.extra,
    ...TENANCY_EDITS,
  ],
};

// ═══ №5 Ready mortgage to cash — 18 статей
// Документ — №3 с ипотекой Продавца: строка Mortgage Release Fee, часть цены платится
// банку Продавца по Liability Letter, в ст.10 — ипотека Продавца и два варианта
// источника денег Покупателя.
export const ARTICLES_READY_MORTGAGE_CASH = ARTICLES_READY_CASH.map(([num, key]) =>
  [num, num === 10 ? "article_seller_mortgage_number" : key]);

export const READY_MORTGAGE_CASH = {
  ...READY_CASH,
  // застройщик в определениях тот же, что в таблице
  developerDefinitionName: undefined,
  // после суммы Продавцу стоит приписка про Liability Letter: плейсхолдер способа
  // оплаты дал бы «Manager's Cheque. (The exact…» — текст не трогаем, в готовом
  // объекте способ всё равно один (Алина, 06.09.2026)
  amountToSellerText: null,
  feeEdits: [
    ...READY_CASH.feeEdits,
    // сумма из исходника, в форме подставляется по умолчанию и правится (Алина, 13.09.2026)
    { find: "AED 960.00", replace: "AED {{mortgage_release_fee}}", note: "Mortgage Release Fee" },
  ],
  // в №5 в итоговой фразе нет «the amount payable to the Seller»: без комиссий
  // остаётся одна Selling Price, глагол — в единственном числе
  finalBindingEdit: {
    find: "The Selling Price and the Agency Fee set out in the Payment Table are final and binding",
    replace: "The Selling Price{{#if any_agent_fee}} and the Agency Fee{{/if}} set out in the Payment Table "
      + "{{#if any_agent_fee}}are{{/if}}{{#if !any_agent_fee}}is{{/if}} final and binding",
    note: "ст.4 итоговая строка",
  },
  articles: ARTICLES_READY_MORTGAGE_CASH,

  pre: [
    // дата в шапке прижата табами, как в №3
    { find: "\t\t\t\t\t\t\t\t    \t", replace: "", note: "шапка: убрать табы перед датой" },
    // скобка в строке ADM Fee не закрывалась — приводим к виду №1
    { find: "or as per ADM valuation (whatever comes higher) to be paid",
      replace: "or as per ADM valuation, whatever comes higher) to be paid", note: "ст.4: скобка в ADM Fee" },
    // ст.8: мягкие переносы вокруг фразы о дефолте Продавца, как в №3
    { find: "—-\u000bUpon Seller Default", replace: "—-Upon Seller Default", note: "ст.8: перенос после разделителя" },
    { find: "not a penalty. \u000b\nThis amount shall be distributed",
      replace: "not a penalty.\nThis amount shall be distributed", note: "ст.8: перенос в конце абзаца" },
    // двойные пробелы исходника
    { find: "REVENUE ACCOU  on the Transfer Date by a Manager", replace: "REVENUE ACCOU on the Transfer Date by a Manager",
      note: "двойной пробел, ADM Fee" },
    { find: "Manager’s Cheque  (The exact amounts", replace: "Manager’s Cheque (The exact amounts",
      note: "двойной пробел, сумма Продавцу" },
    { find: "the Seller’s Bank  or any governmental", replace: "the Seller’s Bank or any governmental",
      note: "двойной пробел, ст.5" },
    { find: "the Buyer’s own funds  and is not conditional", replace: "the Buyer’s own funds and is not conditional",
      note: "двойной пробел, ст.10" },
  ],

  extra: [
    ...TENANCY_EDITS,
    // ст.10: банк Продавца — поле формы со списком банков (Алина, 13.09.2026)
    { find: "Dubai Islamic Bank", replace: "{{seller_bank_name}}", note: "банк Продавца" },
    // ст.10: Personal Cheque держат по правилу депозитных чеков (Миша, 30.08.2026; Алина, 13.09.2026):
    // агентство Продавца, без него — агентство Покупателя, без агентств — сам Покупатель
    { find: "to be held by the Seller’s Agency and returned to the Seller",
      replace: "to be held by {{#if seller_agent}}the Seller’s Agency{{/if}}{{#if !seller_agent}}{{#if buyer_agent}}the Buyer’s Agency{{/if}}"
        + "{{#if !buyer_agent}}the Buyer{{/if}}{{/if}} and returned to the Seller",
      note: "ст.10: кто держит Personal Cheque" },
    { find: "the Buyer may collect this Personal Cheque from the Seller’s Agent and present it for payment.",
      replace: "the Buyer may {{#if any_agent}}collect this Personal Cheque from {{#if seller_agent}}the Seller’s Agent{{/if}}"
        + "{{#if !seller_agent}}the Buyer’s Agent{{/if}} and present it{{/if}}{{#if !any_agent}}present this Personal Cheque{{/if}} for payment.",
      note: "ст.10: у кого Покупатель забирает Personal Cheque" },
    // ст.10: деньги Покупателя — свои или с кредитом / Equity Release, по умолчанию свои
    // (комментарии Даши, решение Алины 13.09.2026). Разделитель «___» уходит.
    { find: "The Buyer confirms that the purchase of the Property is made solely", insertBefore: "{{#if buyer_own_funds}}",
      note: "ст.10: открыть «свои средства»" },
    { find: "shall constitute Default under this MOU.\n___\nThe Buyer confirms that the purchase of the Property may be financed",
      replace: "shall constitute Default under this MOU.{{/if}}\n{{#if !buyer_own_funds}}The Buyer confirms that the purchase of the Property may be financed",
      note: "ст.10: закрыть «свои средства», открыть «с кредитом», убрать «___»" },
    { find: "constitute a valid reason for failure to complete the transfer.",
      replace: "constitute a valid reason for failure to complete the transfer.{{/if}}", note: "ст.10: закрыть «с кредитом»" },
  ],
};

// ═══ Чистовики Даши (docx 03.10, Google-копии «ЧИСТОВИК N…» в папке MOU): разметка
// заново поверх новой редакции. Отличия от прежних исходников — образцы значений
// в абзаце чека Покупателя и написание отдельных подписей.
// статьи о дефолте после разметки переносятся из №1 (copy-default-articles), не размечаем
const CLEAN_ARTICLE78 = { article78: "copy" };
const CLEAN_ZERO_CHEQUE = { buyerChequeAmount: "AED 000,000", buyerChequeNumber: "000000", buyerChequeDate: "00.00.2026" };

export const READY_MORTGAGE_CASH_CLEAN = {
  ...READY_MORTGAGE_CASH,
  ...CLEAN_ZERO_CHEQUE,
  projectName: "The Source",
  pre: [
    ...READY_MORTGAGE_CASH.pre,
    // в чистовике у подписи агентства Продавца стоит дата Покупателя
    { find: "Date: {{buyer_signature_date}}", replace: "Date: {{seller_signature_date}}", within: "SELLER’S AGENCY",
      note: "подпись агентства Продавца: своя дата" },
  ],
};

export const READY_CASH_CLEAN = {
  ...READY_CASH,
  ...CLEAN_ARTICLE78,
  projectName: "The Source",
  developerDefinitionName: "ALDAR DEVELOPMENT L.L.C",
  securityDepositLabel: "Security deposit:",
  pre: [
    ...READY_CASH.pre,
    // в чистовике №3 в строке Security deposit по ошибке стоит текст строки Agency Fee —
    // ставим текст-образец депозита, как в остальных чистовиках (строку всё равно собирает движок)
    { find: "AED 00,000.00 (VAT inclusive) /  to be paid by the Buyer to the Buyer’s Agency on the Transfer Date", nth: 0,
      replace: "AED 000,000.00 / (10% of the Selling Price, Security Deposit cheque issued by the Buyer in favour of the Seller)",
      note: "строка депозита Покупателя вместо копии Agency Fee" },
    { find: "AED 00,000.00 (VAT inclusive) / to be paid by the Seller to the Seller’s Agency on the Transfer Date", nth: 0,
      replace: "AED 000,000.00 / (10% of the Selling Price, Security Deposit cheque issued by the Seller in favour of the Buyer)",
      note: "строка депозита Продавца вместо копии Agency Fee" },
    // разделители «____» вокруг абзацев Продавца в ст.6 — пустой строкой, как в чистовике №5
    { find: "MOU.\n____\nSimilarly", replace: "MOU.\n\nSimilarly", note: "ст.6: разделитель перед Продавцом" },
    { find: "MOU.\n____\nSimilarly", replace: "MOU.\n\nSimilarly", note: "ст.6: разделитель между абзацами Продавца" },
  ],
};

export const READY_MORTGAGE_CLEAN = {
  ...READY_MORTGAGE,
  ...CLEAN_ARTICLE78,
  // демо-Покупатель в чистовике — тот же, что Продавец (с доверенностью)
  buyerBlockText: undefined,
  pre: READY_MORTGAGE.pre.filter((e) => e.note !== "ст.8: к раскладке №2"),
};

// Абзац «The Seller shall cooperate with the Buyer’s financing bank…» остаётся только в №2 и C3-2,
// из №4 и №6 убран вместе с пустой строкой после него (Даша, 05.10.2026) — чистовики 03.10 его ещё содержат
const REMOVE_COOPERATE = {
  find: "The Seller shall cooperate with the Buyer’s financing bank and provide, in a timely manner, all documents "
    + "required for mortgage approval and registration at the Abu Dhabi Real Estate Centre.\n\n",
  replace: "", note: "убрать абзац о содействии банку Покупателя (решение 05.10)",
};
READY_MORTGAGE_CLEAN.pre = [...READY_MORTGAGE_CLEAN.pre, REMOVE_COOPERATE];

// ═══ №6 Ready mortgage to mortgage — 20 статей (чистовик 03.10, разметки раньше не было)
// Документ — №5 (ипотека Продавца в ст.10: Liability Letter, Personal Cheque, банк Продавца,
// Mortgage Release Fee) плюс ипотека Покупателя из №4: ст.11 одобрение банка, ст.12 оценка.
// Вариантов денег Покупателя (own funds / Personal Loan) в ст.10 нет.
export const ARTICLES_READY_MORTGAGE_MORTGAGE = [
  [1, "article_sale_offer_number"],
  [2, "article_effective_date_number"],
  [3, "article_property_details_number"],
  [4, "article_payment_table_number"],
  [5, "article_reservation_period_number"],
  [6, "article_security_deposit_number"],
  [7, "article_buyer_default_number"],
  [8, "article_seller_default_number"],
  [9, "article_deposit_release_number"],
  [10, "article_seller_mortgage_number"],
  [11, "article_mortgage_approval_number"],
  [12, "article_bank_valuation_number"],
  [13, "article_seller_outstanding_charges_number"],
  [14, "article_vacant_on_transfer_number"],
  [15, "article_property_hold_number"],
  [16, "article_developer_approval_number"],
  [17, "article_aml_number"],
  [18, "article_amicable_dispute_number"],
  [19, "article_entire_agreement_number"],
  [20, "article_electronic_signature_number"],
];

const PREAPPROVAL_EDIT = READY_MORTGAGE.pre.find((e) => e.note === "ст.10: сумма пре-одобрения");
const pick = (list, notes) => notes.map((n) => {
  const e = list.find((x) => x.note === n);
  if (!e) throw new Error(`нет правки «${n}»`);
  return e;
});

export const READY_MORTGAGE_MORTGAGE_CLEAN = {
  ...READY_MORTGAGE_CASH_CLEAN,
  ...CLEAN_ARTICLE78,
  articles: ARTICLES_READY_MORTGAGE_MORTGAGE,
  feeEdits: READY_MORTGAGE_CASH.feeEdits.map((e) => (e.note === "ADM Electronic Fee"
    ? { ...e, find: "AED 1,392.00" } : e)),
  pre: [
    ...pick(READY_MORTGAGE_CASH.pre, [
      "шапка: убрать табы перед датой", "ст.4: скобка в ADM Fee", "двойной пробел, ADM Fee",
      "двойной пробел, сумма Продавцу", "двойной пробел, ст.5",
    ]),
    // в чистовике №6 скрипт Agency задел плейсхолдеры подписей агентств
    { find: "{{seller_Agency_name}}", replace: "{{seller_agent_name}}", note: "подписи: плейсхолдер агентства Продавца" },
    { find: "{{buyer_Agency_name}}", replace: "{{buyer_agent_name}}", note: "подписи: плейсхолдер агентства Покупателя" },
    { find: "Date: {{buyer_signature_date}}", replace: "Date: {{seller_signature_date}}", within: "SELLER’S AGENCY",
      note: "подпись агентства Продавца: своя дата" },
    // ссылки на ипотечные статьи в ст.7–8: при выключенных депозитах нумерация сдвигается
    { find: "described in Articles 11 and 12", replace: MORTGAGE_ARTICLE_REFS, nth: 0, note: "ст.7 ссылка на ст.11–12" },
    { find: "described in Articles 11 and 12", replace: MORTGAGE_ARTICLE_REFS, nth: 0, note: "ст.8 ссылка на ст.11–12" },
    { find: "specified in Article 5 of this MOU",
      replace: "specified in Article {{article_reservation_period_number}} of this MOU", note: "ст.11 ссылка на ст.5" },
    // заголовок ст.11 приклеен к тексту мягким переносом — отдельным абзацем, как в №4
    { find: "Article 11\u000b", replace: "Article 11\n", note: "ст.11: заголовок отдельным абзацем" },
    PREAPPROVAL_EDIT,
    REMOVE_COOPERATE,
  ],
  extra: [
    ...TENANCY_EDITS,
    ...pick(READY_MORTGAGE_CASH.extra, [
      "банк Продавца", "ст.10: кто держит Personal Cheque", "ст.10: у кого Покупатель забирает Personal Cheque",
    ]),
    // ст.11–12: возврат депозита — только когда депозит Покупателя есть (как в №4)
    ...pick(OFFPLAN_MORTGAGE.extra, ["ст.10 депозит под условием", "ст.11 депозит под условием"]),
  ],
};
