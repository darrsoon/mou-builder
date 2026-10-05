// Ссылки «Article N» в тексте — номер жирный, как слово Article (Даша, 05.10.2026):
// node scripts/fix-article-ref-bold.mjs <documentId>
// В №1 было «**Article** 5» в ст. 7/8 и в WHEREAS A/B: плейсхолдер номера обычным шрифтом.
// Если «Article» перед плейсхолдером жирное — делаем жирным и плейсхолдер (значение
// подставляется со стилем плейсхолдера). Заголовки статей не трогаем. Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;

const requests = [];
const walk = (content) => content.forEach((b) => {
  if (b.table) b.table.tableRows.forEach((r) => r.tableCells.forEach((c) => walk(c.content)));
  if (!b.paragraph) return;
  const els = b.paragraph.elements || [];
  const full = els.map((e) => e.textRun?.content || "").join("");
  if (/^(\{\{[^}]*\}\})*Article (\{\{[a-z_]+\}\}|\d+)\s*$/.test(full)) return;
  const bold = (i) => Boolean(els.find((e) => e.startIndex <= i && i < e.endIndex)?.textRun?.textStyle?.bold);
  for (const m of full.matchAll(/Article (\{\{[a-z_]+\}\}|\d+)/g)) {
    const at = b.startIndex + m.index;
    const ph = at + "Article ".length;
    if (!bold(at) || bold(ph)) continue;
    requests.push({ updateTextStyle: {
      range: { startIndex: ph, endIndex: ph + m[1].length }, textStyle: { bold: true }, fields: "bold",
    } });
  }
});
walk(doc.body.content);
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`номеров сделано жирными: ${requests.length}`);
