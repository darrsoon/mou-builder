// Первый абзац после PAYMENT TABLE — с интервалом 12 pt сверху и снизу, как у соседних абзацев и в №1–№4
// (Алина, 29.10.2026: в №5/№6 «Part of the Selling Price…» стоял вплотную к таблице).
//   node scripts/fix-after-payment-table.mjs <documentId>
// Повтор безопасен: если интервал уже есть — ничего не делает.
import { getBotClients } from "./google-bot.mjs";

const GAP = 12;
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const content = (await docs.documents.get({ documentId })).data.body.content;
const i = content.findIndex((b) => b.table && JSON.stringify(b.table.tableRows[0]).includes("PAYMENT TABLE"));
if (i === -1) throw new Error("PAYMENT TABLE не найдена");
const next = content[i + 1];
const ps = next?.paragraph?.paragraphStyle;
if (!ps) throw new Error("после таблицы не абзац");
if ((ps.spaceAbove?.magnitude ?? 0) >= GAP) {
  console.log("интервал уже есть");
} else {
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ updateParagraphStyle: {
    range: { startIndex: next.startIndex, endIndex: next.endIndex },
    paragraphStyle: { spaceAbove: { magnitude: GAP, unit: "PT" }, spaceBelow: { magnitude: GAP, unit: "PT" } },
    fields: "spaceAbove,spaceBelow",
  } }] } });
  console.log(`интервал ${GAP} pt после таблицы`);
}
