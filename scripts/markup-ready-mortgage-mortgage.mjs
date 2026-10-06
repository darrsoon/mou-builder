// Разметка шаблона Ready mortgage to mortgage (№6) маркерами движка v2.
// На копию (черновик):  node scripts/markup-ready-mortgage-mortgage.mjs
// В оригинал:           node scripts/markup-ready-mortgage-mortgage.mjs --original
//
// Источник — Google-копия чистовика Даши (docx 03.10), конфиг READY_MORTGAGE_MORTGAGE_CLEAN
// в scripts/markup/ready-deals.mjs: №5 (ипотека Продавца) плюс ипотечные статьи №4.
// После разметки: fix-bold <черновик> <чистовик> --mortgage, copy-default-articles из №1,
// apply-layout-fixes и проверки с флагами --ready --mortgage --seller-mortgage.
import { buildEdits } from "./markup/offplan-edits.mjs";
import { READY_MORTGAGE_MORTGAGE_CLEAN } from "./markup/ready-deals.mjs";
import { runMarkup } from "./markup/run.mjs";

await runMarkup({
  sourceId: "1mB9S9exCjrUNZDK6Yj_dNs-xHfYuKMMahA69SxWxOFU",
  draftName: "РАЗМЕТКА — ready mortgage to mortgage (черновик)",
  edits: buildEdits(READY_MORTGAGE_MORTGAGE_CLEAN),
  // дата в шапке: табы убраны правкой, абзац прижимаем к правому краю
  paragraphStyles: [{ contains: "{{agreement_date_long}}", style: { alignment: "END" }, fields: "alignment" }],
  toOriginal: process.argv.includes("--original"),
});
