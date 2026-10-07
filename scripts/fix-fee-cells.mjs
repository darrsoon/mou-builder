// Ячейки Agency Fee и Security Deposit (Даша, 07.10.2026): node scripts/fix-fee-cells.mjs <documentId>
// В ячейке было три абзаца — строка Покупателя, пустая строка, строка Продавца. Если одной стороны нет,
// её абзац оставался пустым вместе с разделителем, и строка таблицы была высокой. Теперь это один абзац:
// разделитель (пустая строка, \v\v) стоит внутри условия «есть и вторая сторона».
// Ищем только внутри PAYMENT TABLE: те же маркеры есть в статье о депозитах. Меняются только маркеры
// и переводы строк — слова (и их жирный) не трогаются. Повторный запуск ничего не находит.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;
const table = doc.body.content.find((b) => b.table && JSON.stringify(b.table).includes("PAYMENT TABLE"));
if (!table) throw new Error("PAYMENT TABLE не найдена");
const { chars, text } = buildIndex(doc);

const hits = [];
// разделитель — пустая строка (\n\n → \v\v) или, как в прежнем №4, просто новая строка (\n → \v)
for (const flag of ["seller_agent_fee", "seller_deposit"]) {
  for (const [gap, soft] of [["\n\n", "\u000b\u000b"], ["\n", "\u000b"]]) {
    const find = `{{/if}}${gap}{{#if ${flag}}}`;
    for (let at = text.indexOf(find); at !== -1; at = text.indexOf(find, at + 1)) {
      const start = chars[at].i;
      if (chars[at].seg !== "" || start < table.startIndex || start > table.endIndex) continue;
      if (hits.some((h) => h.start === start)) continue;
      hits.push({ start, end: chars[at + find.length - 1].i + 1, text: `{{#if ${flag}}}${soft}{{/if}}{{/if}}{{#if ${flag}}}` });
    }
  }
}
// снизу вверх — индексы выше не съезжают
const requests = hits.sort((a, b) => b.start - a.start).flatMap((h) => [
  { deleteContentRange: { range: { startIndex: h.start, endIndex: h.end } } },
  { insertText: { location: { index: h.start }, text: h.text } },
]);
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`склеено ячеек: ${hits.length}`);
