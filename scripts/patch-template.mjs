// Точечные правки уже размеченного шаблона: node scripts/patch-template.mjs <documentId> <ключ>
// Разметку целиком повторно не запустить (она не идемпотентна), а отдельные
// согласованные правки внести надо. Каждая правка описана здесь и применяется один раз.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";

const PATCHES = {
  // 05.09: в строке ADM Fee не закрывалась скобка: «(2% from the Selling Price or
  // as per ADM valuation (whatever comes higher) to be paid…». В №1 скобка обнимает
  // способ расчёта и закрывается перед «to be paid» — приводим к тому же виду,
  // внутренняя пара скобок становится запятой
  "adm-fee-parenthesis": [
    { find: "or as per ADM valuation (whatever comes higher) to be paid",
      replace: "or as per ADM valuation, whatever comes higher) to be paid",
      note: "ст.4: скобка в строке ADM Fee" },
  ],
  // 06.09: в ст.8 абзац о дефолте Продавца начинался и кончался мягким переносом —
  // остаток черновикового разделителя «—-». В договоре это давало пустую строку
  // до и после фразы «Upon Seller Default…», у Покупателя такого нет
  "seller-default-soft-breaks": [
    { find: "{{#if !seller_deposit}}\u000bUpon Seller Default",
      replace: "{{#if !seller_deposit}}Upon Seller Default", note: "ст.8: убрать перенос перед фразой" },
    { find: "not a penalty. \u000b\n{{#if any_deposit}}This amount",
      replace: "not a penalty.\n{{#if any_deposit}}This amount", note: "ст.8: убрать перенос после фразы" },
  ],
  // 05.09: если застройщику всё выплачено, строка остатка показывала «0% … AED 0.00».
  // Банк даёт чек застройщику, только если остаток есть (ответ Миши, 04.09) —
  // при нуле строка уходит целиком, как строка добора порога
  "developer-balance-row": [
    { find: "Remaining balance of {{remaining_balance_percent}}% of the Original Price",
      replace: "{{#row has_developer_balance}}Remaining balance of {{remaining_balance_percent}}% of the Original Price",
      note: "ст.4: строка остатка застройщику по условию" },
  ],
  // 30.08, согласовано с Алиной: без агентств одобрять гарантийное письмо
  // от третьего лица некому, Агент из фразы уходит
  "agent-in-third-party-cheque": [
    { find: "acceptable to the Agent and the Parties", nth: 0,
      replace: "acceptable to {{#if any_agent}}the Agent and {{/if}}the Parties",
      note: "чек от третьего лица, Покупатель" },
    { find: "acceptable to the Agent and the Parties", nth: 0,
      replace: "acceptable to {{#if any_agent}}the Agent and {{/if}}the Parties",
      note: "чек от третьего лица, Продавец" },
  ],
  // 05.09: пустая строка перед абзацем Продавца в ст.6 пропадала, когда реквизиты
  // чека известны — закрывающий маркер переезжает в начало следующего абзаца
  "seller-paragraph-blank-line": [
    { find: "in accordance with the terms of this MOU.{{/if}}\n{{#if seller_cheque_details}}",
      replace: "in accordance with the terms of this MOU.\n{{/if}}{{#if seller_cheque_details}}",
      note: "ст.6: маркер в начало абзаца Similarly" },
  ],
  // 04.09, ответ Миши: у Покупателя важен факт банковского пре-одобрения, сумма
  // не обязана равняться Selling Price (ипотека может быть на меньшую сумму)
  "mortgage-preapproval-amount": [
    { find: "obtained Mortgage Pre-Approval for an amount equal to the agreed Selling Price and that",
      replace: "obtained Mortgage Pre-Approval and that", note: "ст.10: сумма пре-одобрения" },
  ],
  // 01.09, согласовано с Алиной: упоминание Agency Fee следует за наличием
  // комиссий (any_agent_fee), а не агентов; при одном депозите чек в
  // единственном числе
  "fee-sentence-and-cheque-plural": [
    { find: "The Selling Price{{#if any_agent}}, the amount payable to the Seller, and the Agency Fee{{/if}}"
        + "{{#if !any_agent}} and the amount payable to the Seller{{/if}} set out",
      replace: "The Selling Price{{#if any_agent_fee}}, the amount payable to the Seller, and the Agency Fee{{/if}}"
        + "{{#if !any_agent_fee}} and the amount payable to the Seller{{/if}} set out",
      note: "ст.4 итоговая строка" },
    { find: "by the Parties{{#if any_agent}} or in a separate Commission Agreement{{/if}}.",
      replace: "by the Parties{{#if any_agent_fee}} or in a separate Commission Agreement{{/if}}.",
      note: "ст.4 Commission Agreement" },
    { find: "Security Deposit cheques shall be returned to {{deposit_return_parties}}",
      replace: "Security Deposit cheque{{#if both_deposits}}s{{/if}} shall be returned to {{deposit_return_parties}}",
      note: "ст.6 возврат чеков" },
  ],
  // 03.10, новая редакция №1 от Даши (docx 1aX_h4yUCAgWBJb4cZs2lwcayXZOw-VEn):
  // агентства называются Agency / Agencies вместо Agent / Agents, «property»
  // в ст.1 A — с заглавной. Меняется только само слово внутри абзаца-якоря,
  // маркеры и начертание вокруг не трогаются
  "agent-to-agency": [
    { within: "(hereinafter referred to as the “Seller’s Agent”)", find: "Agent", replace: "Agency", note: "стороны: Seller’s Agency" },
    { within: "(hereinafter referred to as the “Buyer’s Agent”)", find: "Agent", replace: "Agency", note: "стороны: Buyer’s Agency" },
    { within: "are hereafter collectively referred to as the “Agencies/Agency.”", find: "Agent", replace: "Agency", note: "стороны: Seller’s Agency and…" },
    { within: "are hereafter collectively referred to as the “Agencies/Agency.”", find: "Agent", replace: "Agency", note: "стороны: …the Buyer’s Agency" },
    { within: "is the legal owner of the property described", find: "property", replace: "Property", note: "ст.1 A: Property с заглавной" },
    { within: "to be paid by the Buyer to The Buyer’s Agent on the Transfer Date", find: "Agent", replace: "Agency", note: "ст.4: комиссия Покупателя" },
    { within: "to be paid by the Seller to The Seller’s Agent on the Transfer Date", find: "Agent", replace: "Agency", note: "ст.4: комиссия Продавца" },
    { find: "the Agent and {{/if}}the Parties", replace: "the Agency and {{/if}}the Parties", note: "ст.6: чек от третьего лица, Покупатель" },
    { find: "the Agent and {{/if}}the Parties", replace: "the Agency and {{/if}}the Parties", note: "ст.6: чек от третьего лица, Продавец" },
    { within: "{{buyer_deposit_20_percent_amount}}) to the Seller’s Agent", find: "Agent", replace: "Agency", note: "ст.7: 20% агентству Продавца" },
    { within: "or the Seller’s Agent{{/if}} arising from such termination", find: "Agent", replace: "Agency", note: "ст.7: претензии к агентству Продавца" },
    { within: "{{seller_deposit_20_percent_amount}}) to the Buyer’s agent", find: "agent", replace: "Agency", note: "ст.8: 20% агентству Покупателя" },
    { within: "or the Buyer’s Agent{{/if}} arising from such termination", find: "Agent", replace: "Agency", note: "ст.8: претензии к агентству Покупателя" },
    { within: "the Security Deposit shall be released by", find: "the Agent{{/if}}", replace: "the Agency{{/if}}", note: "депозит: released by the Agency" },
    { within: "the Security Deposit shall remain held by", find: "the Agent{{/if}}", replace: "the Agency{{/if}}", note: "депозит: held by the Agency" },
    { find: "The Agent shall act solely as a neutral stakeholder", replace: "The Agency shall act solely as a neutral stakeholder", note: "депозит: neutral stakeholder" },
    { find: "with their respective Agents by providing", replace: "with their respective Agencies by providing", note: "AML: respective Agencies" },
    { find: "{{#if any_agent}}agents’ {{/if}}email", replace: "{{#if any_agent}}agency {{/if}}email", note: "споры: agency email" },
  ],
  // 03.10, жирный в ст.6 по той же редакции. Держатель чека и стороны возврата
  // теперь сами несут <<жирное>> (depositHolder, deposit_return_parties), поэтому
  // их плейсхолдеры — обычным. Абзац Продавца без реквизитов чека был совсем без
  // жирного, в абзаце с реквизитами жирной была фраза о третьем лице
  "article6-bold": [
    { within: "{{#if !buyer_cheque_details}}Upon signing", find: "{{buyer_deposit_holder}}", bold: false, note: "Покупатель без реквизитов: держатель" },
    { within: "{{#if buyer_cheque_details}}Upon signing", find: "{{buyer_deposit_holder}}", bold: false, note: "Покупатель с реквизитами: держатель" },
    { within: "{{#if buyer_cheque_details}}Upon signing", find: "Agency", bold: true, note: "Покупатель: Agency" },
    { within: "{{#if buyer_cheque_details}}Upon signing", find: "Parties", bold: true, note: "Покупатель: Parties" },
    { within: "{{#if !seller_cheque_details}}{{seller_deposit_intro}}", find: "Seller", bold: true, note: "Продавец без реквизитов: Seller" },
    { within: "{{#if !seller_cheque_details}}{{seller_deposit_intro}}", find: "AED {{seller_deposit_amount}}", bold: true, note: "…сумма" },
    { within: "{{#if !seller_cheque_details}}{{seller_deposit_intro}}", find: "Security Deposit", bold: true, note: "…Security Deposit" },
    { within: "{{#if !seller_cheque_details}}{{seller_deposit_intro}}", find: "Property", bold: true, note: "…Property" },
    { within: "{{#if !seller_cheque_details}}{{seller_deposit_intro}}", find: "Transfer Date", bold: true, note: "…Transfer Date" },
    { within: "{{#if !seller_cheque_details}}{{seller_deposit_intro}}", find: "MOU", bold: true, note: "…MOU" },
    { within: "{{#if seller_cheque_details}}{{seller_deposit_intro}}", find: ", on behalf of the Seller, provided that such third party", bold: false, note: "Продавец с реквизитами: фраза о третьем лице" },
    { within: "{{#if seller_cheque_details}}{{seller_deposit_intro}}", find: "Seller", nth: 1, bold: true, note: "…on behalf of the Seller," },
    { within: "{{#if seller_cheque_details}}{{seller_deposit_intro}}", find: "Seller", nth: 2, bold: true, note: "…on behalf of the Seller." },
    { within: "{{#if seller_cheque_details}}{{seller_deposit_intro}}", find: "Agency", bold: true, note: "…Agency" },
    { within: "{{#if seller_cheque_details}}{{seller_deposit_intro}}", find: "Parties", bold: true, note: "…Parties" },
    { within: "{{#if seller_cheque_details}}{{seller_deposit_intro}}", find: "{{seller_deposit_holder}}", bold: false, note: "…держатель" },
    { within: "{{#if seller_cheque_details}}{{seller_deposit_intro}}", find: "MOU", bold: true, note: "…MOU" },
    { find: " cheque{{#if both_deposits}}s{{/if}} shall be returned to {{deposit_return_parties}}", bold: false, note: "возврат чеков: жирное только Security Deposit" },
  ],
  // 03.10, строка Security deposit по образцу Даши: жёлтым и жирным только сумма,
  // жирные Selling Price / Security Deposit / Buyer / Seller, пустая строка между
  // Покупателем и Продавцом (при одном депозите движок убирает её вместе с абзацем).
  // Текст строки переехал из кода в шаблон, код даёт только {{…_deposit_basis}}
  "deposit-row": ["buyer", "seller"].map((side) => {
    const [who, whom] = side === "buyer" ? ["Buyer", "Seller"] : ["Seller", "Buyer"];
    const parts = [
      [`{{#if ${side}_deposit}}`, true, true],
      [`AED {{${side}_deposit_amount}}`, true, true],
      [" / ", true, false],
      [`({{${side}_deposit_basis}}`, false, false],
      ["Security Deposit", true, false],
      [" cheque issued by the ", false, false],
      [who, true, false],
      [" in favour of the ", false, false],
      [whom, true, false],
      [")", false, false],
      ["{{/if}}", false, false],
    ];
    let text = "";
    const runs = [];
    const noHighlight = [];
    for (const [t, bold, yellow] of parts) {
      runs.push([text.length, text.length + t.length, bold]);
      if (!yellow) noHighlight.push([text.length, text.length + t.length]);
      text += t;
    }
    if (side === "buyer") text += "\n"; // пустой абзац-разделитель перед строкой Продавца
    return {
      find: `{{#if ${side}_deposit}}{{${side}_security_deposit_table_line}}{{/if}}`,
      replace: text, runs, noHighlight, note: `строка Security deposit: ${who}`,
    };
  }),
  // 03.10: перед «Article 13» (одобрение застройщика) не было пустой строки, зато была
  // лишняя после заголовка — как в образце Даши: пустая строка до, текст сразу под заголовком
  "article13-spacing": [
    { find: "Article {{article_developer_approval_number}}", insertBefore: "\n", note: "пустая строка перед заголовком" },
    { find: "\nCompletion of the transfer", replace: "Completion of the transfer", bold: false, note: "убрать пустую строку после заголовка" },
  ],
  // 03.10: в подписях жирные только подписи полей — имена сторон, название агентства
  // и представитель обычным (жирное «Name:» и т.п. код ставит сам через << >>)
  "signature-names-plain": [
    { find: "{{seller_signature_block}}", bold: false, note: "THE SELLER: блок подписи" },
    { find: "{{buyer_signature_block}}", bold: false, note: "THE BUYER: блок подписи" },
    { within: "SELLER’S AGENCY", find: "{{seller_agent_name}}", bold: false, note: "агентство Продавца: название" },
    { within: "SELLER’S AGENCY", find: "{{seller_agent_representative}}", bold: false, note: "агентство Продавца: представитель" },
    { within: "Company: {{buyer_agent_name}}", find: "{{buyer_agent_name}}", bold: false, note: "агентство Покупателя: название" },
    { within: "Company: {{buyer_agent_name}}", find: "{{buyer_agent_representative}}", bold: false, note: "агентство Покупателя: представитель" },
  ],
  // 03.10 (вечер), обновлённая редакция №1 от Даши (тот же docx 1aX_h4yU…): правки текста
  // и жирного. Держатель чека, «Mr(s).» у представителя по доверенности и начало абзаца
  // Продавца в ст.6 собирает код. Абзац про банк Покупателя — ждёт ответа, в какой шаблон
  "redaction-1003": [
    { within: "{{seller_party_block}}", find: "hereafter", replace: "hereinafter", note: "Seller: hereinafter" },
    { find: "additions there to", replace: "additions thereto", note: "определения: thereto" },
    { within: "an agreed amount payable by the defaulting", find: "Default", bold: true, note: "Liquidated Damages: Default" },
    { within: "any fee levied by the", find: "Transfer fee", replace: "Transfer Fee", note: "Transfer Fee с заглавной" },
    { within: "agrees to purchase, the", find: "Selling Price", bold: true, note: "ст.1 B: Selling Price" },
    { within: "as per the SPA issued", find: "SPA", bold: true, note: "Original Price: SPA" },
    { within: "(2% from the", find: "transfer date", replace: "Transfer Date", bold: true, note: "ADM: Transfer Date" },
    { find: "Security deposit:", replace: "Security Deposit:", note: "таблица: Security Deposit" },
    { within: "to be paid by the Buyer to The Buyer’s Agency", find: "The Buyer’s Agency", replace: "the Buyer’s Agency",
      runs: [[0, 4, false]], note: "комиссия: to the Buyer’s Agency" },
    { within: "to be paid by the Seller to The Seller’s Agency", find: "The Seller’s Agency", replace: "the Seller’s Agency",
      runs: [[0, 4, false]], note: "комиссия: to the Seller’s Agency" },
    { within: "due to the occurrence of", find: "no more than", insertBefore: "for ", bold: false, note: "Force Majeure: for no more than" },
    { within: "{{#if !buyer_cheque_details}}Upon signing", find: "agreement", replace: "Agreement", bold: true, note: "ст.6: Agreement (без реквизитов)" },
    { within: "{{#if buyer_cheque_details}}Upon signing", find: "agreement", replace: "Agreement", bold: true, note: "ст.6: Agreement (с реквизитами)" },
    { within: "In the event that the Buyer fails", find: "Buyer’s reasonable control", bold: true, note: "ст.7: Buyer’s reasonable control" },
    { within: "In the event that the Seller fails", find: "Seller’s reasonable control", bold: true, note: "ст.8: Seller’s reasonable control" },
    { within: "made solely with the", find: "Default", bold: true, note: "own funds: Default" },
    { find: "In such event,", replace: "In such an event,", note: "одобрение застройщика: In such an event" },
    { find: "neither Party shall", replace: "neither Party shall", runs: [[0, 8, false], [8, 13, true], [13, 19, false]], note: "…neither Party (жирное)" },
    { within: "Both Parties agree to comply", find: "KYC", bold: true, note: "AML: KYC" },
    { find: "other than may be required by law", replace: "other than as may be required by law", note: "конфиденциальность: as may be" },
  ],
  // 03.10 (ночь), вёрстка подписей по редакции Даши: пустая строка перед THE SELLER,
  // «SELLER’S AGENCY» отдельным абзацем, пустая строка между блоками агентств
  // (внутри условия — уходит вместе с блоком, если агентства Продавца нет)
  "signatures-layout": [
    { find: "THE SELLER", insertBefore: "\n", note: "пустая строка перед THE SELLER" },
    { find: "SELLER’S AGENCY\u000b\u000bCompany:", replace: "SELLER’S AGENCY\nCompany:", note: "SELLER’S AGENCY отдельным абзацем" },
    // отдельный абзац с одной {{/if}} движок удаляет — пустую строку даёт перенос внутри абзаца
    { find: "Company Stamp{{/if}}", replace: "Company Stamp\u000b{{/if}}", note: "пустая строка после блока агентства Продавца" },
  ],
};

const [documentId, key] = process.argv.slice(2);
if (!documentId || !PATCHES[key]) {
  throw new Error(`укажи ID и ключ правки. Доступные: ${Object.keys(PATCHES).join(", ")}`);
}

const { docs } = getBotClients();
const res = await applyEdits(docs, documentId, PATCHES[key]);
console.log(`применено: ${res.done.length} из ${PATCHES[key].length}`);
res.failed.forEach((f) => console.log("   ——", f));
// правка применена наполовину — это не успех, шаблон в промежуточном виде
process.exitCode = res.failed.length ? 1 : 0;
