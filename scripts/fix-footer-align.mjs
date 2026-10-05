// Подписи в колонтитуле — по левому краю текста (Даша, 05.10.2026):
// node scripts/fix-footer-align.mjs <documentId> [см]
// В колонтитуле подписи (Seller’s signature… / Buyer’s signature…) — таблица, у ячеек поле
// слева 0,18 см, поэтому строки начинались правее основного текста. Поле слева — 0, ширина
// таблицы — как у текста (16,75 см, пропорционально по колонкам). Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
const widthCm = Number(process.argv[3] || 16.75);
if (!documentId) throw new Error("укажи ID документа");
const width = (widthCm * 72) / 2.54;
const { docs } = getBotClients();

const doc = (await docs.documents.get({ documentId })).data;
const requests = [];
for (const [segmentId, footer] of Object.entries(doc.footers || {})) {
  for (const b of footer.content) {
    if (!b.table || !JSON.stringify(b.table).includes("signature")) continue;
    const at = { index: b.startIndex, segmentId };
    requests.push({ updateTableCellStyle: {
      tableStartLocation: at,
      tableCellStyle: { paddingLeft: { magnitude: 0, unit: "PT" } }, fields: "paddingLeft",
    } });
    const cols = b.table.tableStyle.tableColumnProperties;
    if (!cols.every((c) => c.widthType === "FIXED_WIDTH" && c.width)) continue;
    const total = cols.reduce((sum, c) => sum + c.width.magnitude, 0);
    cols.forEach((c, i) => requests.push({ updateTableColumnProperties: {
      tableStartLocation: at, columnIndices: [i],
      tableColumnProperties: { widthType: "FIXED_WIDTH", width: { magnitude: (c.width.magnitude * width) / total, unit: "PT" } },
      fields: "widthType,width",
    } }));
  }
}
if (!requests.length) throw new Error("таблица подписей в колонтитуле не найдена");
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`колонтитул: поле слева 0, ширина ${widthCm} см`);
