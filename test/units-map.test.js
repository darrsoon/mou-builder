import test from "node:test";
import assert from "node:assert/strict";
import { bedroomsLabel, formatMoney, mapPlatformUnit, matchProject, unitStatusLabel } from "../lib/units/map.js";

test("юнит с платформы: поля формы MOU", () => {
  const r = mapPlatformUnit({
    id: "u1", code: "041·02·004", unit_number: "B5-07-15", project_name: " The Row ", island: "Saadiyat Island",
    property_type: "Apartment", unit_type: "2BR", area_sqm: "95.50", gross_area_sqm: null,
    original_price_aed: "1494050.00", selling_price_aed: "1670000.00", readiness: "off_plan",
  });
  assert.deepEqual(r.fields, {
    projectName: "The Row", unitNumber: "B5-07-15", unitStatus: "Off-Plan", propertyType: "Apartment",
    bedrooms: "2 Bedrooms", areaM2: "95.5", sellingPrice: "1,670,000", originalPrice: "1,494,050",
    propertyLocation: "Saadiyat Island",
  });
  assert.equal(r.platformProject, "The Row");
});

test("пустые значения не превращаются в 0", () => {
  const r = mapPlatformUnit({ project_name: "X", area_sqm: "0", gross_area_sqm: "120", selling_price_aed: null, readiness: null });
  assert.equal(r.fields.areaM2, "120");
  assert.equal(r.fields.sellingPrice, "");
  assert.equal(r.fields.unitStatus, "");
});

test("спальни, статус, деньги", () => {
  assert.equal(bedroomsLabel("Studio"), "Studio");
  assert.equal(bedroomsLabel("1 BR"), "1 Bedroom");
  assert.equal(bedroomsLabel("3 Bed + Maid"), "3 Bedrooms");
  assert.equal(bedroomsLabel("Penthouse"), "Penthouse");
  assert.equal(unitStatusLabel("ready_rented"), "Ready");
  assert.equal(unitStatusLabel("ready_vacant"), "Ready");
  assert.equal(unitStatusLabel("under_construction"), "Off-Plan");
  assert.equal(formatMoney("7284964.80"), "7,284,964.80");
});

test("проект сверяется с PROJECTS без учёта регистра и пробелов", () => {
  const projects = [{ project_name: "GARDENIA BAY" }, { project_name: "The Row Saadiyat" }];
  assert.deepEqual(matchProject("Gardenia  Bay", projects), { projectName: "GARDENIA BAY", matched: true });
  assert.deepEqual(matchProject("Unknown", projects), { projectName: "Unknown", matched: false });
});
