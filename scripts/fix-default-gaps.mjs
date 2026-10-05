// Пустые строки в статьях о дефолте, когда у стороны нет депозита (Даша, 05.10.2026):
// node scripts/fix-default-gaps.mjs <documentId>
// 1. Перед «This amount shall be distributed as follows:» (ст. 7 и 8) пустой строки не было —
//    теперь перенос (\u000b) внутри условия: «{{#if any_deposit}}\u000bThis amount…».
// 2. Перед «Upon Buyer Default…» (ст. 7) стояла только строка-маркер «{{#if !buyer_deposit}}»,
//    без пустой строки (в ст. 8 перед «Upon Seller Default» она есть) — маркер переносим в начало
//    абзаца с переносом: «{{#if !buyer_deposit}}\u000bUpon Buyer Default…».
// Перенос внутри условия появляется только вместе со своей фразой, движок его не трогает.
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");

const ps = (await docs.documents.get({ documentId })).data.body.content.filter((b) => b.paragraph);
const edits = []; // { at, requests } — применяем снизу вверх
ps.forEach((b, i) => {
  const s = text(b);
  const lead = "{{#if any_deposit}}";
  if (s.startsWith(`${lead}This amount shall be distributed`)) {
    edits.push({ at: b.startIndex, requests: [{ insertText: { location: { index: b.startIndex + lead.length }, text: "\u000b" } }] });
  }
  const marker = s.match(/^(\{\{#if !(?:buyer|seller)_deposit\}\})\n$/);
  if (marker && text(ps[i + 1] || b).startsWith("Upon ")) {
    edits.push({ at: b.startIndex, requests: [
      { deleteContentRange: { range: { startIndex: b.startIndex, endIndex: b.endIndex } } },
      { insertText: { location: { index: b.startIndex }, text: `${marker[1]}\u000b` } },
    ] });
  }
});
const requests = edits.sort((a, b) => b.at - a.at).flatMap((e) => e.requests);
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`исправлено мест: ${edits.length}`);
