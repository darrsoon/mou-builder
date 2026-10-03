import test from "node:test";
import assert from "node:assert/strict";
import { cleanAgent } from "../lib/mou/helpers.js";

test("cleanAgent: строка PRIME BRIDGE из AGENTS приводится к виду для договора", () => {
  const a = cleanAgent({
    name: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C",
    license: "#CN-6410679",
    representative: "Manager\nMikhail Slobodchikov",
    position: "",
    address: "Office 6, Ar\nRaha 8 St, MUSAFFAH, Abu Dhabi, 20335",
  });
  assert.equal(a.license, "CN-6410679");
  assert.equal(a.position, "Manager");
  assert.equal(a.representative, "Mikhail Slobodchikov");
  assert.equal(a.address, "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335");
});

test("cleanAgent: заполненная Position не трогает имя", () => {
  const a = cleanAgent({ name: "X ", license: "CN-1", representative: "Ivan Ivanov", position: "Director", address: "" });
  assert.deepEqual(a, { name: "X", license: "CN-1", representative: "Ivan Ivanov", position: "Director", address: "" });
});
