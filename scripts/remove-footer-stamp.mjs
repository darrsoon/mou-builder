// Убрать строку «Company Stamp» из таблицы подписей в нижнем колонтитуле (Даша, 04.10.2026):
//   node scripts/remove-footer-stamp.mjs <documentId>. Повторный запуск ничего не найдёт и ничего не сломает.
import { getBotClients } from "./google-bot.mjs";
const { docs } = getBotClients();
const documentId = process.argv[2];
const doc = (await docs.documents.get({ documentId })).data;
const text = (c) => JSON.stringify(c);
const reqs = [];
for (const [fid, f] of Object.entries(doc.footers || {})) {
  for (const el of f.content) {
    if (!el.table) continue;
    el.table.tableRows.forEach((row, i) => {
      const t = row.tableCells.flatMap((c) => c.content).flatMap((p) => p.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("");
      if (t.includes("Company Stamp")) reqs.push({ deleteTableRow: { tableCellLocation: { tableStartLocation: { segmentId: fid, index: el.startIndex }, rowIndex: i, columnIndex: 0 } } });
    });
  }
}
console.log("строк с Company Stamp в колонтитулах:", reqs.length);
if (reqs.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests: reqs.reverse() } });
const after = (await docs.documents.get({ documentId })).data;
for (const f of Object.values(after.footers || {})) for (const el of f.content) for (const row of el.table?.tableRows || [])
  console.log("  строка:", row.tableCells.map((c) => c.content.flatMap((p) => p.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("").trim()).join(" | "));
