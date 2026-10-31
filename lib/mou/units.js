// Юниты проекта из таблицы объявлений (Алина, 31.10.2026: «с этого листа может подтягивать информацию в ячейки»):
// лист «C3 Garden Res» в «Объявления Абу-Даби». По номеру юнита форма подставляет Title Deed, Bedrooms, Area, Parking.
// Колонки ищем по заголовкам: Unit, # Br, Area, sqm, Title Deed, Parking.
import { keyFromHeader } from "./helpers.js";

export const PROJECT_UNITS = {
  "C3 Garden Residence": {
    spreadsheetId: process.env.C3_UNITS_SPREADSHEET_ID || "1hgpIbNJVsfPN6RwFks_ACy643EeZr-0_w7KpIfLpiG8",
    sheet: process.env.C3_UNITS_SHEET || "C3 Garden Res",
  },
};

// «3BHK+Maid» → «3BHK + Maid», как в списке Bedroom (LISTS)
const bedrooms = (v) => String(v || "").trim().replace(/\s*\+\s*/g, " + ");
// «73,87» → «73.87»; разделители тысяч в площади не встречаются
const area = (v) => String(v || "").trim().replace(/\s/g, "").replace(",", ".");

export function parseUnits(values) {
  if (!Array.isArray(values) || values.length < 2) return [];
  const keys = values[0].map((h) => keyFromHeader(h));
  const col = (...names) => keys.findIndex((k) => names.includes(k));
  const c = { unit: col("unit"), br: col("br"), area: col("area_sqm"), deed: col("title_deed"), parking: col("parking") };
  if (c.unit === -1) return [];
  const cell = (row, i) => (i === -1 ? "" : String(row[i] || "").trim());
  return values.slice(1)
    .map((row) => ({
      // «204 Booked» — пометка в таблице, номер юнита — «204»
      unit: cell(row, c.unit).replace(/\s*booked\s*$/i, ""),
      bedrooms: bedrooms(cell(row, c.br)),
      areaM2: area(cell(row, c.area)),
      titleDeedNumber: cell(row, c.deed),
      parkingSpaces: cell(row, c.parking),
    }))
    .filter((u) => u.unit);
}
