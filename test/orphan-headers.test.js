import test from "node:test";
import assert from "node:assert/strict";
import { findHeaderTables, orphanedHeaders } from "../lib/google/orphan-headers.js";

const para = (text, startIndex = 1) => ({ startIndex, endIndex: startIndex + text.length, paragraph: { elements: [{ textRun: { content: text } }], paragraphStyle: {} } });
const cell = (text) => ({ content: [para(text)] });
const table = (header, first) => ({ table: { tableRows: [{ tableCells: [cell(header)] }, { tableCells: [cell(first), cell("x")] }] } });

test("findHeaderTables: таблица, первая строка и Article перед ней", () => {
  const doc = { body: { content: [
    para("Article 3\n", 10), table("PROPERTY DETAILS\n", "Type of Area: Residential\n"),
    para("\n"), para("Article 4\n", 50), table("PAYMENT TABLE\n", "Original Price:\n"),
    para("Other\n"), table("SOMETHING ELSE\n", "a\n"),
  ] } };
  const found = findHeaderTables(doc);
  assert.deepEqual(found.map((t) => [t.header, t.firstRow, t.article.startIndex]), [
    ["PROPERTY DETAILS", "Type of Area: Residentia", 10], // первые 24 символа,
    ["PAYMENT TABLE", "Original Price:", 50],
  ]);
});

test("orphanedHeaders: шапка без первой строки на той же странице", () => {
  const tables = [{ header: "PROPERTY DETAILS", firstRow: "Type of Area: Residential" }, { header: "PAYMENT TABLE", firstRow: "Original Price:" }];
  const pages = [
    "text Article 3 PROPERTY DETAILS Seller’s signature 2",
    "Type of Area: Residential … Article 4 PAYMENT TABLE Original Price: AED 1",
  ];
  assert.deepEqual(orphanedHeaders(pages, tables).map((t) => t.header), ["PROPERTY DETAILS"]);
  // pdf.js может склеить или разбить слова по-другому — пробелы не учитываются
  assert.deepEqual(orphanedHeaders(["PROPERTY  DETAILS TypeofArea: Residential"], tables.slice(0, 1)), []);
});
