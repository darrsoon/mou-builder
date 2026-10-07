// Шапка таблицы не остаётся внизу страницы одна (Алина, 07.10.2026: «PROPERTY DETAILS» висела без строк):
//   node scripts/fix-pin-table-headers.mjs <documentId>
// У PROPERTY DETAILS и PAYMENT TABLE шапка закрепляется (pinnedHeaderRowsCount = 1). Тогда, если под шапкой
// не помещается ни одной строки, Google Docs переносит таблицу целиком (вместе с заголовком Article, у него
// «Не отрывать от следующего»), а у разорванной таблицы шапка повторяется на новой странице.
// keepWithNext в ячейке шапки Google Docs не учитывает — проверено на копии. Повтор безопасен.
import { getBotClients } from "./google-bot.mjs";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const { docs } = getBotClients();
const content = (await docs.documents.get({ documentId })).data.body.content;
const requests = content
  .filter((b) => b.table && /PROPERTY DETAILS|PAYMENT TABLE/.test(JSON.stringify(b.table)))
  .filter((b) => b.table.tableStyle?.pinnedHeaderRowsCount !== 1 && !b.table.tableRows[0].tableRowStyle?.tableHeader)
  .map((b) => ({ pinTableHeaderRows: { tableStartLocation: { index: b.startIndex }, pinnedHeaderRowsCount: 1 } }));
if (requests.length) await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
console.log(`закреплено шапок: ${requests.length}`);
