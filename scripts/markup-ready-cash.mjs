// Разметка шаблона Ready cash-to-cash (№3) маркерами движка v2.
// На копию (черновик):  node scripts/markup-ready-cash.mjs
// В оригинал:           node scripts/markup-ready-cash.mjs --original
//
// Правки общие с off-plan (scripts/markup/offplan-edits.mjs), отличия документа —
// в конфиге READY_CASH (scripts/markup/ready-deals.mjs).
// С 06.10.2026 источник — Google-копия чистовика Даши (docx 03.10), конфиг READY_CASH_CLEAN;
// после разметки статьи о дефолте переносятся из №1 (copy-default-articles).
// Прежний исходник: 1G8vUZTjrnBjSdstRNyEuoypRVVoRg8udywTu5g-e1Jk.
import { buildEdits } from "./markup/offplan-edits.mjs";
import { READY_CASH_CLEAN } from "./markup/ready-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "17VDP2-Ca5DI_3FNbUkj1gYWDVEjSAg85INVhdkN4r4Y",
  draftName: "РАЗМЕТКА — ready cash to cash (черновик)",
  edits: buildEdits(READY_CASH_CLEAN),
  // дата в шапке: табы убраны правкой, абзац прижимаем к правому краю
  paragraphStyles: [{ contains: "{{agreement_date_long}}", style: { alignment: "END" }, fields: "alignment" }],
  toOriginal: process.argv.includes("--original"),
});
