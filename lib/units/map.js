// Юнит с платформы app.primebridge.estate → поля формы MOU (Даша, 05.10.2026).
// Подставляем только то, что на платформе есть: проект, номер, статус, тип, спальни,
// площадь, цены, остров. Title Deed, парковка, аренда, Paid to Developer — руками.

const num = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

// Первое положительное число: площадь в базе лежит то в area_sqm, то в gross_area_sqm
function firstPositive(...vals) {
  for (const v of vals) {
    const n = num(v);
    if (n != null && n > 0) return n;
  }
  return null;
}

// «1670000.00» → «1,670,000»; филсы оставляем, только если они есть
export function formatMoney(v) {
  const n = num(v);
  if (n == null) return "";
  const hasFils = Math.round(n * 100) % 100 !== 0;
  return n.toLocaleString("en-US", { minimumFractionDigits: hasFils ? 2 : 0, maximumFractionDigits: 2 });
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

// ready_vacant / ready_rented → Ready, любая другая готовность → Off-Plan
export function unitStatusLabel(readiness) {
  const r = String(readiness || "").toLowerCase();
  if (!r) return "";
  return r.startsWith("ready") ? "Ready" : "Off-Plan";
}

const projectKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

// Название проекта как в PROJECTS (оттуда тянутся developer и сборы), иначе — как на платформе
export function matchProject(name, projects = []) {
  const key = projectKey(name);
  const found = key && projects.find((p) => projectKey(p.project_name) === key);
  return found ? { projectName: found.project_name, matched: true } : { projectName: String(name || "").trim(), matched: false };
}

export function mapPlatformUnit(raw, projects = []) {
  const project = matchProject(raw.project_name, projects);
  const area = firstPositive(raw.area_sqm, raw.gross_area_sqm);
  return {
    fields: {
      projectName: project.projectName,
      unitNumber: String(raw.unit_number || "").trim(),
      unitStatus: unitStatusLabel(raw.readiness),
      propertyType: String(raw.property_type || "").trim(),
      bedrooms: bedroomsLabel(raw.unit_type),
      areaM2: area == null ? "" : String(area),
      sellingPrice: formatMoney(raw.selling_price_aed),
      originalPrice: formatMoney(raw.original_price_aed),
      propertyLocation: String(raw.island || "").trim(),
    },
    projectMatched: project.matched,
    platformProject: String(raw.project_name || "").trim(),
    code: String(raw.code || ""),
  };
}
