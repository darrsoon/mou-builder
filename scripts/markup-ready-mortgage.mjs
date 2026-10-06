// Разметка шаблона Ready cash to mortgage (№4) маркерами движка v2.
// На копию (черновик):  node scripts/markup-ready-mortgage.mjs
// В оригинал:           node scripts/markup-ready-mortgage.mjs --original
//
// Правки общие с off-plan (scripts/markup/offplan-edits.mjs): статьи 7–8 — ипотечная
// раскладка №2, блок объекта, сборы и аренда — как в №3. Конфиг — READY_MORTGAGE
// в scripts/markup/ready-deals.mjs.
// С 06.10.2026 источник — Google-копия чистовика Даши (docx 03.10), конфиг READY_MORTGAGE_CLEAN;
// после разметки статьи о дефолте переносятся из №1 (copy-default-articles).
// Прежний исходник: 1fsVQKEKGYNng0ND1kkensdIqUOOQ7h_KgobDCoKwN-E.
import { buildEdits } from "./markup/offplan-edits.mjs";
import { READY_MORTGAGE_CLEAN } from "./markup/ready-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "1Suj6HTQxfljkzRWQ0mHmq4NJ1EECTzyDeF1dF4S3mhs",
  draftName: "РАЗМЕТКА — ready cash to mortgage (черновик)",
  edits: buildEdits(READY_MORTGAGE_CLEAN),
  // дата в шапке: табы убраны правкой, абзац прижимаем к правому краю
  paragraphStyles: [{ contains: "{{agreement_date_long}}", style: { alignment: "END" }, fields: "alignment" }],
  toOriginal: process.argv.includes("--original"),
});
