// Заголовок подписи не висит один внизу страницы (Даша, 07.10.2026):
//   node scripts/fix-signature-headings.mjs <documentId>
// «THE SELLER», «THE BUYER», «SELLER’S AGENCY», «BUYER’S AGENCY» склеиваются со следующим абзацем
// (строки подписи) через пустую строку: «THE SELLER\v\v{{seller_signature_block}}». Абзац с
// «не разрывать» Google не делит ни в редакторе, ни в PDF, а цепочку «не отрывать от следующего»
// редактор иногда рвёт — и заголовок оставался один на странице, а подпись уезжала на следующую.
// Отступ как был: если между заголовком и подписью стоял интервал абзаца (№1: 12 pt) — пустая строка,
// если интервала не было (№2 по чистовику) — просто перенос строки.
// Повторный запуск ничего не меняет: склеенный заголовок уже не стоит в абзаце один.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const HEADINGS = ["THE SELLER", "THE BUYER", "SELLER’S AGENCY", "BUYER’S AGENCY"];
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");
// заголовок может идти с маркером условия: «{{#if seller_agent}}SELLER’S AGENCY»
const bare = (t) => t.replace(/\{\{[^}]*\}\}/g, "").trim();

const doc = (await docs.documents.get({ documentId })).data;
const ps = doc.body.content.filter((b) => b.paragraph);
const targets = [];
ps.forEach((b, i) => {
  // уже склеенный заголовок содержит перенос строки — второй раз не трогаем
  const own = text(b);
  if (own.includes("\u000b")) return;
  if (HEADINGS.includes(bare(own)) && ps[i + 1] && text(ps[i + 1]).trim()) targets.push([b, ps[i + 1]]);
});
// снизу вверх — индексы выше не съезжают
const gap = (p) => p.paragraph.paragraphStyle?.spaceAbove?.magnitude || 0;
const requests = targets.sort(([a], [b]) => b.endIndex - a.endIndex).flatMap(([b, next]) => {
  const nl = b.endIndex - 1; // «\n» в конце заголовка
  const spaced = (b.paragraph.paragraphStyle?.spaceBelow?.magnitude || 0) + gap(next) > 0;
  return [
    { deleteContentRange: { range: { startIndex: nl, endIndex: nl + 1 } } },
    { insertText: { location: { index: nl }, text: spaced ? "\u000b\u000b" : "\u000b" } },
  ];
});
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`заголовков подписей склеено со строкой подписи: ${targets.length}`);
