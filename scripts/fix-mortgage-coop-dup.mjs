// №2 Off-plan mortgage: абзац «The Seller shall cooperate with the Buyer’s financing bank…» стоял дважды —
// в статье об обязательствах Продавца (комментарий Даши «только off plan cash») и в статье о документах (AML).
// Алина, 08.10.2026: убрать из первой, оставить во второй.
//   node scripts/fix-mortgage-coop-dup.mjs <documentId>
// Удаляет первое вхождение абзаца, только если вхождений два. Абзацу перед ним («Any prepaid service…») снимает
// интервал после (12 pt): он отделял удалённый абзац и вместе с пустой строкой давал двойной отступ (Алина, 08.10).
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;
const { chars, text } = buildIndex(doc);
const PARA = "The Seller shall cooperate with the Buyer’s financing bank and provide, in a timely manner, all documents required for mortgage approval and registration at the Abu Dhabi Real Estate Centre.\n";
const first = text.indexOf(PARA);
const second = first === -1 ? -1 : text.indexOf(PARA, first + 1);
if (second === -1) {
  console.log("абзац один или не найден — правок нет");
} else {
  const startIndex = chars[first].i;
  const endIndex = chars[first + PARA.length - 1].i + 1;
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ deleteContentRange: { range: { startIndex, endIndex } } }] } });
  console.log("удалено первое вхождение абзаца");
}

const after = (await docs.documents.get({ documentId })).data.body.content.filter((b) => b.paragraph);
const pText = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");
const k = after.findIndex((b) => pText(b).startsWith("Any prepaid service or maintenance charges"));
if (k !== -1 && pText(after[k + 1] || { paragraph: {} }) === "\n" && after[k].paragraph.paragraphStyle.spaceBelow?.magnitude) {
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ updateParagraphStyle: {
    range: { startIndex: after[k].startIndex, endIndex: after[k].endIndex },
    paragraphStyle: { spaceBelow: { magnitude: 0, unit: "PT" } }, fields: "spaceBelow",
  } }] } });
  console.log("снят интервал после «Any prepaid service…»");
}
