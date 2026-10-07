// Жёлтое — только суммы (Алина, 07.10.2026: «вот такие должны быть выделения» — «AED 000,000.00» жёлтым, пояснение обычным):
//   node scripts/fix-highlight-parens.mjs <documentId>
// В PAYMENT TABLE из чистовика Даши жёлтым была залита и скобка «(» после суммы Agency Fee. Снимает выделение
// с кусков, где только скобки и пробелы. Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const content = (await docs.documents.get({ documentId })).data.body.content;
const table = content.find((b) => b.table && JSON.stringify(b.table).includes("PAYMENT TABLE"))?.table;
const requests = [];
for (const row of table?.tableRows || []) for (const cell of row.tableCells) for (const p of cell.content) {
  for (const e of p.paragraph?.elements || []) {
    const text = e.textRun?.content || "";
    if (!e.textRun?.textStyle?.backgroundColor?.color || !/[()]/.test(text) || !/^[\s()]+$/.test(text)) continue;
    requests.push({ updateTextStyle: {
      range: { startIndex: e.startIndex, endIndex: e.endIndex },
      textStyle: { backgroundColor: {} }, fields: "backgroundColor",
    } });
  }
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`снято выделение со скобок: ${requests.length}`);
