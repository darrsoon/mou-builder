// Шапка таблицы не остаётся внизу страницы одна (Алина, 07.10.2026).
// Google Docs не умеет «не отрывать шапку от первой строки»: закреплённая шапка (pinned header) это делает,
// но повторяет шапку на продолжении таблицы, а это не нужно. Поэтому после сборки договор выгружается в PDF,
// и если на странице с шапкой нет первой строки таблицы, заголовку Article перед таблицей ставится
// «С новой страницы» (pageBreakBefore). Article и таблица переезжают вместе, разорванная таблица шапку не повторяет.
import { extractText, getDocumentProxy } from "unpdf";

export const TABLE_HEADERS = ["PROPERTY DETAILS", "PAYMENT TABLE"];
const MAX_PASSES = 3;

const cellText = (cell) => cell.content
  .map((b) => (b.paragraph?.elements || []).map((e) => e.textRun?.content || "").join(""))
  .join("")
  .replace(/\s+/g, " ")
  .trim();
const paragraphText = (b) => (b.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("").trim();
const squash = (s) => s.replace(/\s+/g, "");

// Таблицы с шапкой из TABLE_HEADERS: текст шапки, начало первой строки и абзац Article перед таблицей.
export function findHeaderTables(doc) {
  const content = doc.body.content;
  const found = [];
  content.forEach((b, i) => {
    if (!b.table || b.table.tableRows.length < 2) return;
    const header = TABLE_HEADERS.find((h) => cellText(b.table.tableRows[0].tableCells[0]).includes(h));
    if (!header) return;
    const firstRow = cellText(b.table.tableRows[1].tableCells[0]);
    let article = null;
    for (let j = i - 1; j >= 0 && content[j].paragraph; j -= 1) {
      const text = paragraphText(content[j]);
      if (!text) continue;
      if (/^Article\b/.test(text)) article = content[j];
      break;
    }
    if (firstRow && article) found.push({ header, firstRow: firstRow.slice(0, 24), article });
  });
  return found;
}

// Номер страницы (с 0), где после шапки начинается первая строка; -1 — не найдено.
export function orphanedHeaders(pages, tables) {
  const squashed = pages.map(squash);
  return tables.filter(({ header, firstRow }) => {
    const h = squash(header);
    const row = squash(firstRow);
    const page = squashed.findIndex((p) => p.includes(h));
    if (page === -1 || !row) return false;
    const rest = squashed[page].slice(squashed[page].indexOf(h) + h.length);
    return !rest.includes(row);
  });
}

async function pdfPages(drive, documentId) {
  const res = await drive.files.export({ fileId: documentId, mimeType: "application/pdf" }, { responseType: "arraybuffer" });
  const pdf = await getDocumentProxy(new Uint8Array(res.data));
  const { text } = await extractText(pdf, { mergePages: false });
  return text;
}

export async function fixOrphanTableHeaders({ drive, docs, documentId }) {
  const moved = [];
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const doc = (await docs.documents.get({ documentId })).data;
    const tables = findHeaderTables(doc).filter((t) => !t.article.paragraph.paragraphStyle?.pageBreakBefore);
    if (!tables.length) break;
    const orphans = orphanedHeaders(await pdfPages(drive, documentId), tables);
    if (!orphans.length) break;
    const { article, header } = orphans[0]; // по одной: перенос первой сдвигает всё ниже
    await docs.documents.batchUpdate({ documentId, requestBody: { requests: [{ updateParagraphStyle: {
      range: { startIndex: article.startIndex, endIndex: article.endIndex },
      paragraphStyle: { pageBreakBefore: true }, fields: "pageBreakBefore",
    } }] } });
    moved.push(header);
  }
  return moved;
}
