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
