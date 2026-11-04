// Commission Agreement (шаблоны 7 и 8) по образцу Даши — соглашение C3 Unit 113 (04.11.2026,
// 1vszzT9Ut3PxKIMseTDpw-ojRBIuzZYS-RyOKkdf0y0g): пустая строка после «(hereinafter referred to as the “… Party”)»
// у каждой стороны, кроме последней (перед «Collectively…» она уже есть); в первом абзаце объект — {{property_ref}}
// («C3 Garden - Unit 113» у C3, у остальных — номер юнита, как было).
//   node scripts/fix-commission-c3.mjs <documentId>
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();

const res = await applyEdits(docs, documentId, [
  { find: "in relation to the property {{unit_number}}", replace: "in relation to the property {{property_ref}}", note: "объект в первом абзаце" },
]);
console.log(JSON.stringify(res.failed.length ? res : { done: res.done }));

const content = (await docs.documents.get({ documentId })).data.body.content;
const text = (b) => (b?.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("");
const requests = [];
content.forEach((b, i) => {
  if (!/^\(hereinafter referred to as the “\w+ Party”\)\n$/.test(text(b))) return;
  if (text(content[i + 1]) === "\n") return; // пустая строка уже есть
  requests.push({ insertText: { location: { index: b.endIndex - 1 }, text: "\n" } });
});
requests.reverse(); // с конца — индексы впереди не сдвигаются
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`пустых строк между сторонами добавлено: ${requests.length}`);
