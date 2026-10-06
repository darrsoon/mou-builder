import { MOU_CONFIG } from "@/lib/mou/config";
import { DEFAULT_RULES } from "@/lib/mou/articles";
import { cleanAgent, keyFromHeader } from "@/lib/mou/helpers";

export async function getInitData(sheets) {
  const [projects, lists, drafts, rules, agents] = await Promise.all([
    readProjects(sheets),
    readLists(sheets),
    readDrafts(sheets),
    readRules(sheets),
    readAgents(sheets),
  ]);

  return { projects, lists, drafts, rules, agents };
}

// Вкладка AGENTS: справочник агентств (Agent | License | Agent's name | Agent's position | Agent's adress).
// Заголовки матчим гибко, чтобы опечатки/переименования колонок не ломали чтение.
export async function readAgents(sheets) {
  let values;
  try {
    values = await readRange(sheets, `${MOU_CONFIG.agentsSheet}!A:Z`);
  } catch {
    return []; // вкладки ещё нет — работаем без справочника
  }
  if (values.length < 2) return [];

  const headers = values[0].map((h) => keyFromHeader(h));
  const findCol = (...candidates) => {
    const exact = headers.findIndex((h) => candidates.includes(h));
    if (exact !== -1) return exact;
    return headers.findIndex((h) => candidates.some((c) => h.includes(c)));
  };

  const nameCol = findCol("agent");
  const licenseCol = findCol("license", "licence");
  const repCol = findCol("agent_s_name", "representative", "manager");
  const positionCol = findCol("position");
  const addressCol = findCol("adress", "address");

  const cell = (row, col) => (col === -1 ? "" : String(row[col] || "").trim());
  return values
    .slice(1)
    .map((row) => cleanAgent({
      name: cell(row, nameCol),
      license: cell(row, licenseCol),
      representative: cell(row, repCol),
      position: cell(row, positionCol),
      address: cell(row, addressCol),
    }))
    .filter((agent) => agent.name);
}

// Новые агентства и представители — в AGENTS (Даша, 06.10.2026). Вызывается после создания
// MOU / Commission Agreement. Строка = агентство + представитель:
// — такого агентства нет — добавляем строку;
// — агентство есть, а представителя нет — новая строка (у агентства может быть несколько);
// — строка с этим представителем есть — обновляем должность, если её поменяли в форме;
// лицензия и адрес — общие для агентства, поправленные в форме обновляются во всех его строках.
// Пустые поля формы таблицу не затирают. Колонки ищем по заголовкам, как readAgents.
export async function syncAgents(sheets, entries) {
  const list = (entries || []).map(cleanAgent).filter((a) => a.name);
  if (!list.length) return { added: 0, updated: 0 };
  const values = await readRange(sheets, `${MOU_CONFIG.agentsSheet}!A:Z`);
  if (!values.length) return { added: 0, updated: 0 };
  const headers = values[0].map((h) => keyFromHeader(h));
  const findCol = (...candidates) => {
    const exact = headers.findIndex((h) => candidates.includes(h));
    if (exact !== -1) return exact;
    return headers.findIndex((h) => candidates.some((c) => h.includes(c)));
  };
  const col = {
    name: findCol("agent"),
    license: findCol("license", "licence"),
    representative: findCol("agent_s_name", "representative", "manager"),
    position: findCol("position"),
    address: findCol("adress", "address"),
  };
  if (col.name === -1) return { added: 0, updated: 0 };

  const key = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9а-яё]/g, "");
  const rows = values.slice(1).map((row, i) => ({
    rowNumber: i + 2,
    ...cleanAgent(Object.fromEntries(Object.entries(col).map(([f, c]) => [f, c === -1 ? "" : String(row[c] || "")]))),
  }));
  const letter = (c) => String.fromCharCode(65 + c);
  const updates = [];
  const appends = [];
  const setCell = (rowNumber, field, value) => {
    if (col[field] === -1) return;
    updates.push({ range: `${MOU_CONFIG.agentsSheet}!${letter(col[field])}${rowNumber}`, values: [[value]] });
  };

  for (const a of list) {
    const same = rows.filter((r) => key(r.name) === key(a.name));
    for (const field of ["license", "address"]) {
      if (!a[field]) continue;
      same.filter((r) => r[field] !== a[field]).forEach((r) => { setCell(r.rowNumber, field, a[field]); r[field] = a[field]; });
    }
    const rep = a.representative && same.find((r) => key(r.representative) === key(a.representative));
    const blank = !rep && same.find((r) => !r.representative);
    if (rep) {
      if (a.position && rep.position !== a.position) { setCell(rep.rowNumber, "position", a.position); rep.position = a.position; }
    } else if (blank && a.representative) {
      setCell(blank.rowNumber, "representative", a.representative);
      if (a.position) setCell(blank.rowNumber, "position", a.position);
      Object.assign(blank, { representative: a.representative, position: a.position || blank.position });
    } else if (!same.length || (a.representative && !rep)) {
      const row = new Array(Math.max(...Object.values(col)) + 1).fill("");
      for (const [f, c] of Object.entries(col)) if (c !== -1) row[c] = a[f] || "";
      appends.push(row);
      rows.push({ rowNumber: -1, ...a });
    }
  }

  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: MOU_CONFIG.spreadsheetId,
      requestBody: { valueInputOption: "RAW", data: updates },
    });
  }
  if (appends.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: MOU_CONFIG.spreadsheetId,
      range: `${MOU_CONFIG.agentsSheet}!A:Z`,
      valueInputOption: "RAW",
      requestBody: { values: appends },
    });
  }
  return { added: appends.length, updated: updates.length };
}

