// №4 и №6 (шаблоны с ипотекой Покупателя): абзац «The Seller shall cooperate with the
// Buyer’s financing bank…» — в статье о документах (AML), после «…required for completion of the transaction.»,
// как в эталонах №4, №6 и в №2 (Алина, 21.10 и 27.10.2026; 05.10 его убирали). «Seller» жирным, остальное обычным.
//   node scripts/fix-mortgage-coop-add.mjs <documentId>
// Повтор безопасен: если абзац уже есть — ничего не делает.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits, buildIndex } from "./docs-edit.mjs";

const PARA = "The Seller shall cooperate with the Buyer’s financing bank and provide, in a timely manner, all documents required for mortgage approval and registration at the Abu Dhabi Real Estate Centre.";
const ANCHOR = "required for completion of the transaction.";
const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const { text } = buildIndex((await docs.documents.get({ documentId })).data);
if (text.includes(PARA)) { console.log("абзац уже есть"); process.exit(0); }
if (text.split(ANCHOR).length !== 2) throw new Error(`«${ANCHOR}» найдено не один раз — правлю руками`);
const added = `${ANCHOR}\n\n${PARA}`;
const sellerAt = added.indexOf("Seller", ANCHOR.length);
const res = await applyEdits(docs, documentId, [{ find: ANCHOR, replace: added, bold: false,
  runs: [[sellerAt, sellerAt + "Seller".length, true]], noHighlight: [[0, added.length]] }]);
console.log(JSON.stringify(res));
