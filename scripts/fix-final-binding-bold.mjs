// Предложение после Payment Table («The Selling Price … set out in the Payment Table are final and binding …») —
// термины жирным, как в драфте 1 (Алина, 16.10.2026): Selling Price, Seller, Agency Fee, Payment Table, Parties,
// Commission Agreement. В №2–№6 жирным было только «Payment Table», в №1 — кроме «Seller» в варианте без комиссии.
//   node scripts/fix-final-binding-bold.mjs <documentId>
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";

const TERMS = ["Selling Price", "Seller", "Agency Fee", "Payment Table", "Parties", "Commission Agreement"];
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const { chars, text } = buildIndex((await docs.documents.get({ documentId })).data);
const anchor = text.indexOf("set out in the Payment Table");
if (anchor === -1) { console.log("предложение не найдено"); process.exit(0); }
const from = text.lastIndexOf("\n", anchor) + 1;
const to = text.indexOf("\n", anchor);
const requests = [];
for (const term of TERMS) {
  const re = new RegExp(`\\b${term}\\b(?!’)`, "g");
  for (const m of text.slice(from, to).matchAll(re)) {
    const span = chars.slice(from + m.index, from + m.index + term.length);
    if (span.every((c) => c.bold)) continue;
    requests.push({ updateTextStyle: { range: { startIndex: span[0].i, endIndex: span[span.length - 1].i + 1 },
      textStyle: { bold: true }, fields: "bold" } });
  }
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`терминов сделано жирными: ${requests.length}`);
