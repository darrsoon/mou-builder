// №8 Off-plan Ready to Cash (Алина, 20.11.2026; эталон docx «19. DRAFT Off-plan ready to Cash»
// 1MGSsXdqVtonABR9e1H-RNFIruB8ADbYP): собирается из копии принятого №1 — все правила и оформление переходят сами;
// отличие одно — в PAYMENT TABLE строка ADM (2% + AED 575): «… to <payee> after valuation by bank or online transfer»
// вместо «on the Transfer Date by a Manager’s Cheque». В эталоне строк две (новая и прежняя) — оставлена одна, новая,
// без двойного «by by» и хвоста «to ALDAR» (решение 20.11, уточнить у Алины).
//   node scripts/make-offplan-ready-cash.mjs <documentId>
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const res = await applyEdits(docs, documentId, [
  { find: "{{adm_fee_payee}} on the Transfer Date by a Manager’s Cheque",
    replace: "{{adm_fee_payee}} after valuation by bank or online transfer", bold: false,
    runs: [[0, 33, true]], noHighlight: [[17, 60]], note: "ADM: after valuation by bank or online transfer" },
]);
console.log(JSON.stringify(res.failed.length ? res : { done: res.done }));
