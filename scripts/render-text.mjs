// Текст договора по шаблону, сценарий «всё включено» (тот же движок, что на сайте):
//   node scripts/render-text.mjs <шаблон> [--mortgage] [--ready] [--seller-mortgage] ['{"buyerDepositEnabled":"No"}']
// Сверка с чистовиком: node scripts/dump-text.mjs <чистовик> > a.txt; node scripts/render-text.mjs … > b.txt;
//   python3 scripts/word-diff.py a.txt b.txt — пословные отличия (подстановки значений, условия)
import { getBotClients } from "./google-bot.mjs";
import { buildIndex } from "./docs-edit.mjs";
import { renderLocal } from "./render-local.mjs";
import { baseFor, templateFor } from "./batch-scenarios.mjs";
import { getArticleDefsForTemplate } from "../lib/mou/articles.js";
const a = process.argv.slice(2);
const M = a.includes("--mortgage"), R = a.includes("--ready"), SM = a.includes("--seller-mortgage");
const over = JSON.parse(a.find((x) => x.startsWith("{")) || "{}");
const T = templateFor(M, R, SM);
const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId: a[0] })).data;
const { text } = renderLocal(doc, buildIndex(doc), { ...baseFor(M, R, SM), ...over }, getArticleDefsForTemplate(T), T);
process.stdout.write(text);
