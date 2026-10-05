// Пустая строка перед «The forfeited Security Deposit shall be distributed as follows:» в статьях
// о дефолте Покупателя и Продавца (Даша, 05.10.2026): node scripts/fix-forfeited-gap.mjs <documentId>
// В шаблоне было: «{{#if buyer_deposit}}» отдельной строкой, пустая строка, «The forfeited…{{/if}}».
// Движок, вырезая соседний блок {{#if !buyer_deposit}}, забирал эту пустую строку как разделитель —
// в договоре её не было. Теперь пустая строка — перенос (\u000b) в начале самого абзаца:
// «{{#if buyer_deposit}}\u000bThe forfeited…{{/if}}», её движок не трогает. Повторный запуск
// ничего не меняет (отдельной строки с маркером уже нет).
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");

const ps = (await docs.documents.get({ documentId })).data.body.content.filter((b) => b.paragraph);
const spots = [];
ps.forEach((b, i) => {
  const marker = text(b).match(/^(\{\{#if (?:buyer|seller)_deposit\}\})\n$/);
  if (!marker || text(ps[i + 1] || b) !== "\n" || !text(ps[i + 2] || b).startsWith("The forfeited Security Deposit")) return;
  spots.push({ start: b.startIndex, end: ps[i + 2].startIndex, marker: marker[1] });
});
// снизу вверх, чтобы индексы выше не съезжали
const requests = spots.reverse().flatMap((s) => [
  { deleteContentRange: { range: { startIndex: s.start, endIndex: s.end } } },
  { insertText: { location: { index: s.start }, text: `${s.marker}\u000b` } },
]);
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`исправлено мест: ${spots.length}`);
