// Блок подписей — как в №1 (Алина, 08.10.2026: «проверить выделения, сделать как в шаблоне 1»):
//   node scripts/fix-signature-style.mjs <documentId>
// 1) значения подписей (имя стороны, агентство, представитель, дата) — обычным шрифтом: в чистовиках №2–№6
//    плейсхолдеры были жирными, и в договоре имена выходили жирными; подписи полей («Name:», «Company:») жирные
//    остаются (в блоке сторон их ставит код маркерами << >>);
// 2) у SELLER’S AGENCY дата — своя ({{seller_signature_date}}), в №2 и новых №3/№4 стояла дата Покупателя.
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const load = async () => (await docs.documents.get({ documentId })).data;

// 2) дата агентства Продавца
let doc = await load();
let { chars, text } = buildIndex(doc);
const head = text.lastIndexOf("SELLER’S AGENCY");
let fixedDate = 0;
if (head !== -1) {
  const end = text.indexOf("Company Stamp", head);
  const at = text.indexOf("{{buyer_signature_date}}", head);
  if (at !== -1 && end !== -1 && at < end) {
    const start = chars[at].i;
    const stop = chars[at + "{{buyer_signature_date}}".length - 1].i + 1;
    await docs.documents.batchUpdate({ documentId, requestBody: { requests: [
      { deleteContentRange: { range: { startIndex: start, endIndex: stop } } },
      { insertText: { location: { index: start }, text: "{{seller_signature_date}}" } },
    ] } });
    fixedDate = 1;
    doc = await load();
    ({ chars, text } = buildIndex(doc));
  }
}

// 1) обычный шрифт у значений — только в блоке подписей (от последнего «THE SELLER» до конца)
const from = text.lastIndexOf("THE SELLER");
const PH = ["seller_signature_block", "buyer_signature_block", "seller_agent_name", "buyer_agent_name",
  "seller_agent_representative", "buyer_agent_representative", "seller_signature_date", "buyer_signature_date"];
const requests = [];
for (const key of PH) {
  const ph = `{{${key}}}`;
  for (let at = text.indexOf(ph, from); at !== -1 && from !== -1; at = text.indexOf(ph, at + 1)) {
    const span = chars.slice(at, at + ph.length);
    if (!span.some((c) => c.bold)) continue;
    requests.push({ updateTextStyle: {
      range: { startIndex: span[0].i, endIndex: span[span.length - 1].i + 1 },
      textStyle: { bold: false }, fields: "bold",
    } });
  }
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`дата агентства Продавца исправлена: ${fixedDate}, значений без жирного: ${requests.length}`);
