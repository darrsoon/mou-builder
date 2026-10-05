// Подписи не отрываются от последнего Article (Даша, 05.10.2026):
// node scripts/fix-keep-signatures.mjs <documentId>
// От заголовка последнего Article до конца документа — «Не отрывать от следующего»
// и «Не разрывать абзац». Если хвост не помещается на странице, Google Docs переносит
// последний Article вместе со всеми подписями, а блок подписи не рвётся между страницами.
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");

const ps = (await docs.documents.get({ documentId })).data.body.content.filter((b) => b.paragraph);
const from = ps.findLastIndex((b) => /^(\{\{[^}]*\}\})*Article \{\{/.test(text(b)));
if (from === -1) throw new Error("последний Article не найден");
const tail = ps.slice(from);
const style = (b, keepWithNext) => ({ updateParagraphStyle: {
  range: { startIndex: b.startIndex, endIndex: b.endIndex },
  paragraphStyle: { keepWithNext, keepLinesTogether: true },
  fields: "keepWithNext,keepLinesTogether",
} });
const requests = tail.map((b, i) => style(b, i < tail.length - 1));
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`с «${text(tail[0]).trim()}»: ${tail.length} абзацев держатся вместе`);
