// Плоский текст Google Doc (тело и колонтитулы) — для сравнения: node scripts/dump-text.mjs <documentId>
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";
const { docs } = getBotClients();
const { text } = buildIndex((await docs.documents.get({ documentId: process.argv[2] })).data);
process.stdout.write(text);
