// Ширина текста по правому краю (Даша, 05.10.2026): node scripts/fix-text-width.mjs <documentId> [см]
// Левое поле не трогаем, правое — так, чтобы текст кончался на 16,75 см по линейке;
// таблицы с фиксированной шириной колонок растягиваются (пропорционально) на ту же ширину,
// чтобы их правый край совпал с текстом. Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
const widthCm = Number(process.argv[3] || 16.75);
if (!documentId) throw new Error("укажи ID документа");
const PT_PER_CM = 72 / 2.54;
const width = widthCm * PT_PER_CM;
const { docs } = getBotClients();

const doc = (await docs.documents.get({ documentId })).data;
const ds = doc.documentStyle;
const marginRight = ds.pageSize.width.magnitude - ds.marginLeft.magnitude - width;
const requests = [{ updateDocumentStyle: {
  documentStyle: { marginRight: { magnitude: marginRight, unit: "PT" } }, fields: "marginRight",
} }];

for (const b of doc.body.content) {
  if (!b.table) continue;
  const cols = b.table.tableStyle.tableColumnProperties;
  if (!cols.every((c) => c.widthType === "FIXED_WIDTH" && c.width)) continue;
  const total = cols.reduce((s, c) => s + c.width.magnitude, 0);
  cols.forEach((c, i) => requests.push({ updateTableColumnProperties: {
    tableStartLocation: { index: b.startIndex }, columnIndices: [i],
    tableColumnProperties: { widthType: "FIXED_WIDTH", width: { magnitude: (c.width.magnitude * width) / total, unit: "PT" } },
    fields: "widthType,width",
  } }));
}
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`правое поле ${(marginRight / PT_PER_CM).toFixed(2)} см, текст и таблицы ${widthCm} см`);
