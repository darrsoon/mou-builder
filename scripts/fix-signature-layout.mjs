// Блок подписей — раскладка по драфту 1 (обновлён Алиной 09.10.2026), одинаково во всех шаблонах:
//   …последний абзац
//   (пустая строка) ×2
//   THE SELLER / Name: … Signature: … / Date:          — заголовок и строки без пустой строки между ними
//   (пустая строка)
//   THE BUYER / Name: … / Date:
//   (пустая строка)                                     — только если есть агентство Продавца
//   SELLER’S AGENCY / Company / Represented by … Signature / Date / Company Stamp
//   (пустая строка)                                     — только если есть агентство Покупателя
//   BUYER’S AGENCY / …
// Интервалов до/после у абзацев нет — отступы только пустыми строками.
//   node scripts/fix-signature-layout.mjs <documentId>
// Блок от «THE SELLER» до конца документа заменяется эталонным (маркеры {{#if seller_agent}} / {{#if buyer_agent}}
// и плейсхолдеры — те же, что были). Перед заменой проверяется, что в заменяемом куске условия сбалансированы.
// После — запустить fix-signature-style (обычный шрифт значений) и fix-keep-with-next. Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";

const SELLER_AGENCY = "SELLER’S AGENCY\vCompany: {{seller_agent_name}}\vRepresented by: {{seller_agent_representative}}  Signature: ________________\vDate: {{seller_signature_date}}\vCompany Stamp";
const BUYER_AGENCY = "BUYER’S AGENCY\vCompany: {{buyer_agent_name}}\vRepresented by: {{buyer_agent_representative}}    Signature: ________________\vDate: {{buyer_signature_date}}\vCompany Stamp";
export const BLOCK = "THE SELLER\v{{seller_signature_block}}\n\nTHE BUYER\v{{buyer_signature_block}}"
  + `{{#if seller_agent}}\n\n${SELLER_AGENCY}{{/if}}{{#if buyer_agent}}\n\n${BUYER_AGENCY}{{/if}}`;
// жирное: заголовки и подписи полей
const BOLD = ["THE SELLER", "THE BUYER", "SELLER’S AGENCY", "BUYER’S AGENCY", "Company: ", "Represented by: ",
  "  Signature: ", "    Signature: ", "Date: ", "Company Stamp"];

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const load = async () => (await docs.documents.get({ documentId })).data.body.content;
const pText = (b) => (b.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("");

let content = await load();
const paras = content.filter((b) => b.paragraph);
const si = paras.findLastIndex((b) => /^\s*THE SELLER/.test(pText(b)));
if (si === -1) throw new Error("«THE SELLER» не найден");
const start = paras[si].startIndex;
const bodyEnd = content[content.length - 1].endIndex;
const oldText = paras.slice(si).map(pText).join("");
const newText = `${BLOCK}\n`;

// уже как надо: блок совпадает и перед ним ровно две пустые строки
const blanksBefore = (() => { let n = 0; for (let k = si - 1; k >= 0 && pText(paras[k]) === "\n"; k -= 1) n += 1; return n; })();
if (oldText.replace(/\n+$/, "") === BLOCK && blanksBefore === 2) {
  console.log("блок подписей уже по драфту 1");
  process.exit(0);
}
const markers = (t) => (t.match(/\{\{[#/][^}]*\}\}/g) || []).join(" ");
if (markers(oldText) !== markers(BLOCK)) {
  throw new Error(`условия в заменяемом куске другие — правлю руками:\n  было:  ${markers(oldText)}\n  нужно: ${markers(BLOCK)}`);
}
for (const ph of ["seller_signature_block", "buyer_signature_block"]) {
  if (!oldText.includes(`{{${ph}}}`)) throw new Error(`нет {{${ph}}} — шаблон устроен иначе`);
}

// 1) заменить блок
const requests = [
  { deleteContentRange: { range: { startIndex: start, endIndex: bodyEnd - 1 } } },
  { insertText: { location: { index: start }, text: BLOCK } },
];
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });

// 2) пустые строки перед «THE SELLER» — ровно две
content = await load();
let ps = content.filter((b) => b.paragraph);
const i2 = ps.findLastIndex((b) => /^THE SELLER/.test(pText(b)));
let n = 0; for (let k = i2 - 1; k >= 0 && pText(ps[k]) === "\n"; k -= 1) n += 1;
if (n < 2) {
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ insertText: { location: { index: ps[i2].startIndex }, text: "\n".repeat(2 - n) } }] } });
} else if (n > 2) {
  await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ deleteContentRange: { range: { startIndex: ps[i2 - n].startIndex, endIndex: ps[i2 - 2].startIndex } } }] } });
}

// 3) оформление блока (и двух пустых строк перед ним): шрифт как у текста договора, жирное — подписи полей,
//    интервалы до/после 0, межстрочный 1.15, по ширине
content = await load();
ps = content.filter((b) => b.paragraph);
const i3 = ps.findLastIndex((b) => /^THE SELLER/.test(pText(b)));
const from = ps[i3 - 2].startIndex;
const blockStart = ps[i3].startIndex;
const to = content[content.length - 1].endIndex - 1;
const ref = ps[i3 - 3].paragraph.elements.find((e) => e.textRun)?.textStyle || {};
const style = [
  { updateParagraphStyle: { range: { startIndex: from, endIndex: to + 1 },
    paragraphStyle: { spaceAbove: { magnitude: 0, unit: "PT" }, spaceBelow: { magnitude: 0, unit: "PT" }, lineSpacing: 115, alignment: "JUSTIFIED" },
    fields: "spaceAbove,spaceBelow,lineSpacing,alignment" } },
  { updateTextStyle: { range: { startIndex: from, endIndex: to },
    textStyle: { bold: false, italic: false, underline: false, backgroundColor: {},
      ...(ref.fontSize ? { fontSize: ref.fontSize } : {}), ...(ref.weightedFontFamily ? { weightedFontFamily: ref.weightedFontFamily } : {}) },
    fields: ["bold", "italic", "underline", "backgroundColor", ref.fontSize && "fontSize", ref.weightedFontFamily && "weightedFontFamily"].filter(Boolean).join(",") } },
];
const text = BLOCK;
for (const label of BOLD) {
  for (let at = text.indexOf(label); at !== -1; at = text.indexOf(label, at + 1)) {
    style.push({ updateTextStyle: { range: { startIndex: blockStart + at, endIndex: blockStart + at + label.length },
      textStyle: { bold: true }, fields: "bold" } });
  }
}
await docs.documents.batchUpdate({ documentId, requestBody: { requests: style } });
console.log(`блок подписей пересобран по драфту 1 (пустых строк перед ним было ${n})`);
