// Вёрстка шаблонов Commission Agreement (03.10, замечания Даши):
//   node scripts/patch-commission-layout.mjs <1|2> [documentId]
// — дата-образец в шапке («23 June, 2026») → {{ca_date_header}}, без жёлтого;
// — пустая строка перед «3. Governing Law» и «4. Compliance», где её нет;
// — заголовки разделов и подписей держатся со следующим абзацем, чтобы не
//   оставаться одни внизу страницы. Однократная правка, как и разметка.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";
import { COMMISSION_TEMPLATES } from "../lib/mou/config.js";

const which = process.argv[2];
const documentId = process.argv[3] || (which === "1" ? COMMISSION_TEMPLATES.oneAgency : which === "2" ? COMMISSION_TEMPLATES.twoAgencies : "");
if (!documentId) throw new Error("укажи 1 или 2");
const { docs } = getBotClients();

const headerDate = which === "1" ? "23 June, 2026" : "31 July, 2026";
const edits = [
  { find: headerDate, replace: "{{ca_date_header}}", noHighlight: [[0, "{{ca_date_header}}".length]], note: "дата в шапке" },
  { find: "3. Governing Law", insertBefore: "\n", note: "пустая строка перед п.3" },
];
if (which === "1") edits.push({ find: "4. Compliance", insertBefore: "\n", note: "пустая строка перед п.4" });

const res = await applyEdits(docs, documentId, edits);
console.log(`применено: ${res.done.length} из ${edits.length}`);
res.failed.forEach((f) => console.log("   ——", f));
if (res.failed.length) { process.exitCode = 1; process.exit(); }

const HEADINGS = /^(\d\. \S|Signed by the Parties:|FIRST PARTY|SECOND PARTY|THIRD PARTY)/;
const doc = (await docs.documents.get({ documentId })).data;
const requests = doc.body.content
  .filter((b) => b.paragraph && HEADINGS.test((b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("")))
  .map((b) => ({ updateParagraphStyle: {
    range: { startIndex: b.startIndex, endIndex: b.endIndex },
    paragraphStyle: { keepWithNext: true, keepLinesTogether: true }, fields: "keepWithNext,keepLinesTogether",
  } }));
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`заголовков со «держать со следующим»: ${requests.length}`);
