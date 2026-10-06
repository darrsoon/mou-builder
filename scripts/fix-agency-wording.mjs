// «Agency» вместо «Agent» по всему тексту MOU (Даша, 06.10.2026): node scripts/fix-agency-wording.mjs <documentId>
// Тело, колонтитулы, шапки: «Seller’s Agent» / «Buyer’s agent» / «the Agent» → «… Agency»,
// «Agents» → «Agencies», «agents’ email» → «agencies’ email». Меняем только хвост слова
// («t» → «cy», «ts» → «cies») и строчную «a» в единственном числе — шрифт и подсветка
// сохраняются. Внутри плейсхолдеров ({{seller_agent_name}}, {{#if any_agent}}) не трогаем.
// Не для C3: старый движок ищет в их тексте фразы со словом «Agent».
// Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;
// перед словом не буква и не «_» (плейсхолдер), после — не буква и не «_»/«}}»
const RE = /(?<![A-Za-z_])([Aa])gen(ts?)(?![A-Za-z_}])/g;

const edits = [];
function walk(content, segmentId) {
  const seg = segmentId ? { segmentId } : {};
  for (const b of content) {
    if (b.table) b.table.tableRows.forEach((r) => r.tableCells.forEach((c) => walk(c.content, segmentId)));
    for (const e of b.paragraph?.elements || []) {
      const t = e.textRun?.content || "";
      for (const m of t.matchAll(RE)) {
        const a = e.startIndex + m.index; // буква a/A
        const tail = a + 4; // «t» или «ts»
        const plural = m[2] === "ts";
        const requests = [
          { deleteContentRange: { range: { startIndex: tail, endIndex: tail + m[2].length, ...seg } } },
          { insertText: { location: { index: tail, ...seg }, text: plural ? "cies" : "cy" } },
        ];
        if (!plural && m[1] === "a") {
          requests.push(
            { deleteContentRange: { range: { startIndex: a, endIndex: a + 1, ...seg } } },
            { insertText: { location: { index: a, ...seg }, text: "A" } },
          );
        }
        edits.push({ segmentId: segmentId || "", at: a, requests });
      }
    }
  }
}
walk(doc.body.content, "");
for (const [id, f] of Object.entries(doc.footers || {})) walk(f.content, id);
for (const [id, h] of Object.entries(doc.headers || {})) walk(h.content, id);

// внутри сегмента — снизу вверх, чтобы индексы не съезжали
const requests = edits.sort((x, y) => (x.segmentId === y.segmentId ? y.at - x.at : x.segmentId.localeCompare(y.segmentId)))
  .flatMap((e) => e.requests);
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`Agent → Agency: ${edits.length}`);
