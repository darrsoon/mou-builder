import test from "node:test";
import assert from "node:assert/strict";
import { normalizePartyList, buildPartyBlock, validateMou } from "../lib/mou/core.js";
import { partyHasEid, stripValueMarks } from "../lib/mou/helpers.js";

const person = { salutation: "Mr.", name: "Ivan Petrov", nationality: "Russian Federation", passport: "722", ownershipPercent: "100" };

test("Emirates ID: без галочки номер в договор не идёт, даже если остался в поле", () => {
  const [p] = normalizePartyList([{ ...person, hasEid: false, eid: "784-1985-1234567-1" }]);
  assert.equal(p.eid, "");
  assert.ok(!buildPartyBlock([p]).includes("EID"));
});

test("Emirates ID: с галочкой номер в блоке стороны", () => {
  const [p] = normalizePartyList([{ ...person, hasEid: true, eid: "784-1985-1234567-1" }]);
  assert.ok(stripValueMarks(buildPartyBlock([p])).includes("holder of EID Number <<784-1985-1234567-1>>"));
});

test("Emirates ID: черновик без галочки — ID есть, если номер введён", () => {
  assert.equal(partyHasEid({ eid: "784-1985-1234567-1" }), true);
  assert.equal(partyHasEid({ eid: "" }), false);
  assert.equal(partyHasEid({ eid: "784-1985-1234567-1", hasEid: false }), false);
});

test("Emirates ID: галочка без полного номера — ошибка проверки", () => {
  const base = { sellers: normalizePartyList([{ ...person, hasEid: true, eid: "784-1985" }]), buyers: normalizePartyList([person]) };
  const { errors } = validateMou(base);
  assert.ok(errors.some((e) => e.startsWith("Seller 1: отмечен Emirates ID")), errors.join("\n"));
  const ok = validateMou({ ...base, sellers: normalizePartyList([{ ...person, hasEid: true, eid: "784-1985-1234567-1" }]) });
  assert.ok(!ok.errors.some((e) => e.includes("Emirates ID")));
});

import { buildValueHighlightRequests, highlightReplacementValue } from "../lib/google/docs.js";

test("подсветка вставленного: значения из формы помечаются, служебные подстановки — нет", () => {
  assert.equal(highlightReplacementValue("selling_price", "1,670,000"), "\u27E61,670,000\u27E7");
  assert.equal(highlightReplacementValue("article_buyer_default_number", "7"), "7");
  assert.equal(highlightReplacementValue("agencies_word", "Agencies"), "Agencies");
  assert.equal(highlightReplacementValue("buyer_deposit_holder", "the <<Buyer’s Agency>> as <<stakeholder>>"), "the <<Buyer’s Agency>> as <<stakeholder>>");
  assert.equal(highlightReplacementValue("additional_information", ""), "");
  // в блоке стороны помечены только значения, связки («nationality:») — нет
  const block = buildPartyBlock(normalizePartyList([{ ...person, hasEid: true, eid: "784-1985-1234567-1" }]));
  assert.ok(block.includes("nationality: <<\u27E6Russian Federation\u27E7>>"));
  assert.ok(block.includes("<<\u27E6100%\u27E7>>"));
});

test("подсветка вставленного: жёлтый между метками, метки удаляются снизу вверх", () => {
  const text = "Price: \u27E6100\u27E7 AED\n";
  const doc = { body: { content: [{ startIndex: 1, endIndex: 1 + text.length, paragraph: { elements: [
    { startIndex: 1, endIndex: 1 + text.length, textRun: { content: text } }] } }] } };
  const reqs = buildValueHighlightRequests(doc);
  assert.deepEqual(reqs[0].updateTextStyle.range, { startIndex: 9, endIndex: 12 });
  assert.deepEqual(reqs.slice(1).map((r) => r.deleteContentRange.range.startIndex), [12, 8]);
  // без подсветки — только удаление меток
  assert.ok(buildValueHighlightRequests(doc, false).every((r) => r.deleteContentRange));
});
