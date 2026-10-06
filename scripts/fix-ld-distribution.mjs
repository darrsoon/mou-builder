// Распределение liquidated damages и без депозитов (Даша, 06.10.2026, по чистовику 1.2 «NO DEPOSIT
// CHEQUES» 1lXf-lodoCXjaDhH8nyo7v0U3YhhMud3x): node scripts/fix-ld-distribution.mjs <documentId>
// В статьях о дефолте «This amount shall be distributed as follows: a) 80% … b) 20% …» стояло под
// {{#if any_deposit}} — без депозитов распределения не было. Снимаем это условие: строка и список
// показываются всегда (суммы в списке без депозита и так считаются от liquidated damages).
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const text = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");
const IF = "{{#if any_deposit}}";
const END = "{{/if}}";

const ps = (await docs.documents.get({ documentId })).data.body.content.filter((b) => b.paragraph);
const cuts = []; // [start, end) — удаляем снизу вверх
ps.forEach((b, i) => {
  const s = text(b);
  // «{{#if any_deposit}}\vThis amount shall be distributed as follows:{{/if}}{{/if}}»
  if (s.startsWith(IF) && /^.{0,2}This amount shall be distributed as follows:\{\{\/if\}\}/s.test(s.slice(IF.length))) {
    const endAt = s.indexOf(END, IF.length);
    cuts.push([b.startIndex + endAt, b.startIndex + endAt + END.length], [b.startIndex, b.startIndex + IF.length]);
  }
  // «{{#if any_deposit}}{{#if seller_agent}}a) 80% …» … «a) 100% … to the Seller{{/if}}{{/if}}»
  if (s.startsWith(`${IF}{{#if `) && /\}\}a\) 80%/.test(s)) {
    const last = ps.slice(i + 1, i + 4).find((p) => /^a\) 100%.*\{\{\/if\}\}\{\{\/if\}\}\n$/.test(text(p)));
    if (!last) return;
    const lt = text(last);
    const at = last.startIndex + lt.lastIndexOf(END);
    cuts.push([at, at + END.length], [b.startIndex, b.startIndex + IF.length]);
  }
});
const requests = cuts.sort((a, b) => b[0] - a[0])
  .map(([startIndex, endIndex]) => ({ deleteContentRange: { range: { startIndex, endIndex } } }));
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`снято условий any_deposit: ${requests.length / 2}`);
