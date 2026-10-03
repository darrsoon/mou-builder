// Разметка шаблона Ready cash to mortgage (№4) маркерами движка v2.
// На копию (черновик):  node scripts/markup-ready-mortgage.mjs
// В оригинал:           node scripts/markup-ready-mortgage.mjs --original
//
// Правки общие с off-plan (scripts/markup/offplan-edits.mjs): статьи 7–8 — ипотечная
// раскладка №2, блок объекта, сборы и аренда — как в №3. Конфиг — READY_MORTGAGE
// в scripts/markup/ready-deals.mjs.
import { buildEdits } from "./markup/offplan-edits.mjs";
import { READY_MORTGAGE } from "./markup/ready-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "1fsVQKEKGYNng0ND1kkensdIqUOOQ7h_KgobDCoKwN-E",
  draftName: "РАЗМЕТКА — ready cash to mortgage (черновик)",
  edits: buildEdits(READY_MORTGAGE),
  // дата в шапке: табы убраны правкой, абзац прижимаем к правому краю
  paragraphStyles: [{ contains: "{{agreement_date_long}}", style: { alignment: "END" }, fields: "alignment" }],
  toOriginal: process.argv.includes("--original"),
});
