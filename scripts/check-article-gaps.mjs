// Перед каждым заголовком «Article …» — пустая строка или интервал (Алина, 21.10.2026: в №4 перед Article 15 её не было).
//   node scripts/check-article-gaps.mjs <documentId> [<documentId> …]
import { getBotClients } from "./google-bot.mjs";
const { docs } = getBotClients();
for (const id of process.argv.slice(2)) {
  const ps = (await docs.documents.get({ documentId: id })).data.body.content.filter((b) => b.paragraph);
  const t = (b) => (b.paragraph.elements || []).map((e) => e.textRun?.content || "").join("");
  const plain = (b) => t(b).replace(/\{\{[#/][^}]*\}\}/g, "");
  const out = [];
  ps.forEach((b, i) => {
    if (!/^Article (\{\{|\d)/.test(plain(b)) || i === 0) return;
    const prev = ps[i - 1];
    const prevEmpty = plain(prev).trim() === "";
    const gap = (prev.paragraph.paragraphStyle.spaceBelow?.magnitude || 0) + (b.paragraph.paragraphStyle.spaceAbove?.magnitude || 0);
    if (!prevEmpty && gap < 6) out.push(`${plain(b).trim().slice(0, 45)}  ← после «${plain(prev).trim().slice(-40)}»`);
  });
  console.log(id.slice(0, 6), out.length ? "\n   " + out.join("\n   ") : "ок");
}
