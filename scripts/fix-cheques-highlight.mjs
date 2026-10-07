// «cheque{{#if both_deposits}}s{{/if}} shall be returned to …» — окончание «s» жёлтым (Алина, 07.10.2026: абзац
// о возврате чеков выделяется по выбранным депозитам; стороны выделяет код — deposit_return_parties).
//   node scripts/fix-cheques-highlight.mjs <documentId>
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const content = (await docs.documents.get({ documentId })).data.body.content;
const MARK = "cheque{{#if both_deposits}}s{{/if}}";
const S_AT = "cheque{{#if both_deposits}}".length;
const requests = [];
for (const b of content.filter((x) => x.paragraph)) {
  for (const e of b.paragraph.elements || []) {
    const text = e.textRun?.content || "";
    const at = text.indexOf(MARK);
    if (at === -1 || !text.includes("shall be returned to")) continue;
    if (e.textRun.textStyle?.backgroundColor?.color) continue; // уже выделено (кусок отделился в свой run)
    const start = e.startIndex + at + S_AT;
    requests.push({ updateTextStyle: {
      range: { startIndex: start, endIndex: start + 1 },
      textStyle: { backgroundColor: { color: { rgbColor: { red: 1, green: 1, blue: 0 } } } }, fields: "backgroundColor",
    } });
  }
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`выделено «s» в cheques: ${requests.length}`);
