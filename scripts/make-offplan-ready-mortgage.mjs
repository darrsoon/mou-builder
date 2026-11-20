// №7 Off-plan Ready to Mortgage (Алина, 20.11.2026; эталон docx «18. DRAFT Off-plan ready to Mortgage»
// 1UsU9DeDV8GPqrcegeZj7rHKVERSSE4su): собирается из копии принятого №2 — все правила и оформление переходят сами;
// отличия только в PAYMENT TABLE:
//   - ADM Fee: «… to <payee> by online / bank transfer after the valuation is done» вместо «after valuation by a Manager’s Cheque»;
//   - «ADM Valuation Fee: AED … / to be paid by the Buyer on the Transfer Date by Card» перед ADM Electronic Fee;
//   - строк «ADM Electronic Fee» и «ADM Verification Certificate» нет (Алина 20.11: «есть некоторые, которые убрали»).
// Строка ADM Electronic переписывается в ADM Valuation Fee (то же место в таблице), ADM Verification удаляется.
//   node scripts/make-offplan-ready-mortgage.mjs <documentId>
// Повтор безопасен: сделанные шаги пропускаются.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();

const YELLOW = { color: { rgbColor: { red: 1, green: 1 } } };
const VALUATION = {
  label: "ADM Valuation Fee:",
  value: [["AED {{adm_valuation_fee}}", true, true], [" / ", true], ["to be paid by the "], ["Buyer", true], [" on the "],
    ["Transfer Date", true], [" by Card"]],
};

// 1. ADM Fee: способ оплаты как в эталоне
const res = await applyEdits(docs, documentId, [
  { find: "{{adm_fee_payee}} after valuation by a Manager’s Cheque",
    replace: "{{adm_fee_payee}} by online / bank transfer after the valuation is done", bold: false,
    runs: [[0, 17, true], [44, 71, true]], noHighlight: [[17, 71]], note: "ADM Fee: by online / bank transfer after the valuation is done" },
]);
console.log(JSON.stringify(res.failed.length ? res : { done: res.done }));

// 2. ADM Electronic Fee → ADM Valuation Fee; строки ADM Verification Certificate нет (в эталоне убраны обе прежние)
const cellText = (cell) => cell.content.map((p) => (p.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("")).join("");
const loadTable = async () => {
  const c = (await docs.documents.get({ documentId })).data.body.content;
  return c.find((b) => b.table && JSON.stringify(b.table.tableRows[0]).includes("PAYMENT TABLE"));
};
let table = await loadTable();
let rows = table.table.tableRows;
const find = (label) => rows.findIndex((r) => cellText(r.tableCells[0]).startsWith(label));

// ячейку целиком: удалить текст (кроме последнего переноса), вставить и оформить по кускам
async function setCell(rowIndex, col, segments) {
  table = await loadTable();
  rows = table.table.tableRows;
  const cell = rows[rowIndex].tableCells[col];
  const start = cell.content[0].startIndex;
  const end = cell.content[cell.content.length - 1].endIndex - 1;
  const text = segments.map(([t]) => t).join("");
  const requests = [];
  if (end > start) requests.push({ deleteContentRange: { range: { startIndex: start, endIndex: end } } });
  requests.push({ insertText: { location: { index: start }, text } });
  let at = start;
  for (const [t, bold = false, highlight = false] of segments) {
    requests.push({ updateTextStyle: { range: { startIndex: at, endIndex: at + t.length },
      textStyle: { bold, backgroundColor: highlight ? YELLOW : {} }, fields: "bold,backgroundColor" } });
    at += t.length;
  }
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
}

if (find("ADM Valuation Fee") === -1) {
  const i = find("ADM Electronic Fee");
  if (i === -1) throw new Error("нет строки ADM Electronic Fee — правлю руками");
  await setCell(i, 1, VALUATION.value);
  await setCell(i, 0, [[VALUATION.label, true]]);
  console.log("ADM Electronic Fee → ADM Valuation Fee");
}
// лишние строки удаляем с конца таблицы: индексы выше не сдвигаются
for (const label of ["ADM Verification Certificate", "ADM Electronic Fee"]) {
  table = await loadTable();
  rows = table.table.tableRows;
  const i = find(label);
  if (i === -1) continue;
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ deleteTableRow: {
    tableCellLocation: { tableStartLocation: { index: table.startIndex }, rowIndex: i, columnIndex: 0 } } }] } });
  console.log(`строка ${label} удалена`);
}
