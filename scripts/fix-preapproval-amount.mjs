// Статья об ипотеке Покупателя: «Mortgage Pre-Approval for an amount equal to the agreed Selling Price» — как в
// эталонах №2 и №4 (Алина, 21.10.2026; раньше фразу о сумме убирали — Миша 04.09, Алина 13.09).
// «Mortgage Pre-Approval» и «Selling Price» — жирным. Шаблоны №2, №4, №6.
//   node scripts/fix-preapproval-amount.mjs <documentId>
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits, buildIndex } from "./docs-edit.mjs";

const FIND = "Mortgage Pre-Approval and that the purchase";
const NEW = "Mortgage Pre-Approval for an amount equal to the agreed Selling Price and that the purchase";
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const { text } = buildIndex((await docs.documents.get({ documentId })).data);
if (!text.includes(FIND)) { console.log(text.includes(NEW) ? "фраза уже есть" : "статьи об ипотеке нет"); process.exit(0); }
const sp = NEW.indexOf("Selling Price");
console.log(JSON.stringify(await applyEdits(docs, documentId, [{ find: FIND, replace: NEW, bold: false,
  runs: [[0, "Mortgage Pre-Approval".length, true], [sp, sp + "Selling Price".length, true]] }])));
