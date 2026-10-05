// Юниты платформы app.primebridge.estate — база IT-команды (Neon Postgres), та же,
// что читает AutoPost. СТРОГО ТОЛЬКО ЧТЕНИЕ: строка UNITS_DB_URL сейчас под владельцем
// базы, поэтому каждый запрос идёт в транзакции READ ONLY — Postgres отклонит любую запись.
// Только Абу-Даби: шаблоны MOU — под ADM.
import { neon } from "@neondatabase/serverless";

let sql;
function db() {
  if (!process.env.UNITS_DB_URL) {
    const error = new Error("Поиск по платформе не настроен: нет UNITS_DB_URL.");
    error.status = 503;
    throw error;
  }
  sql ||= neon(process.env.UNITS_DB_URL);
  return sql;
}

async function readOnly(build) {
  const q = db();
  const [rows] = await q.transaction([build(q)], { readOnly: true });
  return rows;
}

// По номеру юнита (часть) или по коду (цифры, точки не важны) — как поиск в AutoPost
export async function searchUnits(query) {
  const raw = String(query || "").trim();
  if (raw.length < 2) return [];
  const digits = raw.replace(/\D/g, "");
  // «B5-07-15» по цифрам кода не ищем — совпадёт с чужими кодами
  const codeDigits = /[a-zа-яё]/i.test(raw) ? "" : digits;
  const rows = await readOnly((q) => q`
    SELECT u.id, u.code, u.unit_number, btrim(p.name) AS project, u.status::text AS status
    FROM units u JOIN projects p ON p.id = u.project_id
    WHERE u.emirate::text = 'Abu Dhabi'
      AND (
        u.unit_number ILIKE ${"%" + raw + "%"}
        OR (${codeDigits} <> '' AND regexp_replace(u.code, '[^0-9]', '', 'g') LIKE ${codeDigits} || '%')
      )
    ORDER BY (lower(btrim(u.unit_number)) = lower(${raw})) DESC, p.name, u.unit_number
    LIMIT 20
  `);
  return rows.map((r) => ({
    id: String(r.id),
    code: String(r.code || ""),
    unitNumber: String(r.unit_number || ""),
    project: String(r.project || ""),
    status: String(r.status || ""),
  }));
}

export async function getUnit(id) {
  const rows = await readOnly((q) => q`
    SELECT u.id, u.code, u.unit_number, btrim(p.name) AS project_name, d.name AS island,
           u.property_type, u.unit_type, u.area_sqm, u.gross_area_sqm,
           u.original_price_aed, u.selling_price_aed, u.readiness::text AS readiness
    FROM units u
    JOIN projects p ON p.id = u.project_id
    LEFT JOIN districts d ON d.id = p.district_id
    WHERE u.id::text = ${String(id)} AND u.emirate::text = 'Abu Dhabi'
    LIMIT 1
  `);
  return rows[0] || null;
}
