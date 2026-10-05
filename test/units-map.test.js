import test from "node:test";
import assert from "node:assert/strict";
import { bedroomsLabel, mapPlatformUnit, parkingValue } from "../lib/units/map.js";

test("юнит с платформы: только Unit Number, Property Type, Bedrooms, Area, Parking", () => {
  const r = mapPlatformUnit({
    id: "u1", code: "041·02·004", unit_number: " B5-07-15 ", property_type: "Apartment", unit_type: "2BR",
    area_sqm: "95.50", gross_area_sqm: null, parking_spaces: 1, selling_price_aed: "1670000.00",
  });
  assert.deepEqual(r.fields, {
    unitNumber: "B5-07-15", propertyType: "Apartment", bedrooms: "2 Bedrooms", areaM2: "95.5", parkingSpaces: "1",
  });
});

test("пустые значения не превращаются в 0", () => {
  const r = mapPlatformUnit({ area_sqm: "0", gross_area_sqm: "120", parking: null });
  assert.equal(r.fields.areaM2, "120");
  assert.equal(r.fields.parkingSpaces, "");
  assert.equal(r.fields.bedrooms, "");
});

test("парковка — первое заполненное поле с «parking» в названии", () => {
  assert.equal(parkingValue({ has_parking: true, parking_number: "B27" }), "B27");
  assert.equal(parkingValue({ parking_count: 0 }), "0");
  assert.equal(parkingValue({ floor: "7" }), "");
});

test("спальни", () => {
  assert.equal(bedroomsLabel("Studio"), "Studio");
  assert.equal(bedroomsLabel("1 BR"), "1 Bedroom");
  assert.equal(bedroomsLabel("3 Bed + Maid"), "3 Bedrooms");
  assert.equal(bedroomsLabel("Penthouse"), "Penthouse");
});
