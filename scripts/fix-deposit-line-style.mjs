// Строка Security Deposit в PAYMENT TABLE готовых шаблонов (№3–№6) — обычным начертанием:
//   node scripts/fix-deposit-line-style.mjs <documentId>
// Там вся строка — один плейсхолдер {{buyer/seller_security_deposit_table_line}}, и в чистовике он был залит
// жёлтым и жирным, поэтому в договоре жёлтой и жирной выходила вся строка (Алина, 07.10.2026). Жирное и жёлтое
// теперь размечает код (buildDepositTableLine), как в №1. Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const content = (await docs.documents.get({ documentId })).data.body.content;
const requests = [];
const walk = (blocks) => blocks.forEach((b) => {
  if (b.table) b.table.tableRows.forEach((r) => r.tableCells.forEach((c) => walk(c.content)));
  for (const e of b.paragraph?.elements || []) {
    const text = e.textRun?.content || "";
    for (const side of ["buyer", "seller"]) {
      const ph = `{{${side}_security_deposit_table_line}}`;
      const at = text.indexOf(ph);
      if (at === -1) continue;
      const st = e.textRun.textStyle || {};
      if (!st.bold && !st.backgroundColor?.color) continue;
      requests.push({ updateTextStyle: {
        range: { startIndex: e.startIndex + at, endIndex: e.startIndex + at + ph.length },
        textStyle: { bold: false, backgroundColor: {} }, fields: "bold,backgroundColor",
      } });
    }
  }
});
walk(content);
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`плейсхолдеров депозита без жирного и жёлтого: ${requests.length}`);
