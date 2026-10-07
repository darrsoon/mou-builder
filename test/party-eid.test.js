import test from "node:test";
import assert from "node:assert/strict";
import { normalizePartyList, buildPartyBlock, validateMou } from "../lib/mou/core.js";
import { partyHasEid } from "../lib/mou/helpers.js";

const person = { salutation: "Mr.", name: "Ivan Petrov", nationality: "Russian Federation", passport: "722", ownershipPercent: "100" };

test("Emirates ID: без галочки номер в договор не идёт, даже если остался в поле", () => {
  const [p] = normalizePartyList([{ ...person, hasEid: false, eid: "784-1985-1234567-1" }]);
  assert.equal(p.eid, "");
  assert.ok(!buildPartyBlock([p]).includes("EID"));
});

test("Emirates ID: с галочкой номер в блоке стороны", () => {
  const [p] = normalizePartyList([{ ...person, hasEid: true, eid: "784-1985-1234567-1" }]);
  assert.ok(buildPartyBlock([p]).includes("holder of EID Number <<784-1985-1234567-1>>"));
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
