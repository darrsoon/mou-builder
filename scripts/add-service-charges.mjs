// №4–№6 (ипотека у Покупателя и/или Продавца): под PAYMENT TABLE, после «Any governmental, registration…» —
// четыре абзаца о service charges (Алина, 31.10.2026, «под таблицу п.4 вставить этот текст»). Интервалы — как у
// соседних абзацев (12 pt), жирным — Seller / Buyer / Transfer date, как в присланном образце.
//   node scripts/add-service-charges.mjs <documentId>
// Повтор безопасен: если абзацы уже есть — ничего не делает.
import { getBotClients } from "./google-bot.mjs";

const PARAS = [
  "The Seller shall settle all outstanding service charges in accordance with the Developer’s payment schedule prior to the transfer of ownership.",
  "Any service charges paid in advance by the Seller shall be prorated based on the actual amount paid and the remaining prepaid period, calculated from the date of transfer until the end of the applicable billing period.",
  "The Buyer shall reimburse the Seller only for the prorated portion of service charges already paid by the Seller that relates to the period following the Transfer date.",
  "Any future service charges not yet paid shall be the responsibility of the Buyer in accordance with the Developer’s payment schedule.",
];
const BOLD = ["Seller", "Buyer", "Transfer date"];
const ANCHOR = "Any governmental, registration, administrative, third-party, or other fees imposed";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const content = (await docs.documents.get({ documentId })).data.body.content;
const text = (b) => (b.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("");
if (content.some((b) => text(b).includes(PARAS[0]))) {
  console.log("абзацы уже есть");
  process.exit(0);
}
const anchors = content.filter((b) => text(b).includes(ANCHOR));
if (anchors.length !== 1) throw new Error(`«${ANCHOR.slice(0, 30)}…» найдено ${anchors.length} раз — правлю руками`);
const anchor = anchors[0];

const at = anchor.endIndex - 1; // перед переносом строки абзаца-якоря
const inserted = PARAS.map((p) => `\n${p}`).join("");
const requests = [
  { insertText: { location: { index: at }, text: inserted } },
  // вставка наследует стиль символа перед ней: сначала всё обычным, без выделения, потом жирные слова
  { updateTextStyle: { range: { startIndex: at, endIndex: at + inserted.length },
    textStyle: { bold: false, italic: false, underline: false, backgroundColor: {} }, fields: "bold,italic,underline,backgroundColor" } },
];
for (const word of BOLD) {
  const re = new RegExp(`\\b${word}\\b`, "g");
  for (const m of inserted.matchAll(re)) {
    requests.push({ updateTextStyle: { range: { startIndex: at + m.index, endIndex: at + m.index + word.length },
      textStyle: { bold: true }, fields: "bold" } });
  }
}
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`абзацев добавлено: ${PARAS.length}`);
