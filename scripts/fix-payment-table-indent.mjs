// Таблица статьи 4 (PAYMENT TABLE): одинаковый отступ слева у всех абзацев ячеек и без
// лишних интервалов снизу (Даша, 05.10.2026: «отступы у предложений скачут»); у строк
// нет минимальной высоты — строка по тексту, без пустого места под одной комиссией.
//   node scripts/fix-payment-table-indent.mjs <documentId>. Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
const { docs } = getBotClients();
const id = process.argv[2];
const content = (await docs.documents.get({ documentId: id })).data.body.content;
const table = content.find((b) => b.table && JSON.stringify(b.table).includes("PAYMENT TABLE"));
if (!table) throw new Error("PAYMENT TABLE не найдена");
const pt = (m) => ({ magnitude: m, unit: "PT" });
const requests = [];
table.table.tableRows.forEach((row, ri) => {
  if (ri === 0) return; // шапка «PAYMENT TABLE» по центру — не трогаем
  for (const cell of row.tableCells) for (const p of cell.content) {
    if (!p.paragraph) continue;
    requests.push({ updateParagraphStyle: {
      range: { startIndex: p.startIndex, endIndex: p.endIndex },
      paragraphStyle: { indentStart: pt(2), indentFirstLine: pt(2), spaceBelow: pt(0) },
      fields: "indentStart,indentFirstLine,spaceBelow",
    } });
  }
});
const rows = table.table.tableRows.length;
for (let ri = 1; ri < rows; ri += 1) {
  requests.push({ updateTableRowStyle: {
    tableStartLocation: { index: table.startIndex }, rowIndices: [ri],
    tableRowStyle: { minRowHeight: pt(0) }, fields: "minRowHeight",
  } });
}
await docs.documents.batchUpdate({ documentId: id, requestBody: { requests } });
console.log(`абзацев выровнено и строк без минимальной высоты: ${requests.length}`);
