import test from "node:test";
import assert from "node:assert/strict";
import { formatArea } from "../lib/mou/helpers.js";
import { normalizeForm } from "../lib/mou/core.js";

test("площадь: всегда точка и два знака", () => {
  assert.equal(formatArea("67.20"), "67.20");
  assert.equal(formatArea("67,20"), "67.20");
  assert.equal(formatArea("67.2"), "67.20");
  assert.equal(formatArea("67,2"), "67.20");
  assert.equal(formatArea("67"), "67.00");
  assert.equal(formatArea("133,07"), "133.07");
  assert.equal(formatArea("1 234,5"), "1234.50");
  assert.equal(formatArea("1,234.50"), "1234.50");
  assert.equal(formatArea(" 95.5 "), "95.50");
});

test("площадь: пусто и текст не трогаем", () => {
  assert.equal(formatArea(""), "");
  assert.equal(formatArea(undefined), "");
  assert.equal(formatArea("approx. 67 sq.m"), "approx. 67 sq.m");
  assert.equal(formatArea("1.234.5"), "1.234.5");
});

test("в договор площадь уходит с точкой", () => {
  assert.equal(normalizeForm({ areaM2: "95,5" }).areaM2, "95.50");
});

test("Title Deed пустой — в договор «N/A», заполненный — как есть", () => {
  assert.equal(normalizeForm({}).titleDeedNumber, "N/A");
  assert.equal(normalizeForm({ titleDeedNumber: " " }).titleDeedNumber, "N/A");
  assert.equal(normalizeForm({ titleDeedNumber: "2026/0000" }).titleDeedNumber, "2026/0000");
});
