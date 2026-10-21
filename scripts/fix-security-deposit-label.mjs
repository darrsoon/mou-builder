// Подпись строки PAYMENT TABLE «Security deposit:» → «Security Deposit:», как в остальных шаблонах
// (Алина, 21.10.2026; в чистовике №3 и прежних №3/№4 была строчная d).
//   node scripts/fix-security-deposit-label.mjs <documentId>
// Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits, buildIndex } from "./docs-edit.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const { text } = buildIndex((await docs.documents.get({ documentId })).data);
const n = text.split("Security deposit:").length - 1;
if (n) console.log(JSON.stringify(await applyEdits(docs, documentId, Array.from({ length: n }, () => ({ find: "Security deposit:", replace: "Security Deposit:" })))));
console.log(`подписей исправлено: ${n}`);
