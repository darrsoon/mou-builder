// Таблица статьи 4 (PAYMENT TABLE): поля ячеек 5 пт, абзацы без своего отступа и без
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
      paragraphStyle: { indentStart: pt(0), indentFirstLine: pt(0), spaceBelow: pt(0) },
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
// поля ячеек 5 пт слева и справа — текст не упирается в границы таблицы (Даша, 05.10.2026)
requests.push({ updateTableCellStyle: {
  tableRange: { tableCellLocation: { tableStartLocation: { index: table.startIndex }, rowIndex: 1, columnIndex: 0 },
    rowSpan: rows - 1, columnSpan: table.table.columns },
  tableCellStyle: { paddingLeft: pt(5), paddingRight: pt(5) }, fields: "paddingLeft,paddingRight",
} });
await docs.documents.batchUpdate({ documentId: id, requestBody: { requests } });
console.log(`абзацев выровнено и строк без минимальной высоты: ${requests.length}`);
