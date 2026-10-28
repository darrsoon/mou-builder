// Готовые объекты (№3–№6): строка «Tasleem Fee: AED {{tasleem_fee}} / to be paid by the Buyer» в PAYMENT TABLE —
// последней перед Security Deposit (Алина, 28.10.2026; сумма неизменная, 1,315 — умолчание в реестре).
// Оформление как у соседних строк: подпись жирным, «AED …» жирным и жёлтым, « / » и «Buyer» жирным.
//   node scripts/add-tasleem-row.mjs <documentId>
// Повтор безопасен: если строка уже есть — ничего не делает.
import { getBotClients } from "./google-bot.mjs";

const LABEL = "Tasleem Fee:";
const VALUE = "AED {{tasleem_fee}}";
const TEXT = `${VALUE} / to be paid by the Buyer`;
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();

const rowText = (row) => JSON.stringify(row);
async function paymentTable() {
  const content = (await docs.documents.get({ documentId })).data.body.content;
  const block = content.find((b) => b.table && rowText(b.table.tableRows[0]).includes("PAYMENT TABLE"));
  if (!block) throw new Error("PAYMENT TABLE не найдена");
  return block;
}

let block = await paymentTable();
if (block.table.tableRows.some((r) => rowText(r).includes("Tasleem Fee"))) {
  console.log("строка уже есть");
  process.exit(0);
}
const depositRow = block.table.tableRows.findIndex((r) => rowText(r).includes("{{#row any_deposit}}"));
if (depositRow < 2) throw new Error("строка Security Deposit не найдена");

await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ insertTableRow: {
  tableCellLocation: { tableStartLocation: { index: block.startIndex }, rowIndex: depositRow - 1, columnIndex: 0 },
  insertBelow: true,
} }] } });

const cellStart = (row, col) => row.tableCells[col].content[0].startIndex;
block = await paymentTable();
let row = block.table.tableRows[depositRow];
// сначала правая ячейка: вставка в левую сдвинула бы её индексы
await docs.documents.batchUpdate({ documentId, requestBody: { requests: [
  { insertText: { location: { index: cellStart(row, 1) }, text: TEXT } },
  { insertText: { location: { index: cellStart(row, 0) }, text: LABEL } },
] } });

block = await paymentTable();
row = block.table.tableRows[depositRow];
const l = cellStart(row, 0);
const v = cellStart(row, 1);
const base = { fontSize: { magnitude: 10, unit: "PT" }, weightedFontFamily: { fontFamily: "Lora", weight: 400 }, bold: false, backgroundColor: {} };
const style = (start, end, textStyle) => ({ updateTextStyle: {
  range: { startIndex: start, endIndex: end }, textStyle: { ...base, ...textStyle }, fields: "bold,fontSize,weightedFontFamily,backgroundColor",
} });
const at = (s) => v + TEXT.indexOf(s);
await docs.documents.batchUpdate({ documentId, requestBody: { requests: [
  style(l, l + LABEL.length, { bold: true }),
  style(v, v + TEXT.length, {}),
  style(v, v + VALUE.length, { bold: true, backgroundColor: { color: { rgbColor: { red: 1, green: 1 } } } }),
  style(at(" / "), at(" / ") + 3, { bold: true }),
  style(at("Buyer"), at("Buyer") + "Buyer".length, { bold: true }),
] } });
console.log(`строка добавлена после строки ${depositRow - 1}`);
