import test from "node:test";
import assert from "node:assert/strict";
import { parseUnits } from "../lib/mou/units.js";

test("юниты C3 из таблицы объявлений: номер без «Booked», спальни как в LISTS, площадь с точкой", () => {
  const values = [
    ["Unit", "# Br", "Old Price", "Area, sqm", "Title Deed", "Parking "],
    ["G02", "3BHK+Maid", "8.000.400 AED", "230,58", "2026/1158094", "B-07, B-08"],
    [],
    ["204 Booked", "1BHK", "", "92,71", "2026/1158073", "B-34"],
    ["201", "2BHK+Maid", "", "140,55", "", "B-27"],
  ];
  assert.deepEqual(parseUnits(values), [
    { unit: "G02", bedrooms: "3BHK + Maid", areaM2: "230.58", titleDeedNumber: "2026/1158094", parkingSpaces: "B-07, B-08" },
    { unit: "204", bedrooms: "1BHK", areaM2: "92.71", titleDeedNumber: "2026/1158073", parkingSpaces: "B-34" },
    { unit: "201", bedrooms: "2BHK + Maid", areaM2: "140.55", titleDeedNumber: "", parkingSpaces: "B-27" },
  ]);
  assert.deepEqual(parseUnits([]), []);
  assert.deepEqual(parseUnits([["Name"], ["x"]]), []); // нет колонки Unit
});

test("юниты с платформы через AutoPost: спальни как в LISTS, без секрета — пусто", async () => {
  const { bedroomsFromUnitType, mapPlatformUnits, fetchPlatformUnits } = await import("../lib/mou/units.js");
  assert.equal(bedroomsFromUnitType("2 BR"), "2BHK");
  assert.equal(bedroomsFromUnitType("3BR + Maid"), "3BHK + Maid");
  assert.equal(bedroomsFromUnitType("Studio"), "Studio");
  assert.equal(bedroomsFromUnitType(""), "");
  assert.deepEqual(mapPlatformUnits([{ unit: " SL3-V-335 ", unitType: "4 Bedroom", areaSqm: "312.4", propertyType: "Villa" }, { unit: "" }]),
    [{ unit: "SL3-V-335", bedrooms: "4BHK", areaM2: "312.4", propertyType: "Villa" }]);
  delete process.env.MOU_UNITS_TOKEN;
  assert.deepEqual(await fetchPlatformUnits("Saadiyat Lagoons", { fetchImpl: () => { throw new Error("не должен звать"); } }), []);
  process.env.MOU_UNITS_TOKEN = "t";
  let sent;
  const units = await fetchPlatformUnits("Saadiyat Lagoons", { fetchImpl: async (url, opts) => { sent = { url, opts };
    return { ok: true, json: async () => ({ units: [{ unit: "A1", unitType: "1 BR", areaSqm: "70", propertyType: "Apartment" }] }) }; } });
  assert.equal(units[0].bedrooms, "1BHK");
  assert.match(sent.url, /\/api\/mou-units\?project=Saadiyat%20Lagoons$/);
  assert.equal(sent.opts.headers.authorization, "Bearer t");
  delete process.env.MOU_UNITS_TOKEN;
});
