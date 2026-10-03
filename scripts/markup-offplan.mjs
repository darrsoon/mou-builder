// Разметка шаблона off-plan (№1) маркерами движка v2.
// На копию (черновик):  node scripts/markup-offplan.mjs
// В оригинал:           node scripts/markup-offplan.mjs --original
//
// Сами правки — в scripts/markup/offplan-edits.mjs, значения демо-сделки —
// в scripts/markup/offplan-deals.mjs. Список общий с ипотечным шаблоном №2.
import { buildEdits } from "./markup/offplan-edits.mjs";
import { OFFPLAN } from "./markup/offplan-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "1qedPsMWpFLRFqjxPwuK53fXY_43AkkSC5bGc_rAXG0k",
  draftName: "РАЗМЕТКА — off-plan (черновик)",
  edits: buildEdits(OFFPLAN),
  toOriginal: process.argv.includes("--original"),
});
