// Пустые строки, когда депозитов нет (Даша, 06.10.2026): node scripts/fix-nodeposit-gaps.mjs <documentId>
// Движок, вырезая блок целиком, забирает соседнюю пустую строку (сначала ту, что после, иначе ту,
// что перед). Без депозитов из-за этого пропадали:
// 1. пустая строка перед «The Buyer/Seller shall have no further claim…» (её забирал блок a)/b)) —
//    теперь это перенос (\u000b) в начале самого абзаца;
// 2. пустая строка перед статьёй, идущей сразу за статьёй о депозите / о возврате депозита: между ними
//    был не пустой абзац, а интервал после абзаца, и блок забирал пустую строку ПЕРЕД собой —
//    теперь перед такой статьёй обычная пустая строка (её и заберёт блок), интервал после абзаца — 0.
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");
const plain = (b) => text(b).replace(/\{\{[#/][^}]*\}\}/g, "").trim();

const ps = (await docs.documents.get({ documentId })).data.body.content.filter((b) => b.paragraph);
const edits = [];
ps.forEach((b, i) => {
  const prev = ps[i - 1];
  if (!prev) return;
  // 1. «The … shall have no further claim» с пустой строкой-абзацем перед ним
  if (/^The (Buyer|Seller) shall have no further claim/.test(text(b)) && text(prev) === "\n") {
    edits.push({ at: prev.startIndex, requests: [
      { deleteContentRange: { range: { startIndex: prev.startIndex, endIndex: prev.endIndex } } },
      { insertText: { location: { index: prev.startIndex }, text: "\u000b" } },
    ] });
  } else if (/^The (Buyer|Seller) shall have no further claim/.test(text(b))) {
    // в №2/№4 (ст. о дефолте Продавца) пустой строки не было вовсе — ставим, как в №1
    edits.push({ at: b.startIndex, requests: [{ insertText: { location: { index: b.startIndex }, text: "\u000b" } }] });
  }
  // «Upon Seller Default…» вплотную к тексту статьи (№2/№4) — пустая строка внутри условия
  const upon = text(b).match(/^(\{\{#if !(?:buyer|seller)_deposit\}\})Upon /);
  if (upon && text(prev) !== "\n") {
    edits.push({ at: b.startIndex, requests: [{ insertText: { location: { index: b.startIndex + upon[1].length }, text: "\u000b" } }] });
  }
  // 2. заголовок статьи сразу после абзаца, которым кончается блок с условием
  if (/^Article (\{\{|\d+$)/.test(plain(b)) && !/^\{\{#if/.test(text(b)) && text(prev) !== "\n" && text(prev).includes("{{/if}}")) {
    edits.push({ at: b.startIndex, requests: [
      { updateParagraphStyle: {
        range: { startIndex: prev.startIndex, endIndex: prev.endIndex },
        paragraphStyle: { spaceBelow: { magnitude: 0, unit: "PT" } }, fields: "spaceBelow",
      } },
      { insertText: { location: { index: b.startIndex }, text: "\n" } },
      // новая пустая строка берёт стиль заголовка — делаем её обычной
      { updateParagraphStyle: {
        range: { startIndex: b.startIndex, endIndex: b.startIndex + 1 },
        paragraphStyle: { keepWithNext: true, spaceAbove: { magnitude: 0, unit: "PT" }, spaceBelow: { magnitude: 0, unit: "PT" } },
        fields: "keepWithNext,spaceAbove,spaceBelow",
      } },
      { updateTextStyle: { range: { startIndex: b.startIndex, endIndex: b.startIndex + 1 }, textStyle: {}, fields: "bold,underline" } },
    ] });
  }
});
const requests = edits.sort((a, b) => b.at - a.at).flatMap((e) => e.requests);
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`исправлено мест: ${edits.length}`);
