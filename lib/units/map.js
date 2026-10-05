// Юнит с платформы app.primebridge.estate → поля формы MOU (Даша, 05.10.2026).
// Только Bedrooms, Area, Property Type, Unit Number, Parking Spaces — проект,
// цены и остальное и так берутся из таблицы.

const num = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

// Первое положительное число: площадь в базе лежит то в area_sqm, то в gross_area_sqm
function firstPositive(...vals) {
  for (const v of vals) {
    const n = num(v);
    if (n != null && n > 0) return n;
  }
  return null;
}

// «2BR», «2 BR», «2 Bed» → «2 Bedrooms»; «Studio» → «Studio»; остальное — как есть
export function bedroomsLabel(unitType) {
  const s = String(unitType || "").trim();
  if (!s) return "";
  if (/studio/i.test(s)) return "Studio";
  const m = s.match(/^(\d+)\s*(?:br|bed|bedroom|bedrooms|bhk)\b/i);
  if (!m) return s;
  const n = Number(m[1]);
  return `${n} Bedroom${n === 1 ? "" : "s"}`;
}

// Парковка: как называется колонка, AutoPost не знает — берём первое заполненное
// поле юнита, в названии которого есть «parking» (число мест или номер места)
export function parkingValue(raw) {
  for (const [key, value] of Object.entries(raw || {})) {
    if (!/parking/i.test(key) || value == null || value === "" || value === false) continue;
    if (value === true) continue;
    return String(value).trim();
  }
  return "";
}

export function mapPlatformUnit(raw) {
  const area = firstPositive(raw.area_sqm, raw.gross_area_sqm);
  return {
    fields: {
      unitNumber: String(raw.unit_number || "").trim(),
      propertyType: String(raw.property_type || "").trim(),
      bedrooms: bedroomsLabel(raw.unit_type),
      areaM2: area == null ? "" : String(area),
      parkingSpaces: parkingValue(raw),
    },
  };
}
