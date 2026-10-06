// Проверка списка правок без записи в документ: node scripts/markup/dry-run.mjs <ключ>
// Прогоняет правки по копии текста в памяти и показывает, какие не нашлись.
// Нужна, чтобы не тратить прогон разметки (по секунде на правку) на опечатку в поиске.
import { getBotClients } from "../google-bot.mjs";
import { buildIndex } from "../docs-edit.mjs";
import { buildEdits } from "./offplan-edits.mjs";
import { READY_CASH, READY_MORTGAGE, READY_MORTGAGE_CASH } from "./ready-deals.mjs";
import { OFFPLAN, OFFPLAN_MORTGAGE } from "./offplan-deals.mjs";

const DEALS = {
  offplan: ["1qedPsMWpFLRFqjxPwuK53fXY_43AkkSC5bGc_rAXG0k", OFFPLAN],
  mortgage: ["1VKkYr8FoFlLlHOVx_aoasdgZzYtB8hP4zaioqm4OaB0", OFFPLAN_MORTGAGE],
  ready: ["1G8vUZTjrnBjSdstRNyEuoypRVVoRg8udywTu5g-e1Jk", READY_CASH],
  "ready-mortgage": ["1fsVQKEKGYNng0ND1kkensdIqUOOQ7h_KgobDCoKwN-E", READY_MORTGAGE],
  "ready-mortgage-cash": ["1hhruVEiqBbNhib4NNmtTX-gNvGwpCw6rsMJ76Iqhk1g", READY_MORTGAGE_CASH],
};

const key = process.argv[2] || "ready";
const [defaultId, deal] = DEALS[key] || [];
// третьим аргументом — другой документ (например, Google Doc из чистовика Даши)
const documentId = process.argv[3] || defaultId;
if (!documentId) throw new Error(`сделки нет: ${Object.keys(DEALS).join(", ")}`);

const { docs } = getBotClients();
const { text } = buildIndex((await docs.documents.get({ documentId })).data);

// абзацы нужны для within: правка ищется только в абзаце с этим текстом
const bounds = (pos) => {
  const from = text.lastIndexOf("\n", pos - 1) + 1;
  const to = text.indexOf("\n", pos);
  return [from, to === -1 ? text.length : to];
};

let current = text;
const failed = [];
const edits = buildEdits(deal);

for (const edit of edits) {
  const { find, within, withinNth = 0, cellAfter, nth = 0, replace, insertBefore } = edit;
  if (cellAfter) {
    if (!current.includes(cellAfter)) failed.push(edit);
    continue;
  }
  let from = 0;
  let to = current.length;
  if (within) {
    let anchor = -1;
    for (let i = 0; i <= withinNth; i += 1) anchor = current.indexOf(within, anchor + 1);
    if (anchor === -1) { failed.push(edit); continue; }
    const fromTo = (() => {
      const start = current.lastIndexOf("\n", anchor - 1) + 1;
      const end = current.indexOf("\n", anchor);
      return [start, end === -1 ? current.length : end];
    })();
    [from, to] = fromTo;
  }
  const slice = current.slice(from, to);
  let at = -1;
  for (let i = 0; i <= nth; i += 1) at = slice.indexOf(find, at + 1);
  if (at === -1) { failed.push(edit); continue; }
  const abs = from + at;
  const next = insertBefore !== undefined
    ? current.slice(0, abs) + insertBefore + current.slice(abs)
    : current.slice(0, abs) + replace + current.slice(abs + find.length);
  current = next;
}

console.log(`правок: ${edits.length}, не найдено: ${failed.length}`);
for (const f of failed) {
  console.log(`  ✘ ${f.note || ""} find=${JSON.stringify((f.find || f.cellAfter || "").slice(0, 70))}`
    + (f.within ? ` within=${JSON.stringify(f.within.slice(0, 40))}` : "")
    + (f.nth ? ` nth=${f.nth}` : ""));
}
void bounds;
