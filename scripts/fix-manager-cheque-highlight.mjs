// «Manager’s Cheque» в PAYMENT TABLE — жёлтым везде (Алина, 08.10.2026: «Manager’s Cheque нужно выделить»).
// В чистовиках выделен был только местами (в ячейках, где способ оплаты подставляет код, он и так жёлтый).
//   node scripts/fix-manager-cheque-highlight.mjs <documentId>
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const content = (await docs.documents.get({ documentId })).data.body.content;
const table = content.find((b) => b.table && JSON.stringify(b.table).includes("PAYMENT TABLE"))?.table;
const YELLOW = { color: { rgbColor: { red: 1, green: 1, blue: 0 } } };
const requests = [];
for (const row of table?.tableRows || []) for (const cell of row.tableCells) for (const p of cell.content) {
  const els = p.paragraph?.elements || [];
  const text = els.map((e) => e.textRun?.content || "").join("");
  for (const m of text.matchAll(/Manager[’']s Cheque/g)) {
    const start = p.startIndex + m.index;
    const end = start + m[0].length;
    // уже целиком жёлтое — пропускаем
    const covered = els.filter((e) => e.endIndex > start && e.startIndex < end);
    if (covered.every((e) => e.textRun?.textStyle?.backgroundColor?.color)) continue;
    requests.push({ updateTextStyle: { range: { startIndex: start, endIndex: end }, textStyle: { backgroundColor: YELLOW }, fields: "backgroundColor" } });
  }
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`выделено «Manager’s Cheque»: ${requests.length}`);