export async function readProjects(sheets) {
  const values = await readRange(sheets, `${MOU_CONFIG.projectsSheet}!A:Z`);
  if (values.length < 2) return [];
  const headers = values[0].map((h) => keyFromHeader(h));
  return values
    .slice(1)
    .filter((row) => String(row[0] || "").trim())
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, String(row[i] || "").trim()])));
}

export async function readLists(sheets) {
  const values = await readRange(sheets, `${MOU_CONFIG.listsSheet}!A:Z`);
  if (!values.length) return {};
  const headers = values[0].map((h) => keyFromHeader(h));
  const lists = {};
  headers.forEach((header, col) => {
    if (!header) return;
    // дубли в столбце справочника роняют React (одинаковые key у пунктов списка)
    lists[header] = Array.from(new Set(values
      .slice(1)
      .map((row) => String(row[col] || "").trim())
      .filter(Boolean)));
  });
  return lists;
}

export async function readRules(sheets) {
  return DEFAULT_RULES;
}

export async function readDrafts(sheets) {
  const values = await readRange(sheets, `${MOU_CONFIG.logSheet}!A:Z`);
  if (values.length < 2) return [];
  const headers = values[0].map((h) => String(h || "").trim());
  const col = (name) => headers.indexOf(name);
  const jsonCol = col("Form JSON");
  if (jsonCol === -1) return [];

  return values
    .slice(1)
    .map((row, index) => {
      const rowNumber = index + 2;
      const label = [
        row[col("Date Created")] || "",
        row[col("Project")] || "",
        row[col("Unit Number")] || "",
        row[col("Seller")] || "",
        row[col("Buyer")] || "",
      ]
        .filter(Boolean)
        .join(" | ");

      return {
        rowNumber,
        label: label || `Draft row ${rowNumber}`,
        link: row[col("Google Doc Link")] || "",
        hasFormJson: Boolean(row[jsonCol]),
      };
    })
    .filter((item) => item.hasFormJson)
    .reverse();
}

export async function readDraftForm(sheets, rowNumber) {
  const values = await readRange(sheets, `${MOU_CONFIG.logSheet}!A:Z`);
  if (values.length < 2) throw new Error("DRAFTS_LOG пустой.");
  const headers = values[0].map((h) => String(h || "").trim());
  const jsonCol = headers.indexOf("Form JSON");
  if (jsonCol === -1) throw new Error("В DRAFTS_LOG нет колонки Form JSON.");
  const row = Number(rowNumber);
  if (!row || row < 2 || !values[row - 1]) throw new Error("Черновик не найден.");
  const json = values[row - 1][jsonCol];
  if (!json) throw new Error("У этого draft нет сохраненных данных формы.");
  return JSON.parse(json);
}

export async function appendDraftLog(sheets, item) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: MOU_CONFIG.spreadsheetId,
    range: `${MOU_CONFIG.logSheet}!A:I`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toLocaleString("ru-RU", { timeZone: "Europe/Madrid" }),
          item.agreementDate || "",
          item.projectName || "",
          item.unitNumber || "",
          item.sellerName || "",
          item.buyerName || "",
          item.sellingPrice || "",
          item.docUrl || "",
          item.formJson || "",
        ],
      ],
    },
  });
}

async function readRange(sheets, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MOU_CONFIG.spreadsheetId,
    range,
    valueRenderOption: "FORMATTED_VALUE",
  });
  return res.data.values || [];
}
