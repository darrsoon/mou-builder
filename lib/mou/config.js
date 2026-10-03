// Реестр шаблонов из папки «MOU» в «Автоматизации». Держим в коде, а не только
// в env: значение переменной на Vercel обратно не читается, и молчаливая ошибка
// в ней означала бы генерацию размеченного шаблона старым движком.
// engine: "v2" — шаблон с маркерами {{#if}} / {{#row}}, условия живут в документе.
// defaults — суммы сборов, которые форма подставляет при выборе шаблона; взяты из
// исходника шаблона и остаются редактируемыми (Алина, 06.09 и 13.09.2026).
// unitVerification — в таблице шаблона есть строка «Unit Verification / Search Certificate».
const DEFAULT_TEMPLATES = [
  { id: "1qedPsMWpFLRFqjxPwuK53fXY_43AkkSC5bGc_rAXG0k", label: "1. Off-plan", engine: "v2", articles: "offplan-v2" },
  { id: "1VKkYr8FoFlLlHOVx_aoasdgZzYtB8hP4zaioqm4OaB0", label: "2. Off-plan — mortgage",
    engine: "v2", articles: "offplan-mortgage-v2", mortgage: true,
    defaults: { admElectronicFee: "1,392", admValuationFee: "925.75" } },
  { id: "1G8vUZTjrnBjSdstRNyEuoypRVVoRg8udywTu5g-e1Jk", label: "3. Ready — cash to cash",
    engine: "v2", articles: "ready-cash-v2", ready: true,
    defaults: { admElectronicFee: "919", admValuationFee: "1,037", developerNocFee: "2,750", communityNocFee: "1,050" } },
  { id: "1fsVQKEKGYNng0ND1kkensdIqUOOQ7h_KgobDCoKwN-E", label: "4. Ready — cash to mortgage",
    engine: "v2", articles: "ready-mortgage-v2", ready: true, mortgage: true, unitVerification: true,
    defaults: { admElectronicFee: "1,392", admValuationFee: "1,037", developerNocFee: "2,750",
      communityNocFee: "1,050", unitVerificationFee: "103.50" } },
  { id: "1hhruVEiqBbNhib4NNmtTX-gNvGwpCw6rsMJ76Iqhk1g", label: "5. Ready — mortgage to cash" },
  { id: "1qdoj3EIr_RdTCjoC1v12aijgX26LXJKowcPyjncIY3c", label: "6. Ready — mortgage to mortgage" },
  { id: "1LQ44RjVSj0QrY8sp2IdHpfLyJoXqFInK5CmZCS4v6nY", label: "C3 1. Cash — Garden Residence" },
  { id: "1erVDJoIJPa_2Wj5SFT5HcGZSOBhww2GwfAaa5HfktbI", label: "C3 2. Mortgage — Garden Residence" },
];

// Убраны из выбора, файлы на месте:
// 1BsYaITx4_FvELewiKx4yquzPwkAjDYpb1SoV4bToYIo — «1.2 Off-plan — no deposit cheques».
// Шаблон №1 выдаёт тот же договор, если выключить оба security cheque, а сам №1.2
// не размечен и ушёл бы в старый пайплайн.

// Переменная окружения может только сузить или переименовать список шаблонов.
// Движок, набор статей и признак ипотеки всегда берутся из реестра в коде по id:
// иначе старое значение MOU_TEMPLATES на Vercel молча возвращало бы размеченный
// шаблон в старый пайплайн — с 27 статьями в форме и маркерами {{#if}} в договоре.
function parseTemplates() {
  const json = process.env.MOU_TEMPLATES;
  if (json) {
    try {
      const list = JSON.parse(json);
      if (Array.isArray(list) && list.length) {
        return list.map((item) => {
          const known = DEFAULT_TEMPLATES.find((t) => t.id === item.id);
          return known ? { ...item, ...known, label: item.label || known.label } : item;
        });
      }
    } catch { /* fall through to default */ }
  }
  // legacy-переменная на один шаблон: движок берём из реестра, иначе размеченный
  // шаблон уехал бы в старый пайплайн и маркеры {{#if}} попали бы в договор
  const singleId = process.env.MOU_TEMPLATE_DOC_ID;
  if (singleId) {
    const known = DEFAULT_TEMPLATES.find((t) => t.id === singleId);
    return [known || { id: singleId, label: "Standard MOU" }];
  }
  return DEFAULT_TEMPLATES;
}

export const MOU_TEMPLATES = parseTemplates();

// Шаблон для генерации по id из формы. Когда шаблонов несколько, пустой или
// неизвестный id — ошибка, а не молчаливый первый шаблон: иначе черновик готового
// объекта, загруженный без выбора шаблона, превращался в договор off-plan №1,
// а Preview показывал расчёты №1.
export const TEMPLATE_REQUIRED_ERROR = "Не выбран шаблон договора: выберите его в разделе Template.";

export function resolveTemplate(templateId, templates = MOU_TEMPLATES) {
  const found = templates.find((t) => t.id === templateId);
  if (found) return found;
  return templates.length === 1 && !templateId ? templates[0] : null;
}

export const MOU_CONFIG = {
  spreadsheetId: process.env.MOU_SPREADSHEET_ID || "168OI2_TjSLZSUpxWIkaXcCoGfgpiWa_hVh2QrN-Fzb8",
  templateDocId: MOU_TEMPLATES[0].id,
  outputFolderId: process.env.MOU_OUTPUT_FOLDER_ID || "1-gkMgBa_BQAlRC11tDacdSPElZj9vXiH",
  projectsSheet: process.env.MOU_PROJECTS_SHEET || "PROJECTS",
  listsSheet: process.env.MOU_LISTS_SHEET || "LISTS",
  logSheet: process.env.MOU_LOG_SHEET || "DRAFTS_LOG",
  rulesSheet: process.env.MOU_RULES_SHEET || "RULES",
  agentsSheet: process.env.MOU_AGENTS_SHEET || "AGENTS",
};

export const DEFAULT_AGENT = "PRIME BRIDGE REAL ESTATE BROKERAGE L.L.C";
