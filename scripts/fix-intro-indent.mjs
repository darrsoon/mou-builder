// Вводная часть (от «BY AND BETWEEN» до «Terms and conditions»): отступы абзацев — как в Off-plan №1
// (Алина, 29.10.2026: «нет отступов у имени, возьми эталон по форматированию Off-plan»). Стороны
// ({{seller_party_block}} / {{buyer_party_block}}) — первая строка 36 pt, агентства — 28,5 pt.
// Абзацы сопоставляются по порядку; если вводная часть по составу отличается от №1 — ничего не правим.
//   node scripts/fix-intro-indent.mjs <documentId>
// Повтор безопасен: правятся только абзацы с другими отступами.
import { getBotClients } from "./google-bot.mjs";

const REFERENCE = "1qedPsMWpFLRFqjxPwuK53fXY_43AkkSC5bGc_rAXG0k"; // №1 Off-plan
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();

const text = (b) => b.paragraph.elements.map((e) => e.textRun?.content || "").join("").replace(/\n/g, "");
// абзацы вводной части; ключ — начало текста без пробелов, чтобы сверить состав с №1
async function intro(id) {
  const content = (await docs.documents.get({ documentId: id })).data.body.content;
  const out = [];
  let on = false;
  for (const b of content) {
    if (!b.paragraph) continue;
    const t = text(b);
    if (t.includes("BY AND BETWEEN")) on = true;
    if (/Terms and conditions/.test(t)) break;
    if (on) out.push({ b, key: t.replace(/\s+/g, "").slice(0, 30) });
  }
  return out;
}

const ref = await intro(REFERENCE);
const doc = await intro(documentId);
if (ref.length !== doc.length || ref.some((r, i) => r.key !== doc[i].key)) {
  throw new Error(`вводная часть отличается от №1 (${doc.length} абзацев против ${ref.length}) — правлю руками`);
}
const pt = (v) => v?.magnitude ?? 0;
const requests = [];
doc.forEach(({ b }, i) => {
  const want = ref[i].b.paragraph.paragraphStyle;
  const has = b.paragraph.paragraphStyle;
  if (pt(want.indentFirstLine) === pt(has.indentFirstLine) && pt(want.indentStart) === pt(has.indentStart)) return;
  requests.push({ updateParagraphStyle: {
    range: { startIndex: b.startIndex, endIndex: b.endIndex },
    paragraphStyle: {
      indentFirstLine: { magnitude: pt(want.indentFirstLine), unit: "PT" },
      indentStart: { magnitude: pt(want.indentStart), unit: "PT" },
    },
    fields: "indentFirstLine,indentStart",
  } });
});
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`абзацев поправлено: ${requests.length}`);
