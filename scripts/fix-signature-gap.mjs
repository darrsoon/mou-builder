// Отступы по замечаниям Даши (04.10.2026): node scripts/fix-signature-gap.mjs <documentId>
// — перед «THE SELLER» ровно одна пустая строка без интервалов, у «THE SELLER» интервал сверху 0;
// — первый абзац статьи о депозите («…shall be released by…») без интервала сверху.
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");
const load = async () => (await docs.documents.get({ documentId })).data.body.content.filter((b) => b.paragraph);
const zero = (b, fields) => ({ updateParagraphStyle: {
  range: { startIndex: b.startIndex, endIndex: b.endIndex },
  paragraphStyle: Object.fromEntries(fields.map((f) => [f, { magnitude: 0, unit: "PT" }])), fields: fields.join(","),
} });

let ps = await load();
let i = ps.findIndex((b) => text(b).startsWith("THE SELLER"));
if (i === -1) throw new Error("THE SELLER не найден");
let blanks = 0;
while (i - blanks - 1 >= 0 && !text(ps[i - blanks - 1]).trim()) blanks += 1;
if (blanks === 0) {
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ insertText: { location: { index: ps[i].startIndex }, text: "\n" } }] } });
} else if (blanks > 1) {
  const first = ps[i - blanks], last = ps[i - 2];
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ deleteContentRange: { range: { startIndex: first.startIndex, endIndex: last.endIndex } } }] } });
}
ps = await load();
i = ps.findIndex((b) => text(b).startsWith("THE SELLER"));
const requests = [zero(ps[i - 1], ["spaceAbove", "spaceBelow"]), zero(ps[i], ["spaceAbove"])];
const dep = ps.find((b) => text(b).includes("Security Deposit shall be released by"));
if (dep && dep.paragraph.paragraphStyle?.spaceAbove?.magnitude) requests.push(zero(dep, ["spaceAbove"]));
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`пустых строк перед THE SELLER было: ${blanks}, стало: 1; ст. о депозите: ${dep && requests.length === 3 ? "интервал сверху убран" : "без изменений"}`);
