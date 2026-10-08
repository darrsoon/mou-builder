// Пункты a, b, c… в «Terms and conditions» — с отступами как в №1 (Алина, 08.10.2026):
// буква на −10.91 pt, текст и перенос строк — на 7.09 pt (в чистовиках №2–№6 было 3.26 / 21.26 или 0 / 0);
// интервалы до/после 0 и межстрочный 1.15 — явно, как в №1 (иначе брались из стиля документа, и между пунктами
// появлялся лишний воздух).
//   node scripts/fix-terms-indent.mjs <documentId>
// Правит отступы абзацев списка сразу после «Terms and conditions:». Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";

const START = 7.086614173228344;
const FIRST = -10.913385826771655;
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const ps = (await docs.documents.get({ documentId })).data.body.content.filter((b) => b.paragraph);
const txt = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");
const head = ps.findIndex((b) => /Terms and conditions/.test(txt(b)));
const requests = [];
for (const b of head === -1 ? [] : ps.slice(head + 1)) {
  if (!b.paragraph.bullet) break;
  const st = b.paragraph.paragraphStyle;
  const same = Math.abs((st.indentStart?.magnitude ?? 0) - START) < 0.01 && Math.abs((st.indentFirstLine?.magnitude ?? 0) - FIRST) < 0.01
    // ноль Google отдаёт без magnitude, «не задано» — без самого поля
    && st.spaceAbove && !st.spaceAbove.magnitude && st.spaceBelow && !st.spaceBelow.magnitude && st.lineSpacing === 115;
  if (same) continue;
  requests.push({ updateParagraphStyle: {
    range: { startIndex: b.startIndex, endIndex: b.endIndex },
    paragraphStyle: { indentStart: { magnitude: START, unit: "PT" }, indentFirstLine: { magnitude: FIRST, unit: "PT" },
      spaceAbove: { magnitude: 0, unit: "PT" }, spaceBelow: { magnitude: 0, unit: "PT" }, lineSpacing: 115 },
    fields: "indentStart,indentFirstLine,spaceAbove,spaceBelow,lineSpacing",
  } });
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`пунктов Terms and conditions с отступами как в №1: ${requests.length}`);
