// Разметка шаблона Ready mortgage to cash (№5) маркерами движка v2.
// На копию (черновик):  node scripts/markup-ready-mortgage-cash.mjs
// В оригинал:           node scripts/markup-ready-mortgage-cash.mjs --original
//
// С 06.10.2026 источник — Google-копия чистовика Даши (docx 03.10), конфиг
// READY_MORTGAGE_CASH_CLEAN. Прежний исходник: 1hhruVEiqBbNhib4NNmtTX-gNvGwpCw6rsMJ76Iqhk1g.
//
// Документ — №3 с ипотекой Продавца: строка Mortgage Release Fee, банк Продавца
// и два варианта денег Покупателя в ст.10. Конфиг — READY_MORTGAGE_CASH
// в scripts/markup/ready-deals.mjs.
import { buildEdits } from "./markup/offplan-edits.mjs";
import { READY_MORTGAGE_CASH_CLEAN } from "./markup/ready-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "1EREXr3_5zj_o2Lq0M0AYLB-8wvHCWaUR1fWbryingxw",
  draftName: "РАЗМЕТКА — ready mortgage to cash (черновик)",
  edits: buildEdits(READY_MORTGAGE_CASH_CLEAN),
  // дата в шапке: табы убраны правкой, абзац прижимаем к правому краю
  paragraphStyles: [
    { contains: "{{agreement_date_long}}", style: { alignment: "END" }, fields: "alignment" },
    // абзац «с кредитом» склеен с разделителем «___» и взял его стиль — возвращаем отступ исходника
    { contains: "{{#if !buyer_own_funds}}", style: { spaceAbove: { magnitude: 12, unit: "PT" } }, fields: "spaceAbove" },
  ],
  toOriginal: process.argv.includes("--original"),
});
