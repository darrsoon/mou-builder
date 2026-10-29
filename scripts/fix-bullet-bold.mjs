// Буквы и номера списков (a., b., c. …) — обычным, как в Off-plan №1 (Алина, 29.10.2026: в №5/№6 «c.» у
// «Mortgage Release» была жирной). Стиль маркера через API не меняется (ни правкой конца абзаца, ни всего
// абзаца), поэтому пункт пересоздаётся: в конце предыдущего пункта того же списка (маркер у него обычный)
// вставляется перенос строки и текст пункта, оформление слов переносится как было, старый абзац удаляется.
// Список и нумерация остаются те же.
//   node scripts/fix-bullet-bold.mjs <documentId>
// Повтор безопасен: правятся только пункты с жирным маркером.
import { getBotClients } from "./google-bot.mjs";

const STYLE_FIELDS = ["bold", "italic", "underline", "strikethrough", "backgroundColor", "foregroundColor", "fontSize",
  "weightedFontFamily", "baselineOffset", "smallCaps", "link"];
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const load = async () => (await docs.documents.get({ documentId })).data.body.content;

let fixed = 0;
for (;;) {
  const content = await load();
  const i = content.findIndex((b) => b.paragraph?.bullet?.textStyle?.bold);
  if (i === -1) break;
  const old = content[i];
  const prev = content[i - 1];
  if (prev?.paragraph?.bullet?.listId !== old.paragraph.bullet.listId || prev.paragraph.bullet.textStyle?.bold) {
    throw new Error("перед жирным пунктом нет обычного пункта того же списка — правлю руками");
  }
  const runs = old.paragraph.elements.filter((e) => e.textRun).map((e) => ({
    text: e.textRun.content.replace(/\n$/, ""), style: e.textRun.textStyle || {},
  })).filter((r) => r.text);
  const text = runs.map((r) => r.text).join("");
  const at = prev.endIndex - 1; // перед переносом строки предыдущего пункта
  // новый абзац встаёт сразу за предыдущим; старый сдвигается на длину вставки
  const shift = text.length + 1;
  const requests = [
    { insertText: { location: { index: at }, text: `\n${text}` } },
    { deleteContentRange: { range: { startIndex: old.startIndex + shift, endIndex: old.endIndex + shift } } },
  ];
  let pos = at + 1;
  for (const r of runs) {
    requests.push({ updateTextStyle: { range: { startIndex: pos, endIndex: pos + r.text.length }, textStyle: r.style,
      fields: STYLE_FIELDS.join(",") } });
    pos += r.text.length;
  }
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
  fixed += 1;
  if (fixed > 20) throw new Error("слишком много пунктов — что-то не так");
}
console.log(`пунктов с обычным маркером: ${fixed}`);
