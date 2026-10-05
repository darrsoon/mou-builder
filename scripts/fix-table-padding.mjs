// Одинаковый отступ текста от края ячейки (Даша, 05.10.2026):
// node scripts/fix-table-padding.mjs <documentId> [pt]
// В Property Details было поле ячейки 0 + отступ абзаца 2 pt, в Payment Table — стандартное
// поле ~5 pt без отступа, текст начинался на разном расстоянии от рамки. Теперь в обеих
// таблицах поле ячейки слева/справа = pt (по умолчанию 2), отступы абзацев в ячейках — 0.
// Строку-заголовок (PROPERTY DETAILS / PAYMENT TABLE, по центру) по абзацам не трогаем.
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
const pad = Number(process.argv[3] || 2);
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const text = (el) => JSON.stringify(el.table || "");
const zero = { magnitude: 0, unit: "PT" };

const doc = (await docs.documents.get({ documentId })).data;
const tables = doc.body.content.filter((b) => b.table && /PROPERTY DETAILS|PAYMENT TABLE/.test(text(b)));
if (tables.length !== 2) throw new Error(`ожидались 2 таблицы, найдено ${tables.length}`);

const requests = [];
for (const t of tables) {
  requests.push({ updateTableCellStyle: {
    tableStartLocation: { index: t.startIndex },
    tableCellStyle: { paddingLeft: { magnitude: pad, unit: "PT" }, paddingRight: { magnitude: pad, unit: "PT" } },
    fields: "paddingLeft,paddingRight",
  } });
  t.table.tableRows.slice(1).forEach((row) => row.tableCells.forEach((cell) => cell.content.forEach((p) => {
    if (!p.paragraph) return;
    requests.push({ updateParagraphStyle: {
      range: { startIndex: p.startIndex, endIndex: p.endIndex },
      paragraphStyle: { indentStart: zero, indentFirstLine: zero, indentEnd: zero },
      fields: "indentStart,indentFirstLine,indentEnd",
    } });
  })));
}
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`Property Details и Payment Table: поле ячейки ${pad} pt, отступы текста 0`);
