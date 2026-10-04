// Пустая строка между таблицей ст.3 и заголовком ст.4 оказывалась первой строкой страницы,
// когда таблица заканчивалась внизу (Даша, 04.10.2026). Абзац-разделитель убираем, отступ
// даём интервалом над заголовком: node scripts/fix-article4-gap.mjs <documentId>. Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
const { docs } = getBotClients();
const id = process.argv[2];
const els = (await docs.documents.get({ documentId: id })).data.body.content;
const text = (b) => (b.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("");
const i = els.findIndex((b) => b.paragraph && /^Article \{\{article_payment_table_number\}\}/.test(text(b)));
if (i === -1) throw new Error("заголовок ст.4 не найден");
const head = els[i], blank = els[i - 1];
const requests = [{ updateParagraphStyle: { range: { startIndex: head.startIndex, endIndex: head.endIndex },
  paragraphStyle: { spaceAbove: { magnitude: 14, unit: "PT" } }, fields: "spaceAbove" } }];
if (blank?.paragraph && !text(blank).trim() && els[i - 2]?.table) {
  requests.push({ deleteContentRange: { range: { startIndex: blank.startIndex, endIndex: blank.endIndex } } });
}
await docs.documents.batchUpdate({ documentId: id, requestBody: { requests } });
console.log(requests.length === 2 ? "пустая строка убрана, интервал над заголовком 14 пт" : "пустой строки уже нет, интервал выставлен");
