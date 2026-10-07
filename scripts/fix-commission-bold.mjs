// Жирные термины в Commission Agreement (Даша, 07.10.2026): node scripts/fix-commission-bold.mjs <documentId>
// «Agreement» (кроме «Commission Agreement»), «MOU», «First Party», «Second Party», «Third Party», «Parties» —
// жирным везде в теле документа, как определённые термины. Только выставляет bold, текст не меняет;
// повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const { chars, text } = buildIndex((await docs.documents.get({ documentId })).data);
const TERMS = /(?<![A-Za-z])(First Party|Second Party|Third Party|Parties|MOU|(?<!Commission )Agreement)(?![A-Za-z])/g;

const requests = [];
const counts = {};
for (const m of text.matchAll(TERMS)) {
  const from = m.index;
  const to = m.index + m[0].length - 1;
  if (chars[from].seg !== "" || chars[to].seg !== "") continue; // только тело
  if (chars.slice(from, to + 1).every((c) => c.bold)) continue;
  requests.push({ updateTextStyle: {
    range: { startIndex: chars[from].i, endIndex: chars[to].i + 1 },
    textStyle: { bold: true }, fields: "bold",
  } });
  counts[m[0]] = (counts[m[0]] || 0) + 1;
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`сделано жирными: ${requests.length}`, JSON.stringify(counts));
