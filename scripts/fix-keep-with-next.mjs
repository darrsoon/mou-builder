// Ничего не висит внизу страницы в одиночку (Даша, 05.10.2026):
// node scripts/fix-keep-with-next.mjs <documentId>
// 1. Заголовки (Article …, BY AND BETWEEN:, AND, WHEREAS:) и абзацы, которые кончаются
//    двоеточием («…distributed as follows:»), — «Не отрывать от следующего»; пустая строка
//    сразу после такого абзаца тоже, чтобы цепочка дошла до текста.
// 2. От заголовка последнего Article до конца — «Не отрывать от следующего» и «Не разрывать
//    абзац»: если хвост не влезает, Google Docs переносит последний Article вместе со всеми
//    подписями, блок подписи не рвётся между страницами.
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");
// текст без маркеров условий: «{{#if any_deposit}}Article {{…}}» → «Article {{…}}»
const plain = (b) => text(b).replace(/\{\{[#/][^}]*\}\}/g, "").trim();
const isLead = (b) => /^Article \{\{/.test(plain(b)) || /^(WHEREAS|BY AND BETWEEN|AND)\b/.test(plain(b)) || /:$/.test(plain(b));

const content = (await docs.documents.get({ documentId })).data.body.content;
const style = (b, paragraphStyle) => ({ updateParagraphStyle: {
  range: { startIndex: b.startIndex, endIndex: b.endIndex },
  paragraphStyle, fields: Object.keys(paragraphStyle).join(","),
} });

const ps = content.filter((b) => b.paragraph);
const from = ps.findLastIndex((b) => /^Article \{\{/.test(plain(b)));
if (from === -1) throw new Error("последний Article не найден");

const requests = [];
let leads = 0;
content.forEach((b, i) => {
  if (!b.paragraph || b.startIndex >= ps[from].startIndex || !isLead(b)) return;
  leads += 1;
  requests.push(style(b, { keepWithNext: true }));
  for (let j = i + 1; content[j]?.paragraph && !plain(content[j]); j += 1) requests.push(style(content[j], { keepWithNext: true }));
});
const tail = ps.slice(from);
tail.forEach((b, i) => requests.push(style(b, { keepWithNext: i < tail.length - 1, keepLinesTogether: true })));
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`заголовков и строк с «:» — ${leads}; с «${plain(tail[0])}» до конца ${tail.length} абзацев держатся вместе`);
