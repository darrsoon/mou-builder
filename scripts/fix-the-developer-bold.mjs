// Статья об обязательствах Продавца: «…amounts due to the Developer…» — «the» обычным, жирное только «Developer»
// (Алина, 21.10.2026: «п.12 the Developer — the убрать жирность»). В №2, №4–№6 «the» было жирным.
//   node scripts/fix-the-developer-bold.mjs <documentId>
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const { chars, text } = buildIndex((await docs.documents.get({ documentId })).data);
const requests = [];
for (const m of text.matchAll(/amounts due to (the) Developer/g)) {
  const at = m.index + m[0].indexOf("the");
  const span = chars.slice(at, at + 4); // «the »
  if (!span.some((c) => c.bold)) continue;
  requests.push({ updateTextStyle: { range: { startIndex: span[0].i, endIndex: span[3].i + 1 }, textStyle: { bold: false }, fields: "bold" } });
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`«the» без жирного: ${requests.length}`);
