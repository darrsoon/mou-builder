// Статьи о дефолте Покупателя и Продавца — подсветка как в чистовике 1.2 (Даша, 06.10.2026):
// node scripts/fix-ld-highlight.mjs <documentId>
// В №1 абзацы «Upon … Default…» и «This amount shall be distributed as follows:» были целиком залиты
// жёлтым, а суммы в списке a)/b) — через раз. Теперь в этих статьях жёлтым только подставляемые
// суммы (liquidated damages и 80% / 20%), остальной текст без заливки. Цвет берём из шаблона.
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;
const ps = doc.body.content.filter((b) => b.paragraph);
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");

const from = ps.findIndex((b) => /Article \{\{article_buyer_default_number\}\}/.test(text(b)));
const to = ps.findIndex((b, i) => i > from && /Article \{\{article_(deposit_release|buyer_own_funds)_number\}\}/.test(text(b)));
if (from === -1 || to === -1) throw new Error("статьи о дефолте не найдены");
const range = ps.slice(from, to);

const colored = range.flatMap((b) => b.paragraph.elements || []).find((e) => e.textRun?.textStyle?.backgroundColor?.color);
const color = colored?.textRun.textStyle.backgroundColor
  || { color: { rgbColor: { red: 1, green: 1, blue: 0 } } };

const AMOUNT = /\{\{(?:buyer|seller)_(?:liquidated_damages_amount|deposit_(?:80|20)_percent_amount)\}\}/g;
const requests = [];
for (const b of range) {
  const s = text(b);
  const hasHl = (b.paragraph.elements || []).some((e) => e.textRun?.textStyle?.backgroundColor?.color);
  const amounts = [...s.matchAll(AMOUNT)];
  if (!hasHl && !amounts.length) continue;
  requests.push({ updateTextStyle: {
    range: { startIndex: b.startIndex, endIndex: b.endIndex - 1 || b.endIndex }, textStyle: {}, fields: "backgroundColor",
  } });
  for (const m of amounts) {
    requests.push({ updateTextStyle: {
      range: { startIndex: b.startIndex + m.index, endIndex: b.startIndex + m.index + m[0].length },
      textStyle: { backgroundColor: color }, fields: "backgroundColor",
    } });
  }
}
const real = requests.filter((r) => r.updateTextStyle.range.endIndex > r.updateTextStyle.range.startIndex);
if (real.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests: real } });
console.log(`абзацев: ${real.filter((r) => !r.updateTextStyle.textStyle.backgroundColor).length}, сумм подсвечено: ${real.filter((r) => r.updateTextStyle.textStyle.backgroundColor).length}`);
