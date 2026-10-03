// Жирный шрифт шаблона — как в эталонном .docx: node scripts/sync-bold-from-docx.mjs <documentId> <file.docx> [--apply]
// Слова шаблона и docx сопоставляются по тексту (плейсхолдеры {{…}} и значения-образцы
// пропускаются), у совпавших слов начертание выставляется как в docx. Без --apply — только отчёт.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { getBotClients } from "./google-bot.mjs";

const [documentId, docxPath, flag] = process.argv.slice(2);
if (!documentId || !docxPath) throw new Error("укажи ID шаблона и путь к .docx");
const WORD = /\{\{[^}]*\}\}|[A-Za-z][A-Za-z’'\-]*/g;

// docx: слова и жирный по ранам (unzip из системы, без лишних зависимостей)
const xml = execFileSync("unzip", ["-p", docxPath, "word/document.xml"], { maxBuffer: 64 << 20 }).toString("utf8");
const body = xml.slice(xml.indexOf("<w:body>"));
const ref = [];
for (const run of body.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || []) {
  const text = (run.match(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g) || []).map((t) => t.replace(/<[^>]+>/g, "")).join("")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  const rpr = (run.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/) || [])[1] || "";
  const bold = /<w:b\/>|<w:b w:val="(1|true)"\/>/.test(rpr);
  for (const w of text.match(/[A-Za-z][A-Za-z’'\-]*/g) || []) ref.push({ w, bold });
}

const { docs } = getBotClients();
const doc = (await docs.documents.get({ documentId })).data;
const tpl = [];
const walk = (content) => {
  for (const el of content || []) {
    for (const pe of el.paragraph?.elements || []) {
      const run = pe.textRun;
      if (!run) continue;
      for (const m of run.content.matchAll(WORD)) {
        if (m[0].startsWith("{{")) continue;
        tpl.push({ w: m[0], bold: Boolean(run.textStyle?.bold), start: pe.startIndex + m.index, end: pe.startIndex + m.index + m[0].length });
      }
    }
    for (const row of el.table?.tableRows || []) for (const cell of row.tableCells) walk(cell.content);
  }
};
walk(doc.body.content);

// LCS по словам (difflib-подобно): совпавшие цепочки
const A = tpl.map((x) => x.w), B = ref.map((x) => x.w);
const n = A.length, m = B.length;
const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
for (let i = n - 1; i >= 0; i -= 1) for (let j = m - 1; j >= 0; j -= 1)
  dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
const fixes = [];
for (let i = 0, j = 0; i < n && j < m;) {
  if (A[i] === B[j]) { if (tpl[i].bold !== ref[j].bold) fixes.push({ ...tpl[i], to: ref[j].bold }); i += 1; j += 1; }
  else if (dp[i + 1][j] >= dp[i][j + 1]) i += 1; else j += 1;
}
console.log(`слов шаблона: ${n}, docx: ${m}, расхождений по жирному: ${fixes.length}`);
for (const f of fixes) console.log(`  ${f.to ? "+Ж" : "−Ж"} ${f.w}`);
if (flag === "--apply" && fixes.length) {
  const requests = fixes.map((f) => ({ updateTextStyle: { range: { startIndex: f.start, endIndex: f.end }, textStyle: { bold: f.to }, fields: "bold" } }));
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
  console.log("применено");
}
