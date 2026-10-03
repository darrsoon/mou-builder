// Разметка шаблонов Commission Agreement: node scripts/markup-commission.mjs <1|2>
//   1 — «7. DRAFT Commission Agreement (1 agency)», плательщик + одно агентство
//   2 — «8. DRAFT Commission Agreement (2 agencies)», плательщик + два агентства
// Исходники — .docx Даши в общей папке (1nwKtbLm…, 1WGHPes9…), шаблоны — их копии
// в «MOU (Prime Bridge)», сделанные 03.10. Примеры-значения (выделены жёлтым)
// заменяются плейсхолдерами, выделение снимается. Разметка неидемпотентна:
// повторный прогон по уже размеченному шаблону ничего не найдёт и упадёт.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";
import { COMMISSION_TEMPLATES } from "../lib/mou/config.js";

const PARTY = "This Agreement is entered into by and between the following Parties:";
const agencyLine = (n) =>
  `represented by the {{agency${n}_position}} {{agency${n}_representative}}, authorized by the Economic license #{{agency${n}_license}}, located at {{agency${n}_address}}`;

const EDITS = {
  1: [
    { find: "29/11/2026", replace: "{{ca_date}}", note: "дата соглашения" },
    { find: "29/11/2026", replace: "{{mou_date}}", note: "дата MOU" },
    { find: "Manarat-B1-01-00.", replace: "{{unit_number}}.", note: "юнит во вступлении" },
    { within: "hereafter referred to as the «Seller»", find: "Mr(s). Petr Petrov, nationality: Egyptian, holder of Passport number: A30075781, holder of EID Number 784-1975-3193795-7, Ownership rights – 100%",
      replace: "{{payer_party_block}}", note: "плательщик: реквизиты" },
    { find: ", hereafter referred to as the «Seller», ", replace: "{{#if !payer_is_company}}, hereafter referred to as the «{{payer_role}}», {{/if}}", note: "плательщик: роль (у компании нет)" },
    { find: ", hereafter referred to as the ", bold: false, note: "плательщик: «hereafter…» обычным, как в исходнике" },
    { find: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", replace: "{{agency1_name}}", note: "агентство: название" },
    { find: "represented by the Manager Mikhail Slobodchikov, authorized by the Economic license #CN-6410679, located at Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335",
      replace: agencyLine(1), note: "агентство: реквизиты" },
    { within: "agrees to pay the Second Party", find: "Petr Petrov", replace: "{{payer_name}}", note: "ст.2: плательщик" },
    { within: "agrees to pay the Second Party", find: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", replace: "{{agency1_name}}", note: "ст.2: агентство" },
    { within: "agrees to pay the Second Party", find: "AED 000,000.00", replace: "AED {{agency1_fee}}", note: "ст.2: комиссия" },
    { within: "agrees to pay the Second Party", find: "( [amount in words] dirhams,", replace: "({{agency1_fee_words}},", note: "ст.2: комиссия прописью" },
    { within: "agrees to pay the Second Party", find: "Manarat-B1-01-00", replace: "{{unit_number}}", note: "ст.2: юнит" },
    { within: "agrees to pay the Second Party", find: "AED 0,000,000.00", replace: "AED {{selling_price}}", note: "ст.2: цена" },
    { within: "agrees to pay the Second Party", find: "( [amount in words] dirhams)", replace: "({{selling_price_words}})", note: "ст.2: цена прописью" },
    { find: "full on the day of transfer", replace: "{{payment_term}}", note: "ст.2: срок оплаты" },
  ],
  2: [
    { find: "31/07/2026", replace: "{{ca_date}}", note: "дата соглашения" },
    { find: "30/07/2026", replace: "{{mou_date}}", note: "дата MOU" },
    { find: "YasGolfCollection-E-03-05.", replace: "{{unit_number}}.", note: "юнит во вступлении" },
    { within: "hereafter referred to as the «Seller»", find: "Mr(s). Name Surname, nationality: Russian Federation, holder of Passport number: 0000000, holder of EID Number 784-1989-000000-2, Ownership rights – 100%",
      replace: "{{payer_party_block}}", note: "плательщик: реквизиты" },
    { within: "hereafter referred to as the «Seller»", find: "Seller", replace: "{{payer_role}}", note: "плательщик: роль" },
    { within: "Office 000, Sky Tower", find: "REAL ESTATE", replace: "{{agency1_name}}", note: "агентство 1: название" },
    { find: "represented by the Manager Name Surname, authorized by the Economic license #CN-0000000 located at Office 000, Sky Tower, Shams Abu Dhabi, Al Reem Island, Abu Dhabi",
      replace: agencyLine(1), note: "агентство 1: реквизиты" },
    { find: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", replace: "{{agency2_name}}", note: "агентство 2: название" },
    { find: "represented by the Manager Mikhail Slobodchikov, authorized by the Economic license #CN-6410679, located at Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335",
      replace: agencyLine(2), note: "агентство 2: реквизиты" },
    { within: "agrees to pay the Second Party", find: "Name Surname", replace: "{{payer_name}}", note: "ст.2 (1): плательщик" },
    { within: "agrees to pay the Second Party", find: "REAL ESTATE", replace: "{{agency1_name}}", note: "ст.2 (1): агентство" },
    { within: "agrees to pay the Second Party", find: "AED 00,000.00", replace: "AED {{agency1_fee}}", note: "ст.2 (1): комиссия" },
    { within: "agrees to pay the Second Party", find: "Twenty-three thousand six hundred twenty-five dirhams", replace: "{{agency1_fee_words}}", note: "ст.2 (1): прописью" },
    { within: "agrees to pay Third Party", find: "Name Surname", replace: "{{payer_name}}", note: "ст.2 (2): плательщик" },
    { within: "agrees to pay Third Party", find: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", replace: "{{agency2_name}}", note: "ст.2 (2): агентство" },
    { within: "agrees to pay Third Party", find: "AED 25,000.00", replace: "AED {{agency2_fee}}", note: "ст.2 (2): комиссия" },
    { within: "agrees to pay Third Party", find: "Twenty five thousand dirhams", replace: "{{agency2_fee_words}}", note: "ст.2 (2): прописью" },
    { within: "Both agency commissions agreed", find: "Lily-B7-04-13", replace: "{{unit_number}}", note: "ст.2: юнит" },
    { within: "Both agency commissions agreed", find: "AED 0,000,000.00", replace: "AED {{selling_price}}", note: "ст.2: цена" },
    { within: "Both agency commissions agreed", find: "(One million one hundred twenty-five thousand dirhams", replace: "({{selling_price_words}}", note: "ст.2: цена прописью" },
    { find: "full on the day of transfer", replace: "{{payment_term}}", note: "ст.2: срок оплаты" },
  ],
};

const which = process.argv[2];
const documentId = which === "1" ? COMMISSION_TEMPLATES.oneAgency : which === "2" ? COMMISSION_TEMPLATES.twoAgencies : process.argv[3];
if (!EDITS[which] || !documentId) throw new Error("укажи 1 или 2 (и при желании ID документа третьим аргументом)");

const { docs } = getBotClients();
const res = await applyEdits(docs, process.argv[3] || documentId, EDITS[which]);
console.log(`применено: ${res.done.length} из ${EDITS[which].length}`);
res.failed.forEach((f) => console.log("   ——", f));
if (res.failed.length) { process.exitCode = 1; process.exit(); }

// Таблица подписей → блок как в конце MOU: заголовок стороны жирным, под ним
// Name/Company, Signature, Date, Company Stamp — их собирает код
// ({{first_party_signature}} и т.д., подписи жирные через << >>).
const target = process.argv[3] || documentId;
let doc = (await docs.documents.get({ documentId: target })).data;
const tableText = (el) => JSON.stringify(el.table || "");
const sigTable = doc.body.content.find((el) => el.table && tableText(el).includes("First Party Signature"));
if (!sigTable) throw new Error("таблица подписей не найдена");
const blocks = [["FIRST PARTY", "{{first_party_signature}}"], ["SECOND PARTY", "{{second_party_signature}}"]];
if (which === "2") blocks.push(["THIRD PARTY", "{{third_party_signature}}"]);
let text = "";
const bold = [];
for (const [title, ph] of blocks) {
  if (text) text += "\n";
  bold.push([text.length, text.length + title.length]);
  text += `${title}\n${ph}\n`;
}
const at = sigTable.startIndex;
const requests = [
  { deleteContentRange: { range: { startIndex: sigTable.startIndex, endIndex: sigTable.endIndex } } },
  { insertText: { location: { index: at }, text } },
  { updateTextStyle: { range: { startIndex: at, endIndex: at + text.length }, textStyle: { bold: false }, fields: "bold" } },
  ...bold.map(([a, b]) => ({ updateTextStyle: { range: { startIndex: at + a, endIndex: at + b }, textStyle: { bold: true }, fields: "bold" } })),
];
await docs.documents.batchUpdate({ documentId: target, requestBody: { requests } });
console.log("подписи: блок как в MOU");

// Жёлтое выделение примеров-значений в шаблоне не нужно — снимаем по всему телу
doc = (await docs.documents.get({ documentId: target })).data;
const end = doc.body.content.at(-1).endIndex - 1;
await docs.documents.batchUpdate({
  documentId: target,
  requestBody: { requests: [{ updateTextStyle: { range: { startIndex: 1, endIndex: end }, textStyle: {}, fields: "backgroundColor" } }] },
});
console.log("выделение снято");
