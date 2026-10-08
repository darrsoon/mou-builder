// Все правки оформления №1 от 05.10.2026 одним прогоном: node scripts/apply-layout-fixes.mjs <documentId>
// Поля 2,2 / 2,05 см и текст по ширине до 16,75 см, отступы и колонки таблиц, колонтитул,
// жирные номера в «Article N», пустые строки в статьях о дефолте, «не отрывать от следующего».
// Каждый скрипт идемпотентен; то, чего в шаблоне нет (условия {{#if}} в старых шаблонах),
// просто не находится. «Не отрывать» — последним: он ставится на абзацы, которые правят шаги выше.
import { execFileSync } from "node:child_process";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const steps = [
  ["fix-text-width.mjs", "16.75", "2.2"],
  ["fix-table-padding.mjs"],
  ["fix-payment-columns.mjs"],
  ["fix-footer-align.mjs"],
  ["fix-article-ref-bold.mjs"],
  ["fix-forfeited-gap.mjs"],
  ["fix-default-gaps.mjs"],
  ["fix-nodeposit-gaps.mjs"],
  ["fix-table-heights.mjs"],
  ["fix-fee-cells.mjs"],
  ["fix-highlight-parens.mjs"],
  ["fix-deposit-line-style.mjs"],
  ["fix-cheques-highlight.mjs"],
  ["fix-manager-cheque-highlight.mjs"],
  ["fix-noc-definition.mjs"],
  ["fix-signature-style.mjs"],
  ["fix-terms-indent.mjs"],
  ["fix-signature-headings.mjs"],
  ["fix-keep-with-next.mjs"],
];
for (const [script, ...args] of steps) {
  const out = execFileSync("node", [new URL(script, import.meta.url).pathname, documentId, ...args], { encoding: "utf8" });
  console.log(`${script}: ${out.trim()}`);
}
