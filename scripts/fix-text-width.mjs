// Ширина текста по правому краю (Даша, 05.10.2026): node scripts/fix-text-width.mjs <documentId> [см] [левое поле, см]
// Левое поле по умолчанию не трогаем; в остальных шаблонах ставим 2,2 см, как в №1.
// Правое поле — так, чтобы текст кончался на 16,75 см по линейке;
// правый отступ у всех абзацев — 0, чтобы ни один не вылезал за край, текст — по ширине;
// таблицы с фиксированной шириной колонок растягиваются (пропорционально) на ту же ширину,
// чтобы их правый край совпал с текстом. Повторный запуск ничего не меняет.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
const widthCm = Number(process.argv[3] || 16.75);
const leftCm = process.argv[4] ? Number(process.argv[4]) : null;
if (!documentId) throw new Error("укажи ID документа");
const PT_PER_CM = 72 / 2.54;
const width = widthCm * PT_PER_CM;
const { docs } = getBotClients();

const doc = (await docs.documents.get({ documentId })).data;
const ds = doc.documentStyle;
const marginLeft = leftCm == null ? ds.marginLeft.magnitude : leftCm * PT_PER_CM;
const marginRight = ds.pageSize.width.magnitude - marginLeft - width;
const requests = [{ updateDocumentStyle: {
  documentStyle: { marginLeft: { magnitude: marginLeft, unit: "PT" }, marginRight: { magnitude: marginRight, unit: "PT" } },
  fields: "marginLeft,marginRight",
} }];

// правый отступ абзацев — 0: в шаблоне были −0,07 и −0,82 см (абзацы о депозите
// вылезали за край почти на сантиметр); левые отступы не трогаем
for (const b of doc.body.content) {
  if (!b.paragraph || !b.paragraph.paragraphStyle.indentEnd?.magnitude) continue;
  requests.push({ updateParagraphStyle: {
    range: { startIndex: b.startIndex, endIndex: b.endIndex },
    paragraphStyle: { indentEnd: { magnitude: 0, unit: "PT" } }, fields: "indentEnd",
  } });
}

// выравнивание по ширине: абзацы «по левому краю» (в №1 их было 4, например «The Selling
// Price…» под Payment Table) — как весь остальной текст; по центру и справа не трогаем
for (const b of doc.body.content) {
  const align = b.paragraph?.paragraphStyle.alignment;
  if (!b.paragraph || (align && align !== "START")) continue;
  requests.push({ updateParagraphStyle: {
    range: { startIndex: b.startIndex, endIndex: b.endIndex },
    paragraphStyle: { alignment: "JUSTIFIED" }, fields: "alignment",
  } });
}

for (const b of doc.body.content) {
  if (!b.table) continue;
  const cols = b.table.tableStyle.tableColumnProperties;
  if (!cols.every((c) => c.widthType === "FIXED_WIDTH" && c.width)) continue;
  const total = cols.reduce((s, c) => s + c.width.magnitude, 0);
  cols.forEach((c, i) => requests.push({ updateTableColumnProperties: {
    tableStartLocation: { index: b.startIndex }, columnIndices: [i],
    tableColumnProperties: { widthType: "FIXED_WIDTH", width: { magnitude: (c.width.magnitude * width) / total, unit: "PT" } },
    fields: "widthType,width",
  } }));
}
await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`правое поле ${(marginRight / PT_PER_CM).toFixed(2)} см, текст и таблицы ${widthCm} см`);
