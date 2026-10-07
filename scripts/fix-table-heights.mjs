// Строки таблиц по высоте текста (Даша, 07.10.2026: «если нет текста — уменьшить таблицу»):
//   node scripts/fix-table-heights.mjs <documentId>
// В PROPERTY DETAILS и PAYMENT TABLE у строк (кроме шапки) убирается минимальная высота, у абзацев в ячейках —
// интервал снизу. В шаблонах по чистовикам строки были с минимальной высотой до 2 см и интервалом 12 pt,
// и строка с пустой Additional Information или с одной комиссией оставалась высокой. Повтор безопасен.
// Чтобы текст не прилипал к линиям, ячейкам строк задан отступ сверху и снизу CELL_PAD (Алина, 07.10: «слишком плотно»).
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const content = (await docs.documents.get({ documentId })).data.body.content;
const pt = (m) => ({ magnitude: m, unit: "PT" });
const CELL_PAD = 3;
const requests = [];
let rows = 0;
let padded = 0;
for (const t of content.filter((b) => b.table)) {
  const json = JSON.stringify(t.table);
  if (!json.includes("PROPERTY DETAILS") && !json.includes("PAYMENT TABLE")) continue;
  t.table.tableRows.forEach((row, ri) => {
    if (ri === 0) return; // шапка таблицы — как есть
    if (row.tableRowStyle?.minRowHeight?.magnitude) {
      requests.push({ updateTableRowStyle: {
        tableStartLocation: { index: t.startIndex }, rowIndices: [ri],
        tableRowStyle: { minRowHeight: pt(0) }, fields: "minRowHeight",
      } });
      rows += 1;
    }
    const cells = row.tableCells;
    if (cells.some((c) => c.tableCellStyle?.paddingTop?.magnitude !== CELL_PAD || c.tableCellStyle?.paddingBottom?.magnitude !== CELL_PAD)) {
      requests.push({ updateTableCellStyle: {
        tableRange: { tableCellLocation: { tableStartLocation: { index: t.startIndex }, rowIndex: ri, columnIndex: 0 }, rowSpan: 1, columnSpan: cells.length },
        tableCellStyle: { paddingTop: pt(CELL_PAD), paddingBottom: pt(CELL_PAD) }, fields: "paddingTop,paddingBottom",
      } });
      padded += 1;
    }
    for (const cell of cells) for (const p of cell.content) {
      if (!p.paragraph?.paragraphStyle?.spaceBelow?.magnitude) continue;
      requests.push({ updateParagraphStyle: {
        range: { startIndex: p.startIndex, endIndex: p.endIndex },
        paragraphStyle: { spaceBelow: pt(0) }, fields: "spaceBelow",
      } });
    }
  });
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`строк без минимальной высоты: ${rows}, строк с отступом ${CELL_PAD} pt: ${padded}, абзацев без интервала снизу: ${requests.length - rows - padded}`);
