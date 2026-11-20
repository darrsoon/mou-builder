// №8 Off-plan Ready to Cash (Алина, 20.11.2026; эталон docx «19. DRAFT Off-plan ready to Cash»
// 1MGSsXdqVtonABR9e1H-RNFIruB8ADbYP): собирается из копии принятого №1 — все правила и оформление переходят сами;
// отличия только в PAYMENT TABLE, строки ADM — как в №7 (Алина 20.11: «в 8 adm fee такая формулировка и adm valuation fee»):
//   - вместо строки «2% from the Selling Price + AED 575» — «ADM Fee: AED … / (2% from the Selling Price or as per ADM
//     valuation (whatever comes higher)) to be paid by the Buyer to <payee> by online / bank transfer after the valuation is done»
//     (сумма — 2% без ADM Admin Fee: offplanReadyFees в реестре);
//   - под ней «ADM Valuation Fee: AED … / to be paid by the Buyer on the Transfer Date by Card».
//   node scripts/make-offplan-ready-cash.mjs <documentId>
// Повтор безопасен: если строка ADM Valuation Fee уже есть — ничего не делает.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();

const YELLOW = { color: { rgbColor: { red: 1, green: 1 } } };
const ADM_FEE = {
  label: "ADM Fee:",
  value: [["AED {{adm_fee}}", true, true], [" / ", true], ["(2% from the "], ["Selling Price ", true],
    ["or as per ADM valuation (whatever comes higher)) to be paid by the "], ["Buyer", true], [" to "],
    ["{{adm_fee_payee}}", true, true], [" by online / bank transfer "], ["after the valuation is done", true]],
};
const VALUATION = {
  label: "ADM Valuation Fee:",
  value: [["AED {{adm_valuation_fee}}", true, true], [" / ", true], ["to be paid by the "], ["Buyer", true], [" on the "],
    ["Transfer Date", true], [" by Card"]],
};

const cellText = (cell) => cell.content.map((p) => (p.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("")).join("");
const loadTable = async () => {
  const c = (await docs.documents.get({ documentId })).data.body.content;
  return c.find((b) => b.table && JSON.stringify(b.table.tableRows[0]).includes("PAYMENT TABLE"));
};

// ячейку целиком: удалить текст (кроме последнего переноса), вставить и оформить по кускам
async function setCell(rowIndex, col, segments) {
  const rows = (await loadTable()).table.tableRows;
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

let table = await loadTable();
if (table.table.tableRows.some((r) => cellText(r.tableCells[0]).startsWith("ADM Valuation Fee"))) {
  console.log("строки ADM уже как в №7");
  process.exit(0);
}
const i = table.table.tableRows.findIndex((r) => cellText(r.tableCells[1]).includes("{{adm_fee}}"));
if (i === -1) throw new Error("нет строки с {{adm_fee}} — правлю руками");
await setCell(i, 1, ADM_FEE.value);
await setCell(i, 0, [[ADM_FEE.label, true]]);
table = await loadTable();
await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ insertTableRow: {
  tableCellLocation: { tableStartLocation: { index: table.startIndex }, rowIndex: i, columnIndex: 0 }, insertBelow: true } }] } });
await setCell(i + 1, 1, VALUATION.value);
await setCell(i + 1, 0, [[VALUATION.label, true]]);
console.log("строки: ADM Fee (как в №7), ADM Valuation Fee");
