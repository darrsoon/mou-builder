// C3 Garden Residence (Алина, 31.10.2026): шаблоны собираются из принятых №3 (Cash) и №4 (Mortgage) —
// все принятые правки оформления переходят сами; здесь только отличия эталонов C3 (чистовики Даши 03.10:
// 1dNTgKE0… Cash, 1bqVyqlt… Mortgage):
//   - Продавец — LUCKY HOLDING - F.Z.E текстом («данные по Продавцу остаются полностью»), лицензия — новая
//     (выдана 13.10.2026, до 12.10.2027); в форме раздела Seller нет (fixedSeller в реестре);
//   - в PAYMENT TABLE «NOC Fee» и «Admin Fee» застройщику (to Developer by Bank Transfer or Card) вместо
//     Developer / Community NOC Fee; в Cash ADM Electronic Fee — «by Card».
//   node scripts/make-c3.mjs <documentId> [--cash]
// Повтор безопасен: уже сделанные правки не находятся и пропускаются.
import { getBotClients } from "./google-bot.mjs";
import { applyEdits } from "./docs-edit.mjs";

const SELLER = [
  { text: "LUCKY HOLDING - F.Z.E, Trade License #46879, Issue Date: 13.10.2026, Expiry Date: 12.10.2027, Ownership rights – 100%, "
      + "acting through its shareholders, who are duly authorized to sign and bind the Company, namely:",
    bold: ["LUCKY HOLDING - F.Z.E", "#46879", "13.10.2026", "12.10.2027", "100%"], indent: 36 },
  { text: "• Mr. Marc Glotser, nationality: Germany, holder of Passport number: C3FH45JJ0, holder of EID Number 784-1993-1252785-8, "
      + "holding 100% ownership interest in the Company, has designated Mr. Daniyar Kussainov (pursuant to a valid Power of Attorney), "
      + "nationality: Kazakhstan, holder of Passport number: N19034152, holder of EID Number 784-1987-6780796-3,",
    bold: ["Marc Glotser", "Germany", "C3FH45JJ0", "784-1993-1252785-8", "100% ownership interest", "Daniyar Kussainov",
      "Power of Attorney)", "Kazakhstan", "N19034152", "784-1987-6780796-3"], indent: 36 },
  { text: "hereinafter referred to as the «Seller»", bold: ["«Seller»"], indent: 1 },
];
const PLACEHOLDER = "{{seller_party_block}}, hereinafter referred to as the «Seller»";

const documentId = process.argv[2];
if (!documentId) throw new Error("укажи ID документа");
const cash = process.argv.includes("--cash");
const { docs } = getBotClients();

// 1. Блок Продавца вместо {{seller_party_block}}
const content = (await docs.documents.get({ documentId })).data.body.content;
const text = (b) => (b.paragraph?.elements || []).map((e) => e.textRun?.content || "").join("");
const para = content.find((b) => text(b).replace(/\n$/, "") === PLACEHOLDER);
if (!para) {
  console.log("блок Продавца: уже заменён");
} else {
  const start = para.startIndex;
  const body = SELLER.map((p) => p.text).join("\n");
  const requests = [
    { deleteContentRange: { range: { startIndex: start, endIndex: para.endIndex - 1 } } },
    { insertText: { location: { index: start }, text: body } },
    { updateTextStyle: { range: { startIndex: start, endIndex: start + body.length },
      textStyle: { bold: false, backgroundColor: {} }, fields: "bold,backgroundColor" } },
  ];
  let at = start;
  for (const p of SELLER) {
    for (const word of p.bold) {
      const k = p.text.indexOf(word);
      if (k === -1) throw new Error(`нет «${word}»`);
      requests.push({ updateTextStyle: { range: { startIndex: at + k, endIndex: at + k + word.length },
        textStyle: { bold: true }, fields: "bold" } });
    }
    requests.push({ updateParagraphStyle: { range: { startIndex: at, endIndex: at + p.text.length + 1 },
      paragraphStyle: { indentFirstLine: { magnitude: p.indent, unit: "PT" }, indentStart: { magnitude: 1, unit: "PT" } },
      fields: "indentFirstLine,indentStart" } });
    at += p.text.length + 1;
  }
  await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
  console.log("блок Продавца: LUCKY HOLDING");
}

// 2. PAYMENT TABLE: NOC Fee и Admin Fee застройщику
const edits = [
  { find: "Developer NOC Fee:", replace: "NOC Fee:", note: "подпись NOC Fee" },
  { find: "to {{developer_name}} upon request by Bank transfer or Card", within: "{{developer_noc_fee}}",
    replace: "to Developer by Bank Transfer or Card", bold: false, runs: [[3, 12, true], [16, 37, true]], noHighlight: [[0, 37]],
    note: "NOC Fee: застройщику картой или переводом" },
  { find: "Community NOC Fee:", replace: "Admin Fee:", note: "подпись Admin Fee" },
  { find: "{{community_noc_fee}}", replace: "{{developer_admin_fee}}", note: "Admin Fee: сумма" },
  { find: "to be paid by the Seller to {{developer_legal_name}} upon request by Bank transfer or Card", within: "{{developer_admin_fee}}",
    replace: "to be paid by the Buyer to Developer by Bank Transfer or Card", bold: false,
    runs: [[18, 23, true], [27, 36, true], [40, 61, true]], noHighlight: [[0, 61]], note: "Admin Fee: платит Покупатель застройщику" },
];
if (cash) {
  edits.push({ find: "by Manager’s Cheque or Card", within: "{{adm_electronic_fee}}", replace: "by Card", bold: false,
    runs: [[3, 7, true]], noHighlight: [[0, 7]], note: "ADM Electronic Fee: by Card (эталон C3 Cash)" });
}
const res = await applyEdits(docs, documentId, edits);
console.log(JSON.stringify(res));
