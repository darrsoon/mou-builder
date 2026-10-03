export function keyFromHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[%]/g, "percent")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function s(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

export function n(value) {
  if (value === "" || value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isNaN(value) ? "" : value;

  let raw = String(value)
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, "")
    .replace(/AED/gi, "")
    .replace(/[^\d,.\-]/g, "");

  if (!raw) return "";

  const commaCount = (raw.match(/,/g) || []).length;
  const dotCount = (raw.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      raw = raw.replace(/\./g, "").replace(",", ".");
    } else {
      raw = raw.replace(/,/g, "");
    }
  } else if (commaCount > 0) {
    if (commaCount > 1 || /^\d{1,3}(,\d{3})+$/.test(raw)) {
      raw = raw.replace(/,/g, "");
    } else {
      raw = raw.replace(",", ".");
    }
  } else if (dotCount > 0) {
    if (dotCount > 1 || /^\d{1,3}(\.\d{3})+$/.test(raw)) {
      raw = raw.replace(/\./g, "");
    }
  }

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? "" : parsed;
}

export function bool(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "yes" || normalized === "true" || normalized === "1" || value === true;
}

export function boolDefault(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return bool(value);
}

// Сумма для договора: «170,000» без копеек, «1,037.50» — с копейками (Даша, 03.10.2026:
// «.00» убираем везде, где копеек нет)
export function money(num) {
  if (num === "" || num === null || num === undefined) return "";
  const value = Number(num);
  const hasFils = Math.round(Math.abs(value) * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasFils ? 2 : 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(Number(num));
}

export function moneyNoDecimals(num) {
  if (num === "" || num === null || num === undefined) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(Number(num));
}

export function percent(num) {
  if (num === "" || num === null || num === undefined) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(Number(num));
}

export function formatPropertyLocation(value) {
  const text = s(value);
  if (!text) return "";
  const lower = text.toLowerCase();
  if (lower.includes("abu dhabi") || lower.includes("uae")) return text;
  return `${text}, Abu Dhabi, UAE`;
}

export function sanitizeFileName(value) {
  return String(value || "").replace(/[\\/:*?"<>|]/g, "-");
}

// Ячейки справочника заполняют руками: переносы строк внутри ячейки, «#» перед
// лицензией (в шаблоне «#» уже стоит), должность в одной ячейке с именем
// («Manager⏎Mikhail Slobodchikov» при пустой Position) — приводим к виду для договора.
export function cleanAgent(agent) {
  const oneLine = (v) => String(v || "").replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  let { representative = "", position = "" } = agent;
  const lines = String(representative).split("\n").map((l) => l.trim()).filter(Boolean);
  if (!String(position).trim() && lines.length > 1) {
    position = lines[0];
    representative = lines.slice(1).join(" ");
  }
  return {
    name: oneLine(agent.name),
    license: oneLine(agent.license).replace(/^#+\s*/, ""),
    representative: oneLine(representative),
    position: oneLine(position),
    address: oneLine(agent.address),
  };
}
