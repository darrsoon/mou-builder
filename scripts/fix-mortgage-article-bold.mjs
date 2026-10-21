// Статья об ипотеке Покупателя («The Buyer confirms that he has obtained Mortgage Pre-Approval …») — жирным как в
// эталоне №4 (Алина, 21.10.2026): Buyer, Mortgage Pre-Approval, Final Mortgage Approval, Reservation Period,
// Article N (ссылка на Reservation Period), MOU, Manager’s Cheque(s), Transfer Date, Default, Security Deposit.
// «Buyer’s good faith» — обычным, как в эталоне. Шаблоны с ипотекой Покупателя: №2, №4, №6.
//   node scripts/fix-mortgage-article-bold.mjs <documentId>
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";

const TERMS = [/\bBuyer\b(?!’)/g, /Mortgage Pre-Approval/g, /Final Mortgage Approval/g, /Reservation Period/g,
  /Article \{\{article_reservation_period_number\}\}/g, /\bMOU\b/g, /Manager’s Cheque\(s\)/g, /Transfer Date/g,
  /\bDefault\b/g, /Security Deposit/g];
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const { chars, text } = buildIndex((await docs.documents.get({ documentId })).data);
const anchor = text.indexOf("confirms that he has obtained Mortgage Pre-Approval");
if (anchor === -1) { console.log("статьи об ипотеке нет"); process.exit(0); }
const from = text.lastIndexOf("\n", anchor) + 1;
const to = text.indexOf("\n", anchor);
const para = text.slice(from, to);
const requests = [];
for (const re of TERMS) {
  for (const m of para.matchAll(re)) {
    const span = chars.slice(from + m.index, from + m.index + m[0].length);
    if (span.every((c) => c.bold)) continue;
    requests.push({ updateTextStyle: { range: { startIndex: span[0].i, endIndex: span[span.length - 1].i + 1 },
      textStyle: { bold: true }, fields: "bold" } });
  }
}
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`терминов сделано жирными: ${requests.length}`);
