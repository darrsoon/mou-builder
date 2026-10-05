// Payment Table по колонкам как Property Details (Даша, 05.10.2026):
// node scripts/fix-payment-columns.mjs <documentId>
// Обе таблицы шириной с текст, но разделитель колонок не совпадал: левая колонка
// Property Details 8,43 см, Payment Table — 8,37 см. Левая колонка Payment Table = левой
// колонке Property Details, правая — остаток до общей ширины Property Details.
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;
const find = (title) => doc.body.content.find((b) => b.table && JSON.stringify(b.table).includes(title));
const details = find("PROPERTY DETAILS");
const payment = find("PAYMENT TABLE");
if (!details || !payment) throw new Error("таблицы не найдены");

const dCols = details.table.tableStyle.tableColumnProperties.map((c) => c.width.magnitude);
const total = dCols.reduce((a, b) => a + b, 0);
const widths = [dCols[0], total - dCols[0]];
if (payment.table.tableStyle.tableColumnProperties.length !== 2) throw new Error("в Payment Table не 2 колонки");
const requests = widths.map((w, i) => ({ updateTableColumnProperties: {
  tableStartLocation: { index: payment.startIndex }, columnIndices: [i],
  tableColumnProperties: { widthType: "FIXED_WIDTH", width: { magnitude: w, unit: "PT" } },
  fields: "widthType,width",
} }));
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
const cm = (pt) => (pt / (72 / 2.54)).toFixed(2);
console.log(`Payment Table: ${cm(widths[0])} + ${cm(widths[1])} см (как Property Details, ${cm(total)} см)`);
