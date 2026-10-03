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
