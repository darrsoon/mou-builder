// Реестр шаблонов из папки «MOU» в «Автоматизации». Держим в коде, а не только
// в env: значение переменной на Vercel обратно не читается, и молчаливая ошибка
// в ней означала бы генерацию размеченного шаблона старым движком.
// engine: "v2" — шаблон с маркерами {{#if}} / {{#row}}, условия живут в документе.
// defaults — суммы сборов, которые форма подставляет при выборе шаблона; взяты из
// исходника шаблона и остаются редактируемыми (Алина, 06.09 и 13.09.2026).
// Off-plan (№1, №2): Title Deed ещё нет — в форме по умолчанию «N/A» (Даша, 04.10.2026).
// docTitle — имя готового файла: «<docTitle> <юнит>» (Даша, 03.10.2026).
// unitVerification — в таблице шаблона есть строка «Unit Verification / Search Certificate».
// №2–№6 с 06.10.2026 — пересобраны по чистовикам Даши (docx 03.10): разметка заново, статьи о
// дефолте из №1. Прежние шаблоны (до пересборки): №2 1VKkYr8F…, №3 1G8vUZTj…, №4 1fsVQKEK…,
// №5 1hhruVEi…, №6 1qdoj3EI… — в папке «MOU (Prime Bridge)», в выборе их больше нет.
const DEFAULT_TEMPLATES = [
  { id: "1qedPsMWpFLRFqjxPwuK53fXY_43AkkSC5bGc_rAXG0k", label: "1. Off-plan", docTitle: "Off-plan Memorandum of Understanding (MOU)", engine: "v2", articles: "offplan-v2",
    defaults: { titleDeedNumber: "N/A" } },
  { id: "1tx7RSibxrjdPz3DWjCxzA7Fy_L8CHgIK4JbsJa8Fo9o", label: "2. Off-plan — mortgage", docTitle: "Off-plan Mortgage Memorandum of Understanding (MOU)",
    engine: "v2", articles: "offplan-mortgage-v2", mortgage: true,
    defaults: { admElectronicFee: "1,392", admValuationFee: "925.75", titleDeedNumber: "N/A" } },
  { id: "1OvFwfDrZ57blOIblZCSuNa53B6xUgdfQvxsQQ-qGEbQ", label: "3. Ready — cash to cash", docTitle: "Cash to Cash Memorandum of Understanding (MOU)",
    engine: "v2", articles: "ready-cash-v2", ready: true,
    defaults: { admElectronicFee: "919", admValuationFee: "1,037", developerNocFee: "2,750", communityNocFee: "1,050" } },
  { id: "1OG7MFlEDx3a8RyqJbjtqBjfvhj2aMUQIplJcyaPm2Zs", label: "4. Ready — cash to mortgage", docTitle: "Cash to Mortgage Memorandum of Understanding (MOU)",
    engine: "v2", articles: "ready-mortgage-v2", ready: true, mortgage: true, unitVerification: true,
    defaults: { admElectronicFee: "1,392", admValuationFee: "1,037", developerNocFee: "2,750",
      communityNocFee: "1,050", unitVerificationFee: "103.50" } },
  { id: "1UTrKSLj69RrNQAgoavPCTUdU1CJ37sfK9IB9KcC6AyU", label: "5. Ready — mortgage to cash", docTitle: "Mortgage to Cash Memorandum of Understanding (MOU)",
    engine: "v2", articles: "ready-mortgage-cash-v2", ready: true, sellerMortgage: true,
    defaults: { admElectronicFee: "919", admValuationFee: "1,037", developerNocFee: "2,750", communityNocFee: "1,050",
      mortgageReleaseFee: "960" } },
  // №6: ипотека у обеих сторон — ст.10 как в №5, ст.11–12 как в №4; строки Unit Verification нет
  { id: "1vty7EFqiiYQs2sgh8gHvxDDPexn8T63ZO4GQ3K1u8C0", label: "6. Ready — mortgage to mortgage", docTitle: "Mortgage to Mortgage Memorandum of Understanding (MOU)",
    engine: "v2", articles: "ready-mortgage-mortgage-v2", ready: true, mortgage: true, sellerMortgage: true,
    defaults: { admElectronicFee: "1,392", admValuationFee: "1,037", developerNocFee: "2,750", communityNocFee: "1,050",
      mortgageReleaseFee: "960" } },
  { id: "1LQ44RjVSj0QrY8sp2IdHpfLyJoXqFInK5CmZCS4v6nY", label: "C3 1. Cash — Garden Residence", docTitle: "Cash Memorandum of Understanding (MOU)" },
  { id: "1erVDJoIJPa_2Wj5SFT5HcGZSOBhww2GwfAaa5HfktbI", label: "C3 2. Mortgage — Garden Residence", docTitle: "Mortgage Memorandum of Understanding (MOU)" },
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

// Commission Agreement — отдельные шаблоны, в выбор шаблона MOU не входят.
// Копии .docx Даши (03.10): «7. … (1 agency)» и «8. … (2 agencies)» в «MOU (Prime Bridge)»
export const COMMISSION_TEMPLATES = {
  oneAgency: "13KTXRtzB0lfbjYYza4yeUBZExFQrzpO-VCHGf_aqXCA",
  twoAgencies: "1YdVvN1OhhFBtnL-Yu5WfANRDDAAKWQQkYnoXp5yQCHI",
};

export const DEFAULT_AGENT = "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C";
