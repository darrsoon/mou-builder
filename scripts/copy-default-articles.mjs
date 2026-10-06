// Статьи о дефолте Покупателя и Продавца — как в №1 (Даша, 06.10.2026: «формулировка с liquidated
// damages работает одинаково во всех шаблонах»): node scripts/copy-default-articles.mjs <откуда> <куда>
// Переносит из шаблона-источника (№1) всё, что идёт после «In the event that the Buyer/Seller fails…»
// до «The … shall have no further claim…» включительно: текст с условиями {{#if}}, жирный шрифт,
// подсветку, отступы списка a)/b). Первый абзац статьи и заголовок остаются свои.
// Повторный запуск даёт тот же результат (блок просто перезаписывается).
import { getBotClients } from "./google-bot.mjs";

const [sourceId, targetId] = process.argv.slice(2);
if (!sourceId || !targetId) throw new Error("укажи ID источника и ID шаблона, куда переносить");
const { docs } = getBotClients();
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");

function blocks(doc) {
  const ps = doc.body.content.filter((b) => b.paragraph);
  return ["Buyer", "Seller"].map((side) => {
    const from = ps.findIndex((b) => text(b).startsWith(`In the event that the ${side} fails to complete`));
    const to = ps.findIndex((b, i) => i > from && text(b).replace(/^\u000b/, "").startsWith(`The ${side} shall have no further claim`));
    if (from === -1 || to === -1) throw new Error(`${doc.title}: не найдена статья о дефолте (${side})`);
    return ps.slice(from + 1, to + 1);
  });
}

const source = (await docs.documents.get({ documentId: sourceId })).data;
const target = (await docs.documents.get({ documentId: targetId })).data;
const src = blocks(source);
const dst = blocks(target);

const PARA_FIELDS = ["alignment", "indentStart", "indentFirstLine", "indentEnd", "spaceAbove", "spaceBelow",
  "lineSpacing", "keepWithNext", "keepLinesTogether"];
const TEXT_FIELDS = ["bold", "italic", "underline", "backgroundColor", "foregroundColor", "fontSize", "weightedFontFamily"];

const requests = [];
// сначала Продавец (он ниже), потом Покупатель — индексы выше не съезжают
for (const k of [1, 0]) {
  const at = dst[k][0].startIndex;
  const end = dst[k].at(-1).endIndex;
  const body = src[k].map(text).join("");
  requests.push({ deleteContentRange: { range: { startIndex: at, endIndex: end } } });
  requests.push({ insertText: { location: { index: at }, text: body } });
  let offset = 0;
  for (const p of src[k]) {
    const len = text(p).length;
    const ps = p.paragraph.paragraphStyle || {};
    const fields = PARA_FIELDS.filter((f) => ps[f] !== undefined);
    requests.push({ updateParagraphStyle: {
      range: { startIndex: at + offset, endIndex: at + offset + len },
      paragraphStyle: Object.fromEntries(fields.map((f) => [f, ps[f]])),
      fields: PARA_FIELDS.join(","),
    } });
    for (const e of p.paragraph.elements || []) {
      if (!e.textRun) continue;
      const rel = e.startIndex - p.startIndex;
      const ts = e.textRun.textStyle || {};
      requests.push({ updateTextStyle: {
        range: { startIndex: at + offset + rel, endIndex: at + offset + rel + e.textRun.content.length },
        textStyle: Object.fromEntries(TEXT_FIELDS.filter((f) => ts[f] !== undefined).map((f) => [f, ts[f]])),
        fields: TEXT_FIELDS.join(","),
      } });
    }
    offset += len;
  }
}
await docs.documents.batchUpdate({ documentId: targetId, requestBody: { requests } });
console.log(`перенесено абзацев: Покупатель ${src[0].length}, Продавец ${src[1].length} (было ${dst[0].length} и ${dst[1].length})`);
