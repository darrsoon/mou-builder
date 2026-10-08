// Определения Transfer Fee / NOC fee (Алина, 08.10.2026; комментарии Даши в драфте 1):
//   есть NOC (Sea La Vie, C3, Gate Towers — колонка Transfer Fee Label в PROJECTS — или готовый объект) →
//   только «NOC fee is a fee charged…»; нет NOC → только «Transfer Fee – any fee levied…».
//   node scripts/fix-noc-definition.mjs <documentId>
// №1/№2: «Transfer Fee – …» уходит под {{#if !noc_fee}}, «NOC fee» — без пробела после {{/if}}.
// №4 по чистовику: было обрезано до «NOC — an official document…» — восстанавливается начало, как в №3.
// Повтор безопасен (правка делается, только если найден исходный текст).
import { getBotClients } from "./google-bot.mjs";
import { applyEdits, buildIndex } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const { text } = buildIndex((await docs.documents.get({ documentId })).data);

const edits = [];
if (text.includes("registration.{{#if noc_fee}} NOC fee") && !text.includes("{{#if !noc_fee}}Transfer Fee")) {
  edits.push({ find: "Transfer Fee – any fee levied", insertBefore: "{{#if !noc_fee}}", bold: true });
  const marks = "{{/if}}{{#if noc_fee}}NOC fee";
  edits.push({ find: "registration.{{#if noc_fee}} NOC fee", replace: `registration.${marks}`, bold: false,
    runs: [[13, 13 + marks.length, true]] });
}
if (text.includes("NOC — an official document")) {
  const lead = "NOC fee is a fee charged for issuing a No Objection Certificate (NOC)";
  edits.push({ find: "NOC — an official", replace: `${lead} — an official`, bold: false,
    runs: [[0, 7, true], [lead.indexOf("No Objection"), lead.length, true]] });
}
if (edits.length) {
  const res = await applyEdits(docs, documentId, edits, { label: "noc" });
  console.log(JSON.stringify(res));
}
console.log(`правок определения NOC: ${edits.length}`);
