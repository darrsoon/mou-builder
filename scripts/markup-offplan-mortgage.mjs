// Разметка шаблона off-plan с ипотекой (№2) маркерами движка v2.
// На копию (черновик):  node scripts/markup-offplan-mortgage.mjs
// В оригинал:           node scripts/markup-offplan-mortgage.mjs --original
//
// Правки общие с №1 (scripts/markup/offplan-edits.mjs), отличия — в конфиге
// OFFPLAN_MORTGAGE (scripts/markup/offplan-deals.mjs). Строка добора порога
// вставляется отдельно, уже размеченной.
// С 06.10.2026 источник — Google-копия чистовика Даши (docx 03.10), конфиг OFFPLAN_MORTGAGE_CLEAN;
// после разметки статьи о дефолте переносятся из №1 (copy-default-articles).
// Прежний исходник: 1VKkYr8FoFlLlHOVx_aoasdgZzYtB8hP4zaioqm4OaB0.
import { buildEdits } from "./markup/offplan-edits.mjs";
import { OFFPLAN_MORTGAGE_CLEAN, THRESHOLD_ROW } from "./markup/offplan-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "1Sy4FpNvcO2ahf2uL3sU6Os-rZcI_GZEXIrvWYql56Bo",
  draftName: "РАЗМЕТКА — off-plan ипотека (черновик)",
  edits: buildEdits(OFFPLAN_MORTGAGE_CLEAN),
  rows: [THRESHOLD_ROW],
  // дата в шапке: табы убраны правкой, абзац прижимаем к правому краю
  paragraphStyles: [{ contains: "{{agreement_date_long}}", style: { alignment: "END" }, fields: "alignment" }],
  toOriginal: process.argv.includes("--original"),
});
