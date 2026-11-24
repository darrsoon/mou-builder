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

// Юниты остальных проектов — из базы платформы через AutoPost (Алина, 24.11.2026: «через AutoPost»).
// MOU Builder к базе не подключается: AutoPost отдаёт только справку (/api/mou-units, только чтение) по общему
// секрету MOU_UNITS_TOKEN. Нет секрета или AutoPost не ответил — список пустой, поля заполняются руками.
export const AUTOPOST_URL = process.env.AUTOPOST_URL || "https://real-estate-autopost.vercel.app";

// «2 BR», «2BR + Maid», «3 Bedroom», «Studio» → как в списке Bedroom (LISTS): «2BHK», «2BHK + Maid», «Studio»
export function bedroomsFromUnitType(unitType) {
  const raw = String(unitType || "").trim();
  if (!raw) return "";
  if (/studio/i.test(raw)) return "Studio";
  const m = raw.match(/(\d+)\s*(?:br|bhk|bed|bedroom|bedrooms|b\/r)?\b/i);
  if (!m) return raw;
  return `${m[1]}BHK${/maid/i.test(raw) ? " + Maid" : ""}`;
}

// ответ AutoPost → поля формы; площадь — с точкой («95.5» → «95.50» на стороне формы через formatArea)
export function mapPlatformUnits(units) {
  return (Array.isArray(units) ? units : [])
    .map((u) => ({
      unit: String(u?.unit || "").trim(),
      bedrooms: bedroomsFromUnitType(u?.unitType),
      areaM2: String(u?.areaSqm ?? "").trim(),
      propertyType: String(u?.propertyType || "").trim(),
      // Title Deed и парковки в базе платформы нет — их форма не трогает
    }))
    .filter((u) => u.unit);
}

export async function fetchPlatformUnits(project, { fetchImpl = fetch } = {}) {
  const token = process.env.MOU_UNITS_TOKEN || "";
  if (!token || !String(project || "").trim()) return [];
  const url = `${AUTOPOST_URL}/api/mou-units?project=${encodeURIComponent(project)}`;
  const res = await fetchImpl(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return [];
  return mapPlatformUnits((await res.json())?.units);
}
