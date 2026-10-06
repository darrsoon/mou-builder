// Способ оплаты Продавцу в таблице ст.4 — обычным шрифтом (Даша, 06.10.2026):
// node scripts/fix-payment-text-plain.mjs <documentId>
// Плейсхолдер {{amount_to_seller_payment_text}} («Manager's Cheque or Cash») был жирным — значение
// подставляется со стилем плейсхолдера. Точку в конце убрал код (lib/mou/core.js).
// В №2, №4, №5, №6 вместо плейсхолдера готовый текст «Manager's Cheque» после
// «…Seller on the Transfer Date by» — тоже обычным шрифтом (правки оформления — в №1–№6).
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const ph = "{{amount_to_seller_payment_text}}";
const doc = (await docs.documents.get({ documentId })).data;
const requests = [];
const walk = (content) => content.forEach((b) => {
  if (b.table) b.table.tableRows.forEach((r) => r.tableCells.forEach((c) => walk(c.content)));
  for (const e of b.paragraph?.elements || []) {
    const k = (e.textRun?.content || "").indexOf(ph);
    if (k < 0 || !e.textRun.textStyle?.bold) continue;
    const at = e.startIndex + k;
    requests.push({ updateTextStyle: { range: { startIndex: at, endIndex: at + ph.length }, textStyle: { bold: false }, fields: "bold" } });
  }
});
walk(doc.body.content);
// готовый текст «Manager's Cheque» (прямой или типографский апостроф) после «Transfer Date by »
const walkLiteral = (content) => content.forEach((b) => {
  if (b.table) b.table.tableRows.forEach((r) => r.tableCells.forEach((c) => walkLiteral(c.content)));
  const els = b.paragraph?.elements || [];
  const full = els.map((e) => e.textRun?.content || "").join("");
  const m = full.match(/Seller on the Transfer Date by (Manager[’']s Cheque)/);
  if (!m) return;
  const at = b.startIndex + m.index + m[0].length - m[1].length;
  const bold = els.find((e) => e.startIndex <= at && at < e.endIndex)?.textRun?.textStyle?.bold;
  if (bold) requests.push({ updateTextStyle: { range: { startIndex: at, endIndex: at + m[1].length }, textStyle: { bold: false }, fields: "bold" } });
});
walkLiteral(doc.body.content);
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`снят жирный: ${requests.length}`);
