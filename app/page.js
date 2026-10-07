"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { getArticleDefsForTemplate } from "@/lib/mou/articles";
import { formatArea, partyHasEid, EID_PATTERN } from "@/lib/mou/helpers";
import Holidays from "date-holidays";
import { IMaskInput } from "react-imask";

const hd = new Holidays("AE", { languages: ["en"] });

const DEFAULT_AGENT = "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C";
const REQUIRED_FIELDS_BLOCKING = false;
const legacyArticleFields = {
  article_security_deposit_number: "includeArticle6",
  article_buyer_default_number: "includeArticle7",
  article_seller_default_number: "includeArticle8",
  article_deposit_release_number: "includeArticle9",
  article_automatic_extension_number: "includeArticle18",
};
const articleTips = {
  article_sale_offer_number: "Основное согласие: Seller продает, Buyer покупает объект.",
  article_effective_date_number: "Когда договор начинает действовать для сторон.",
  article_property_details_number: "Описание объекта: проект, юнит, площадь, спальни, парковка.",
  article_selling_price_number: "Фиксирует согласованную цену сделки.",
  article_payment_table_number: "Все платежи: seller, developer, fees, deposits, agency.",
  article_security_deposit_number: "Кто дает security cheque, сумма, банк и условия хранения.",
  article_buyer_default_number: "Что происходит, если Buyer не завершает сделку.",
  article_seller_default_number: "Что происходит, если Seller не завершает сделку.",
  article_deposit_release_number: "Когда и как можно вернуть или удержать security deposit.",
  article_termination_agreement_number: "Как стороны оформляют расторжение сделки.",
  article_buyer_own_funds_number: "Buyer подтверждает, что у него есть деньги на сделку.",
  article_seller_outstanding_charges_number: "Seller отвечает за долги и платежи до transfer date.",
  article_property_hold_number: "Seller держит объект за Buyer и не продает другим.",
  article_seller_documents_number: "Какие документы Seller должен предоставить для сделки.",
  article_spa_assignment_number: "Переуступка SPA и обязательств Buyer перед developer.",
  article_power_of_attorney_number: "Что делать, если сторона действует через POA.",
  article_reservation_period_number: "Крайний срок завершения transfer / assignment.",
  article_automatic_extension_number: "Когда срок может автоматически продлиться.",
  article_developer_approval_number: "Сделка зависит от approval / NOC / KYC developer.",
  article_force_majeure_number: "Что делать при событиях вне контроля сторон.",
  article_indemnity_number: "Кто покрывает убытки и претензии после сделки.",
  article_aml_number: "AML, KYC и compliance требования для сторон.",
  article_amicable_dispute_number: "Сначала стороны пытаются решить спор мирно.",
  article_court_jurisdiction_number: "Если спор не решен, куда обращаться в суд.",
  article_entire_agreement_number: "MOU заменяет предыдущие договоренности по сделке.",
  article_confidentiality_number: "Условия сделки нельзя раскрывать посторонним.",
  article_electronic_signature_number: "Электронная подпись имеет силу как обычная.",
  article_vacant_on_transfer_number: "Условия передачи объекта: vacant on Transfer Date или с действующим Tenancy Contract.",
};

const initialParty = () => ({
  salutation: "",
  name: "",
  nationality: "",
  passport: "",
  hasEid: false,
  eid: "",
  ownershipPercent: "100",
  hasPoa: false,
  poaName: "",
  poaNationality: "",
  poaPassport: "",
  poaEid: "",
});

const initialForm = {
  agreementDate: "",
  reservationDeadline: "",
  projectName: "",
  unitStatus: "",
  developerName: "",
  developerLegalName: "",
  escrowAccountName: "",
  admAdminFee: "",
  admFee: "",
  admElectronicFee: "",
  admValuationFee: "",
  developerNocFee: "",
  communityNocFee: "",
  unitVerificationFee: "",
  mortgageReleaseFee: "",
  sellerBankName: "",
  buyerFunds: "own_funds",
  projectNumber: "",
  propertyRented: "No",
  annualRent: "",
  tenancyEndDate: "",
  transferFeeLabel: "",
  titleDeedNumber: "",
  propertyLocation: "",
  bedrooms: "",
  areaM2: "",
  propertyType: "",
  unitNumber: "",
  additionalInformation: "",
  parkingSpaces: "",
  sellers: [initialParty()],
  buyers: [initialParty()],
  originalPrice: "",
  sellingPrice: "",
  paidAmountToDeveloper: "",
  manualAmountToSeller: "No",
  amountToSeller: "",
  amountToSellerPaymentMethod: "",
  amountToSellerChequeInFavourOf: "",
  transferThresholdPercent: "",
  thresholdTopUpAmount: "",
  remainingDeveloperBalance: "",
  transferFee: "",
  sellerAgentEnabled: "Yes",
  buyerAgentEnabled: "Yes",
  sellerAgentName: DEFAULT_AGENT,
  buyerAgentName: DEFAULT_AGENT,
  sellerAgentFeeEnabled: "Yes",
  buyerAgentFeeEnabled: "Yes",
  sellerAgentRepresentative: "",
  sellerAgentPosition: "",
  sellerAgentLicense: "",
  sellerAgentAddress: "",
  buyerAgentRepresentative: "",
  buyerAgentPosition: "",
  buyerAgentLicense: "",
  buyerAgentAddress: "",
  // Commission Agreement: плательщик Seller | Buyer | Company, 1–2 агентства-получателя
  caPayer: "Seller",
  caPayerCompany: emptyCaAgency(""),
  caAgencies: [emptyCaAgency(DEFAULT_AGENT)],
  caDate: "",
  caPaymentTerm: "on_transfer",
  caPaymentDays: "2",
  buyerChequeThirdParty: "No",
  sellerChequeThirdParty: "No",
  agencyFeeSeller: "",
  agencyFeeBuyer: "",
  buyerDepositEnabled: "Yes",
  buyerDepositCalcType: "% of Selling Price",
  buyerDepositPercent: "",
  buyerDepositFixedAmount: "",
  buyerDefaultPenaltyAmount: "",
  buyerChequeNumber: "",
  buyerChequeDate: "",
  buyerChequeBank: "",
  buyerChequeDrawnBy: "",
  buyerChequeInFavourOf: "",
  buyerChequeTiming: "Upon signing",
  buyerChequeDays: "",
  sellerDepositEnabled: "Yes",
  sellerDepositCalcType: "% of Selling Price",
  sellerDepositPercent: "",
  sellerDepositFixedAmount: "",
  sellerDefaultPenaltyAmount: "",
  sellerChequeNumber: "",
  sellerChequeDate: "",
  sellerChequeBank: "",
  sellerChequeDrawnBy: "",
  sellerChequeInFavourOf: "",
  sellerChequeTiming: "Upon signing",
  sellerChequeDays: "",
  includeArticle6: true,
  includeArticle7: true,
  includeArticle8: true,
  includeArticle9: true,
  includeArticle18: true,
  excludedArticleKeys: [],
  sellerSignatureDate: "",
  buyerSignatureDate: "",
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;

  const numeric = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (numeric) {
    const [, day, month, year] = numeric;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
  }

  return "";
}

function fromDateInputValue(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function todayFormValue() {
  const today = new Date();
  return `${pad2(today.getDate())}/${pad2(today.getMonth() + 1)}/${today.getFullYear()}`;
}

function addReservationDays(startValue, daysValue, dayType) {
  const startIso = toDateInputValue(startValue);
  const days = Number(daysValue);

  if (!startIso || !Number.isFinite(days) || days < 0) return "";

  const date = new Date(`${startIso}T00:00:00`);

  if (dayType === "business") {
    let added = 0;
    while (added < days) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      const isWeekend = day === 0 || day === 6;
      const isHoliday = hd.isHoliday(date);
      if (!isWeekend && !isHoliday) added += 1;
    }
  } else {
    date.setDate(date.getDate() + days);
  }

  return fromDateInputValue(`${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`);
}

function getHolidaysInRange(startValue, endValue) {
  const startIso = toDateInputValue(startValue);
  const endIso = toDateInputValue(endValue);
  
  if (!startIso || !endIso) return [];
  
  const startDate = new Date(`${startIso}T00:00:00`);
  const endDate = new Date(`${endIso}T00:00:00`);
  
  if (startDate > endDate) return [];
  
  const holidaysFound = [];
  const currentDate = new Date(startDate);
  
  let safeCount = 0;
  while (currentDate <= endDate && safeCount < 365) {
    const holidayArr = hd.isHoliday(currentDate);
    if (holidayArr && holidayArr.length > 0) {
      for (const h of holidayArr) {
        const dateStr = `${pad2(currentDate.getDate())}.${pad2(currentDate.getMonth() + 1)}.${currentDate.getFullYear()}`;
        if (!holidaysFound.some(ex => ex.name === h.name && ex.date === dateStr)) {
          holidaysFound.push({ name: h.name, date: dateStr });
        }
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
    safeCount++;
  }
  return holidaysFound;
}

const tips = {
  agreementDate: "Дата подписания MOU (договора). Можно писать в привычном формате, например 26.05.2026.",
  reservationDeadline: "Последний день, до которого стороны должны завершить transfer/assignment (передачу прав/переоформление). Можно выбрать конкретную дату или посчитать от Agreement Date по количеству дней.",
  reservationDeadlineMode: "Specific date (конкретная дата): выберите дату вручную. Calculate by days (посчитать по дням): укажите количество дней от Agreement Date.",
  reservationDays: "Количество дней от Agreement Date. Calendar days (календарные) считают все дни подряд. Business days (рабочие) пропускают субботу и воскресенье.",
  projectName: "Название проекта. Если выбрать из списка, developer (застройщик), fees (сборы) и другие данные подтянутся из PROJECTS.",
  unitStatus: "Ready (готовый объект) или Off-Plan (строящийся объект). От этого зависят ADM Admin Fee и Transfer/NOC Fee из таблицы PROJECTS.",
  developerName: "Короткое имя developer (застройщика), которое используется в тексте договора.",
  developerLegalName: "Полное юридическое имя developer (застройщика) для payment table (таблицы платежей) и transfer/NOC fee.",
  escrowAccountName: "Escrow account (эскроу-счет застройщика), куда Buyer (покупатель) платит суммы, связанные с developer. Если нет, оставьте пустым.",
  admAdminFee: "Административная часть ADM Fee (сбора Abu Dhabi Municipality). Обычно подставляется автоматически, но ее можно исправить вручную.",
  admFee: "ADM Fee для ипотечной сделки: 2% от Selling Price или по оценке ADM (что выше). По умолчанию считается 2%, после оценки можно вписать свою сумму.",
  admElectronicFee: "ADM Electronic Fee — электронный сбор ADREC. Сумма по умолчанию — из выбранного шаблона, можно поменять.",
  developerNocFee: "Сбор застройщика за NOC. Сумма по умолчанию — из выбранного шаблона, можно поменять.",
  communityNocFee: "Сбор сообщества за NOC, платит Seller. Сумма по умолчанию — из выбранного шаблона, можно поменять.",
  unitVerificationFee: "Unit Verification / Search Certificate — справка Abu Dhabi Municipality, платит Seller. Сумма по умолчанию — из шаблона, можно поменять.",
  mortgageReleaseFee: "Mortgage Release Fee — сбор ADREC за снятие ипотеки с объекта, платит Seller. Сумма по умолчанию — из шаблона, можно поменять.",
  sellerBankName: "Банк, в котором ипотека Продавца (Seller’s Bank). Выберите из списка или впишите свой.",
  buyerFunds: "Чем платит Buyer. Own funds — только своими деньгами, покупка не зависит от кредита. Второй вариант — свои деньги, Personal Loan или Equity Release (кредит под залог другой недвижимости); отказ банка не освобождает Buyer от сделки.",
  projectNumber: "Номер проекта из документов на готовый объект, например 2023/278930. Вводится вручную.",
  propertyRented: "Объект сдан в аренду? От этого зависит статья о состоянии объекта: свободен на Transfer Date или продаётся с арендатором.",
  annualRent: "Годовая аренда по действующему договору. Сумма прописью в договоре пишется сама.",
  tenancyEndDate: "До какой даты действует договор аренды.",
  admValuationFee: "ADM Valuation Certificate — сертификат оценки ADREC. Сумма по умолчанию — из выбранного шаблона, можно поменять.",
  transferFeeLabel: "Название строки: Transfer Fee или NOC Fee.",
  titleDeedNumber: "Номер title deed (документа о праве собственности). Если для Off-Plan его нет, оставьте пустым.",
  propertyLocation: "Можно указать только остров/район, например Yas Island. Abu Dhabi, UAE добавится автоматически.",
  bedrooms: "Как должно быть в договоре: Studio, 1 Bedroom, 2 Bedrooms и т.д.",
  areaM2: "Площадь в квадратных метрах, всегда с точкой и двумя знаками: 67.20. Можно ввести 67,2 или 67 — формат поправится сам.",
  propertyType: "Apartment, Villa, Townhouse и т.д.",
  unitNumber: "Unit number (номер объекта) из SPA или developer documents (документов застройщика).",
  additionalInformation: "Любая дополнительная информация по unit, если ее надо видеть в property details.",
  parkingSpaces: "Количество парковочных мест или текст из документа.",
  originalPrice: "Есть в MOU. Original Price (цена по SPA с застройщиком). Нужна для расчета developer balance (остатка застройщику).",
  sellingPrice: "Есть в MOU. Selling Price (цена сделки между Seller и Buyer). От нее считаются ADM Fee, agency fee и deposits.",
  paidAmountToDeveloper: "В MOU не печатается. Paid to Developer (уже оплачено застройщику) — сумма, которую Seller уже оплатил developer. Нужна только для расчета: сколько Buyer платит developer и сколько Seller.",
  manualAmountToSeller: "No (нет): приложение само считает Amount to Seller. Yes (да): приложение берет сумму, которую вы вручную ввели в поле ниже.",
  amountToSeller: "Есть в MOU. Amount to Seller (сумма Seller) — сколько Buyer реально платит Seller на transfer date. Автоматически: Selling Price минус все, что Buyer должен заплатить developer.",
  amountToSellerPaymentMethod: "Как Buyer оплатит сумму Seller на Transfer Date: Manager's Cheque, Cash или Manager's Cheque in favour of указанного имени.",
  amountToSellerChequeInFavourOf: "Имя/фамилия или компания, в пользу кого будет выписан Manager's Cheque для Seller.",
  transferThresholdPercent: "Есть в MOU. Transfer Threshold % (порог для передачи) — процент Original Price, который должен быть оплачен developer, чтобы получить transfer/assignment. Например 20, 30 или 40.",
  thresholdTopUpAmount: "Есть в MOU. Threshold Top-up (доплата до порога) — доплата developer, чтобы на transfer date было оплачено достаточно для передачи. Пример: Original Price 1,000,000, threshold 30%, уже оплачено 200,000. Нужно довести до 300,000, значит top-up = 100,000.",
  remainingDeveloperBalance: "Есть в MOU. Remaining Developer Balance (остаток рассрочки застройщику) — что Buyer будет платить developer уже после transfer по payment plan. Пример: Original Price 1,000,000, Seller уже оплатил 200,000, top-up 100,000. Остаток developer = 700,000.",
  transferFee: "Сумма Transfer/NOC Fee (сбор за передачу/NOC). Обычно подтягивается из PROJECTS, но можно изменить.",
  sellerAgentName: "Agency name (название агентства) со стороны Seller. По умолчанию PRIME BRIDGE.",
  buyerAgentName: "Agency name (название агентства) со стороны Buyer. По умолчанию PRIME BRIDGE.",
  agencyFeeSeller: "Agency Fee Seller (комиссия агентству со стороны Seller). Если пусто, софт считает auto 2.1% от Selling Price. Если в сделке другая сумма, введите ее вручную. Если комиссии Seller нет, введите 0.",
  agencyFeeBuyer: "Agency Fee Buyer (комиссия агентству со стороны Buyer). Если пусто, софт считает auto 2.1% от Selling Price. Если в сделке другая сумма, введите ее вручную. Для примера The Row нужно вручную 54,000, потому что это 1% от 5,400,000.",
  depositEnabled: "Yes (да): deposit и cheque details попадут в MOU. No (нет): строки по депозиту будут пустыми/исключенными.",
  depositCalcType: "% of Selling Price (процент от цены сделки) считает депозит от цены сделки. Fixed Amount (фиксированная сумма) берет введенную сумму.",
  depositPercent: "Процент deposit (депозита) от Selling Price, например 10.",
  depositFixedAmount: "Фиксированная сумма депозита, если выбран Fixed Amount.",
  chequeNumber: "Номер security deposit cheque (чека депозита).",
  chequeDate: "Дата cheque (чека).",
  chequeBank: "Банк, который выпустил cheque (чек).",
  chequeDrawnBy: "Drawn by (кем выписан чек).",
  chequeInFavourOf: "In favour of (в пользу кого выписан чек).",
  articles: "Если снять галочку, статья будет удалена из договора, а номера остальных статей пересчитаются.",
  partyName: "Полное имя стороны так, как должно быть в MOU.",
  nationality: "Nationality (гражданство) на английском, как в passport.",
  passport: "Passport number (номер паспорта). Если пусто, не попадет в party block.",
  eid: "Emirates ID (ID в ОАЭ) полностью: 784-XXXX-XXXXXXX-X. Обязателен, если отмечено «Has Emirates ID»; у представителя по POA — всегда.",
  hasEid: "Есть ли у стороны Emirates ID. Отмечено — номер обязателен и попадёт в договор; нет — EID в договоре не будет.",
  ownershipPercent: "Ownership % (доля владения). Для Seller и Buyer отдельно сумма должна быть 100%.",
  poa: "Yes (да), если вместо стороны подписывает представитель по POA / Power of Attorney (доверенности).",
  salutation: "Обращение перед именем в тексте договора (например Mr., Mrs., Ms.).",
};

function hasValue(value) {
  return String(value ?? "").trim() !== "";
}

// missing — подписи незаполненных полей: показываются по наведению на плашку и в списке
// «MOU was not created», когда кнопка создания нажата с пропусками
function makeSectionStatus(missing, optional = false) {
  if (optional) return { state: "optional", label: "Optional", missingCount: 0, missing: [] };
  if (!missing.length) return { state: "complete", label: "Complete", missingCount: 0, missing: [] };
  return { state: "missing", label: `Needs info (${missing.length})`, missingCount: missing.length, missing };
}

function missingFields(source, fields) {
  return fields.filter(([key]) => !hasValue(source[key])).map(([, label]) => label);
}

// Незаполненные поля стороны: ключ поля → подпись. Все поля стороны обязательны (Даша, 07.10.2026);
// EID — только с галочкой «Has Emirates ID», номер целиком; поля доверенности — только при POA.
function partyMissingFields(party) {
  const missing = {};
  if (!hasValue(party.salutation)) missing.salutation = "Title";
  if (!hasValue(party.name)) missing.name = "Name";
  if (!hasValue(party.nationality)) missing.nationality = "Nationality";
  if (!hasValue(party.passport)) missing.passport = "Passport";
  if (partyHasEid(party) && !EID_PATTERN.test(String(party.eid || ""))) missing.eid = "EID";
  if (!hasValue(party.ownershipPercent)) missing.ownershipPercent = "Ownership %";
  if (party.hasPoa) {
    if (!hasValue(party.poaName)) missing.poaName = "POA Name";
    if (!hasValue(party.poaNationality)) missing.poaNationality = "POA Nationality";
    if (!hasValue(party.poaPassport)) missing.poaPassport = "POA Passport";
    if (!EID_PATTERN.test(String(party.poaEid || ""))) missing.poaEid = "POA EID";
  }
  return missing;
}

function partySectionStatus(parties, who = "Party") {
  const missing = [];
  const list = Array.isArray(parties) ? parties : [];

  if (!list.length) missing.push("At least one party");

  list.forEach((party, index) => {
    for (const label of Object.values(partyMissingFields(party))) missing.push(`${who} ${index + 1}: ${label}`);
  });

  const total = list.reduce((sum, party) => sum + (Number(String(party.ownershipPercent || "").replace(",", ".")) || 0), 0);
  if (Math.round(total * 100) / 100 !== 100) missing.push("Ownership total 100%");

  return makeSectionStatus(missing);
}

// Порядок в выпадающих списках (Даша, 05.10.2026): частые — первыми, остальные по алфавиту
const PRIORITY_NATIONALITIES = ["Russian Federation", "Russia", "United Arab Emirates", "Kazakhstan"];
function orderedOptions(options, priority = []) {
  const uniq = (options || []).filter((v, i, arr) => v && arr.indexOf(v) === i);
  const key = (v) => String(v).toLowerCase();
  const first = priority.flatMap((p) => uniq.filter((v) => key(v) === key(p) || key(v).startsWith(key(p))));
  const firstSet = new Set(first);
  return [...first.filter((v, i, arr) => arr.indexOf(v) === i), ...uniq.filter((v) => !firstSet.has(v)).sort((a, b) => a.localeCompare(b))];
}
const agencyOptions = (agents, extra) => orderedOptions((agents || []).map((a) => a.name).concat(extra || []), ["PRIME BRIDGE"]);

function emptyCaAgency(name = "") {
  return { name, position: "", representative: "", license: "", address: "", fee: "" };
}

// реквизиты агентства из AGENTS; overwrite — при смене названия, иначе только пустые поля
function agencyFromDirectory(agency, agents, overwrite) {
  const record = findAgent(agents, agency.name);
  if (!record) return agency;
  const next = { ...agency };
  for (const field of ["representative", "position", "license", "address"]) {
    if ((overwrite || !String(next[field] || "").trim()) && record[field] !== undefined) next[field] = record[field];
  }
  return next;
}

// представители агентства из AGENTS (строк у агентства может быть несколько)
function agentRepresentatives(agents, name) {
  const key = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return (agents || []).filter((a) => key(a.name) === key(name) && a.representative).map((a) => a.representative)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

function findAgent(agents, name) {
  const key = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return (agents || []).find((a) => key(a.name) === key(name));
}

// Пустые реквизиты агентств — из справочника AGENTS; заполненные руками не трогаем
function fillAgentDetails(form, agents) {
  const next = { ...form };
  for (const side of ["seller", "buyer"]) {
    const record = findAgent(agents, form[`${side}AgentName`]);
    if (!record) continue;
    for (const [field, value] of [["Representative", record.representative], ["Position", record.position],
      ["License", record.license], ["Address", record.address]]) {
      if (!String(next[`${side}Agent${field}`] || "").trim() && value) next[`${side}Agent${field}`] = value;
    }
  }
  if (Array.isArray(next.caAgencies)) next.caAgencies = next.caAgencies.map((a) => agencyFromDirectory(a, agents, false));
  return next;
}

// чека пока нет: Later — без срока, Delayed — через N дней; реквизиты не нужны
function chequeLater(form, side) {
  const v = String(form[`${side}ChequeTiming`] || "").toLowerCase();
  return v.includes("delayed") || v.includes("later");
}

function depositSectionStatus(form, side) {
  const enabled = form[`${side}DepositEnabled`] === "Yes";
  if (!enabled) return makeSectionStatus([]);

  const calcType = String(form[`${side}DepositCalcType`] || "");
  const missing = [];

  if (!hasValue(calcType)) missing.push("Calculation Type");
  if (calcType.includes("Fixed")) {
    if (!hasValue(form[`${side}DepositFixedAmount`])) missing.push("Fixed Amount");
  } else if (!hasValue(form[`${side}DepositPercent`])) {
    missing.push("Deposit %");
  }

  if (!chequeLater(form, side)) [
    [`${side}ChequeNumber`, "Cheque No."],
    [`${side}ChequeDate`, "Cheque Date"],
    [`${side}ChequeBank`, "Cheque Bank"],
    [`${side}ChequeDrawnBy`, "Drawn by"],
    [`${side}ChequeInFavourOf`, "In favour of"],
  ].forEach(([key, label]) => {
    if (!hasValue(form[key])) missing.push(label);
  });

  return makeSectionStatus(missing);
}

function buildSectionStatuses(form, reservationMode, reservationDays, isMortgage = false, isReadyTemplate = false, hasUnitVerification = false, hasSellerMortgage = false, titleDeedDefault = "") {
  const isReady = String(form.unitStatus || "").toLowerCase() === "ready";
  const agreementMissing = missingFields(form, [
    ["agreementDate", "Agreement Date"],
    ["reservationDeadline", "Reservation Deadline"],
  ]);
  if (reservationMode === "days" && !hasValue(reservationDays)) agreementMissing.push("Reservation Period Days");

  const paymentsRequired = [
    ["sellingPrice", "Selling Price"],
  ];
  if (!isReady) {
    paymentsRequired.push(
      ["originalPrice", "Original Price"],
      ["paidAmountToDeveloper", "Paid to Developer"],
      ["transferThresholdPercent", "Transfer Threshold %"],
    );
  }
  paymentsRequired.push(["transferFee", "Transfer / NOC Fee"]);
  if (form.manualAmountToSeller === "Yes") paymentsRequired.push(["amountToSeller", "Amount to Seller"]);
  // в ипотечном шаблоне способ оплаты Продавцу зашит в текст («Manager's Cheque»),
  // поле ни на что не влияет — не показываем и не требуем; в готовых объектах
  // способ тоже один, поле показываем заблокированным и не требуем
  if (!isMortgage && !isReadyTemplate) paymentsRequired.push(["amountToSellerPaymentMethod", "Amount to Seller Payment Method"]);
  // ипотека Продавца: без банка в статье о Liability Letter остаётся дырка
  if (hasSellerMortgage) paymentsRequired.push(["sellerBankName", "Seller's Bank"]);
  if (!isMortgage && !isReadyTemplate && form.amountToSellerPaymentMethod === "manager_cheque_in_favour") {
    paymentsRequired.push(["amountToSellerChequeInFavourOf", "Cheque in favour of"]);
  }

  const projectRequired = [
    ["projectName", "Project"],
    ["unitStatus", "Unit Status"],
    ["developerName", "Developer Name"],
    ["developerLegalName", "Developer Legal Name"],
  ];
  if (!isReady) projectRequired.push(["escrowAccountName", "Escrow Account Name"]);
  // ипотечный off-plan: вместо админ-части — три отдельные суммы ADM
  if (isMortgage && !isReadyTemplate) {
    // admFee не требуем: он считается сам (2% от Selling Price), вручную его
    // вписывают только после оценки ADM
    projectRequired.push(
      ["admElectronicFee", "ADM Electronic Fee"],
      ["admValuationFee", "ADM Valuation Certificate"],
    );
  } else if (isReadyTemplate) {
    // суммы фиксированные и подставляются сами, но должны быть заполнены
    projectRequired.push(
      ["admElectronicFee", "ADM Electronic Fee"],
      ["admValuationFee", "ADM Valuation Certificate"],
      ["developerNocFee", "Developer NOC Fee"],
      ["communityNocFee", "Community NOC Fee"],
    );
    if (hasUnitVerification) projectRequired.push(["unitVerificationFee", "Unit Verification / Search Certificate"]);
    if (hasSellerMortgage) projectRequired.push(["mortgageReleaseFee", "Mortgage Release Fee"]);
  } else {
    projectRequired.push(["admAdminFee", "ADM Admin Fee"]);
  }
  if (!isReadyTemplate) projectRequired.push(["transferFeeLabel", "Transfer Fee Label"]);

  // всё, что печатается в таблице Property Details (Даша, 06.10.2026: «все обязательные поля»);
  // Additional Information может быть пустой
  // Title Deed пустой — сайт сам пишет «N/A» (во всех шаблонах), поэтому не считаем его
  const propertyRequired = [
    ["propertyLocation", "Property Location"],
    ["bedrooms", "Bedrooms"],
    ["areaM2", "Area"],
    ["propertyType", "Property Type"],
    ["unitNumber", "Unit Number"],
    ["parkingSpaces", isReadyTemplate ? "Parking Space No." : "Parking Spaces"],
  ];
  if (isReadyTemplate) propertyRequired.push(["projectNumber", "Project No."]);
  // объект сдан в аренду: без суммы и срока в статье остаются дырки
  if (isReadyTemplate && form.propertyRented === "Yes") {
    propertyRequired.push(["annualRent", "Annual Rent"], ["tenancyEndDate", "Tenancy Contract Until"]);
  }

  return {
    agreement: makeSectionStatus(agreementMissing),
    project: makeSectionStatus(missingFields(form, projectRequired)),
    property: makeSectionStatus(missingFields(form, propertyRequired)),
    sellers: partySectionStatus(form.sellers, "Seller"),
    buyers: partySectionStatus(form.buyers, "Buyer"),
    payments: makeSectionStatus(missingFields(form, paymentsRequired)),
    // реквизиты агентства печатаются в договоре; должность пустая — Manager
    agency: makeSectionStatus(["seller", "buyer"].flatMap((side) => {
      if (form[`${side}AgentEnabled`] === "No") return [];
      const who = side === "seller" ? "Seller" : "Buyer";
      return missingFields(form, [
        [`${side}AgentName`, `${who} Agent`],
        [`${side}AgentRepresentative`, `${who} Agent Representative`],
        [`${side}AgentLicense`, `${who} Agent License`],
        [`${side}AgentAddress`, `${who} Agent Address`],
      ]);
    })),
    buyerDeposit: depositSectionStatus(form, "buyer"),
    sellerDeposit: depositSectionStatus(form, "seller"),
    articles: makeSectionStatus([]),
  };
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [form, setForm] = useState(initialForm);
  const [init, setInit] = useState({ projects: [], lists: {}, drafts: [], rules: [], agents: [] });
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [message, setMessage] = useState("");
  const [actionErrors, setActionErrors] = useState([]);
  const [result, setResult] = useState(null);
  const [draftRow, setDraftRow] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [reservationMode, setReservationMode] = useState("date");
  const [reservationDays, setReservationDays] = useState("");
  const [reservationDayType, setReservationDayType] = useState("calendar");

  useEffect(() => {
    if (status === "authenticated") loadInit();
  }, [status]);

  // Строка разделов закреплена под верхней панелью (Даша, 07.10.2026). Высоты обеих панелей
  // меняются (перенос чипов, ширина окна) — отдаём их в CSS: отступ строки разделов, Preview
  // и прокрутки к разделу считаются от них.
  useStickyHeights(status === "authenticated");

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!init.config) return;
    const handle = setTimeout(() => updatePreview(), 350);
    return () => clearTimeout(handle);
  }, [form, status, templateId, init.config]);

  useEffect(() => {
    if (reservationMode !== "days") return;
    const agreementDate = form.agreementDate || todayFormValue();
    const reservationDeadline = reservationDays
      ? addReservationDays(agreementDate, reservationDays, reservationDayType)
      : "";

    if (form.agreementDate !== agreementDate || form.reservationDeadline !== reservationDeadline) {
      setForm((current) => ({
        ...current,
        agreementDate,
        reservationDeadline,
      }));
    }
  }, [reservationMode, reservationDays, reservationDayType, form.agreementDate, form.reservationDeadline]);

  useEffect(() => {
    const bothDepositsDisabled = form.buyerDepositEnabled === "No" && form.sellerDepositEnabled === "No";
    if (!bothDepositsDisabled || !form.includeArticle6) return;
    setForm((current) => ({ ...current, includeArticle6: false }));
  }, [form.buyerDepositEnabled, form.sellerDepositEnabled, form.includeArticle6]);

  useEffect(() => {
    if (String(form.unitStatus || "").toLowerCase() !== "ready") return;
    if (String(form.transferFeeLabel || "").toLowerCase().includes("noc")) return;
    setForm((current) => ({ ...current, transferFeeLabel: "NOC Fee" }));
  }, [form.unitStatus, form.transferFeeLabel]);

  const lists = init.lists || {};
  const projectNames = useMemo(() => init.projects.map((p) => p.project_name).filter(Boolean), [init.projects]);
  const selectedTemplate = (init.config?.templates || []).find((t) => t.id === templateId);
  const isMortgage = !!selectedTemplate?.mortgage;
  // готовый объект: свои сборы, номер проекта и статья про аренду
  const isReadyTemplate = !!selectedTemplate?.ready;
  // строка «Unit Verification / Search Certificate» есть не во всех готовых шаблонах
  const hasUnitVerification = !!selectedTemplate?.unitVerification;
  // квартира в ипотеке у Продавца (№5): сбор за снятие ипотеки, банк и деньги Покупателя
  const hasSellerMortgage = !!selectedTemplate?.sellerMortgage;
  const sectionStatuses = useMemo(
    () => buildSectionStatuses(form, reservationMode, reservationDays, isMortgage, isReadyTemplate, hasUnitVerification, hasSellerMortgage, selectedTemplate?.defaults?.titleDeedNumber || ""),
    [form, reservationMode, reservationDays, isMortgage, isReadyTemplate, hasUnitVerification, hasSellerMortgage, selectedTemplate],
  );

  // Суммы сборов по умолчанию — свои у каждого шаблона, взяты из его исходника
  // (реестр lib/mou/config.js, поле defaults). Подставляются при выборе шаблона
  // и остаются редактируемыми. Раньше суммы зависели от типа шаблона — «ипотека»
  // или «готовый объект», — и шаблон, который одновременно и то и другое (№4),
  // получал бы чужой набор. При смене шаблона меняются только значения, которые
  // не трогали руками: пустые или равные умолчаниям предыдущего шаблона.
  const appliedDefaults = useRef({});
  useEffect(() => {
    if (!selectedTemplate) return;
    const next = selectedTemplate.defaults || {};
    const prev = appliedDefaults.current;
    appliedDefaults.current = next;
    setForm((current) => {
      const changes = {};
      for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
        if (current[key] === "" || current[key] === prev[key]) changes[key] = next[key] ?? "";
      }
      return Object.keys(changes).length ? { ...current, ...changes } : current;
    });
  }, [selectedTemplate]);
  const hasTemplateChoice = (init.config?.templates || []).length > 1;
  const navItems = useMemo(() => {
    const items = [];
    if (hasTemplateChoice) {
      items.push({ title: "Template", state: templateId ? "complete" : "missing", missingCount: templateId ? 0 : 1,
        missing: templateId ? [] : ["Template"] });
    }
    const order = [
      ["Agreement", sectionStatuses.agreement],
      ["Project / Developer", sectionStatuses.project],
      ["Property", sectionStatuses.property],
      ["Seller", sectionStatuses.sellers],
      ["Buyer", sectionStatuses.buyers],
      ["Payments", sectionStatuses.payments],
      ["Agency", sectionStatuses.agency],
      // сначала Продавец, потом Покупатель (Даша, 07.10.2026)
      ["Security Deposit - Seller", sectionStatuses.sellerDeposit],
      ["Security Deposit - Buyer", sectionStatuses.buyerDeposit],
      ["Articles", sectionStatuses.articles],
    ];
    for (const [title, status] of order) {
      items.push({ title, state: status?.state || "optional", missingCount: status?.missingCount || 0, missing: status?.missing || [] });
    }
    return items;
  }, [sectionStatuses, templateId, hasTemplateChoice]);
  const missingTotal = navItems.reduce((sum, item) => sum + item.missingCount, 0);

  const isCashToCash = String(form.unitStatus || "").toLowerCase() === "ready";
  // Список статей берём у выбранного шаблона: у v2 своя нумерация (17 статей),
  // условия живут в самом шаблоне, поэтому старый список сюда не подходит.
  const currentArticleDefs = getArticleDefsForTemplate(selectedTemplate, form.unitStatus);
  const holidaysInRange = useMemo(
    () => getHolidaysInRange(form.agreementDate, form.reservationDeadline),
    [form.agreementDate, form.reservationDeadline]
  );

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      const err = new Error(data.error || data.validation?.errors?.join("\n") || "Request failed");
      err.payload = data;
      throw err;
    }
    return data;
  }

  async function loadInit() {
    setLoadingInit(true);
    setMessage("Loading data from Google Sheets...");
    try {
      const data = await api("/api/init");
      setInit(data);
      // агентство по умолчанию выбрано до загрузки справочника — дозаполняем его реквизиты
      setForm((current) => fillAgentDetails(current, data.agents));
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingInit(false);
    }
  }

  async function updatePreview() {
    // Без шаблона не считаем: сервер всё равно ответит 400, а цифры чужого шаблона вводят в заблуждение.
    if (hasTemplateChoice && !templateId) {
      setPreview({ error: "Выберите шаблон договора в разделе Template." });
      return;
    }
    try {
      const data = await api("/api/preview", { method: "POST", body: JSON.stringify({ ...form, templateId }) });
      setPreview(data.preview);
    } catch (error) {
      // Без расчётов: сводка и авто-суммы пустые, чтобы не показывать цифры чужого шаблона.
      setPreview({ error: error.message });
    }
  }

  // Проверки перед созданием MOU: доли сторон и выбранный шаблон
  function mouPrecheck() {
    const totalSellers = form.sellers.reduce((sum, p) => sum + (Number(String(p.ownershipPercent || "").replace(",", ".")) || 0), 0);
    const totalBuyers = form.buyers.reduce((sum, p) => sum + (Number(String(p.ownershipPercent || "").replace(",", ".")) || 0), 0);
    
    if (Math.round(totalSellers * 100) / 100 !== 100) {
      setActionErrors(["Сумма долей продавцов (Seller) должна быть ровно 100%."]);
      return false;
    }
    if (Math.round(totalBuyers * 100) / 100 !== 100) {
      setActionErrors(["Сумма долей покупателей (Buyer) должна быть ровно 100%."]);
      return false;
    }

    if (hasTemplateChoice && !templateId) {
      setActionErrors(["Выберите шаблон договора в разделе Template."]);
      return false;
    }
    // Строгий режим (Даша, 07.10.2026): договор не создаётся, пока в разделах есть пропуски.
    // Показываем, чего не хватает, и прокручиваем к первому разделу с пропуском.
    if (missingTotal > 0) {
      const withGaps = navItems.filter((item) => item.missingCount > 0);
      setActionErrors(withGaps.flatMap((item) => (item.missing.length ? item.missing : [item.title])
        .map((field) => (field.startsWith(item.title) ? field : `${item.title}: ${field}`))));
      setMessage(`Заполните обязательные поля: ${missingTotal}`);
      document.getElementById(sectionAnchor(withGaps[0].title))?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }
    return true;
  }

  // MOU и Commission Agreement одной кнопкой: сначала MOU, затем соглашение по тем же данным
  async function createBoth() {
    if (!mouPrecheck()) return;
    setBusy(true);
    setResult(null);
    setActionErrors([]);
    const created = [];
    try {
      setMessage("Creating MOU...");
      created.push(await api("/api/mou", { method: "POST", body: JSON.stringify({ ...form, templateId }) }));
      setMessage("Creating Commission Agreement...");
      const ca = await api("/api/commission", { method: "POST", body: JSON.stringify({ ...form, caDate: form.caDate || todayFormValue() }) });
      created.push({ ...ca, kind: "Commission Agreement" });
      setResult(created);
      setMessage("MOU and Commission Agreement created");
      await loadInit();
    } catch (error) {
      if (created.length) setResult(created);
      setActionErrors(error.payload?.validation?.errors || [error.message]);
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createMou() {
    if (!mouPrecheck()) return;
    setBusy(true);
    setResult(null);
    setActionErrors([]);
    setMessage("Creating MOU...");
    try {
      const data = await api("/api/mou", { method: "POST", body: JSON.stringify({ ...form, templateId }) });
      setResult(data);
      setMessage("MOU created");
      await loadInit();
    } catch (error) {
      const validation = error.payload?.validation;
      if (validation) {
        setPreview((current) => ({ ...(current || {}), validation }));
        setActionErrors(validation.errors || [error.message]);
      } else {
        setActionErrors([error.message]);
      }
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function patchCa(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function patchCaAgency(index, field, value) {
    setForm((current) => {
      const list = [...(current.caAgencies || [])];
      let agency = { ...list[index], [field]: value };
      if (field === "name") agency = agencyFromDirectory(agency, init.agents, true);
      list[index] = agency;
      return { ...current, caAgencies: list };
    });
  }

  function patchCaPayerCompany(field, value) {
    setForm((current) => {
      let company = { ...(current.caPayerCompany || emptyCaAgency("")), [field]: value };
      if (field === "name") company = agencyFromDirectory(company, init.agents, true);
      return { ...current, caPayerCompany: company };
    });
  }

  async function createCommission() {
    setBusy(true);
    setResult(null);
    setActionErrors([]);
    setMessage("Creating Commission Agreement...");
    try {
      // дата соглашения — дата создания, если её не выбрали вручную
      const data = await api("/api/commission", { method: "POST", body: JSON.stringify({ ...form, caDate: form.caDate || todayFormValue() }) });
      setResult({ ...data, kind: "Commission Agreement" });
      setMessage("Commission Agreement created");
      await loadInit();
    } catch (error) {
      setActionErrors(error.payload?.validation?.errors || [error.message]);
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadDraft() {
    if (!draftRow) return;
    setBusy(true);
    setMessage("Loading draft...");
    try {
      const data = await api(`/api/drafts/${draftRow}`);
      // суммы из черновика не должны перетираться умолчаниями шаблона при его выборе
      appliedDefaults.current = {};
      setForm({ ...initialForm, ...data.form });
      // шаблон хранится в черновике вместе с полями; без него «Create MOU» ушёл бы
      // в первый шаблон реестра, то есть в off-plan №1
      const draftTemplate = (init.config?.templates || []).find((t) => t.id === data.form?.templateId);
      setTemplateId(draftTemplate ? draftTemplate.id : "");
      setResult(null);
      setMessage("Draft loaded");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function patch(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  // Выбор агентства: подставляем реквизиты из справочника AGENTS (вкладка в Sheets)
  function patchAgentName(sideKey, value) {
    const record = findAgent(init.agents, value);
    setForm((current) => ({
      ...current,
      [`${sideKey}AgentName`]: value,
      ...(record
        ? {
            [`${sideKey}AgentRepresentative`]: record.representative,
            [`${sideKey}AgentPosition`]: record.position,
            [`${sideKey}AgentLicense`]: record.license,
            [`${sideKey}AgentAddress`]: record.address,
          }
        : {}),
    }));
  }

  function patchAgentRepresentative(sideKey, value) {
    const key = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const record = (init.agents || []).find((a) => key(a.name) === key(form[`${sideKey}AgentName`]) && key(a.representative) === key(value));
    setForm((current) => ({
      ...current,
      [`${sideKey}AgentRepresentative`]: value,
      ...(record?.position ? { [`${sideKey}AgentPosition`]: record.position } : {}),
    }));
  }

  function toggleArticle(key, included) {
    setForm((current) => {
      const excluded = new Set(current.excludedArticleKeys || []);
      if (included) {
        excluded.delete(key);
      } else {
        excluded.add(key);
      }

      const next = {
        ...current,
        excludedArticleKeys: Array.from(excluded),
      };
      const legacyField = legacyArticleFields[key];
      if (legacyField) next[legacyField] = included;
      return next;
    });
  }

  function setAgreementDate(value) {
    setForm((current) => {
      const next = { ...current, agreementDate: value };
      if (reservationMode === "days") {
        next.reservationDeadline = addReservationDays(value, reservationDays, reservationDayType);
      }
      return next;
    });
  }

  function updateReservationByDays(daysValue = reservationDays, dayTypeValue = reservationDayType) {
    setForm((current) => ({
      ...current,
      agreementDate: current.agreementDate || todayFormValue(),
      reservationDeadline: daysValue
        ? addReservationDays(current.agreementDate || todayFormValue(), daysValue, dayTypeValue)
        : "",
    }));
  }

  function changeReservationMode(value) {
    setReservationMode(value);
    if (value === "days") updateReservationByDays(reservationDays, reservationDayType);
  }

  function changeReservationDays(value) {
    setReservationDays(value);
    updateReservationByDays(value, reservationDayType);
  }

  function changeReservationDayType(value) {
    setReservationDayType(value);
    updateReservationByDays(reservationDays, value);
  }

  function applyProjectData(value = form.projectName, statusValue = form.unitStatus, options = {}) {
    const found = init.projects.find((p) => String(p.project_name || "").toLowerCase() === String(value || "").toLowerCase());
    if (!found) return;
    setForm((current) => ({
      ...current,
      projectName: value,
      propertyLocation: options.syncLocation ? found.location || current.propertyLocation : current.propertyLocation,
      developerName: found.developer_name || "",
      developerLegalName: found.developer_legal_name || "",
      escrowAccountName: found.escrow_account_name || "",
      transferFeeLabel: found.transfer_fee_label || "",
      admAdminFee:
        statusValue === "Ready"
          ? found.adm_admin_fee_ready || current.admAdminFee
          : statusValue === "Off-Plan"
            ? found.adm_admin_fee_off_plan || current.admAdminFee
            : current.admAdminFee,
      transferFee:
        statusValue === "Ready"
          ? found.transfer_fee_ready || current.transferFee
          : statusValue === "Off-Plan"
            ? found.transfer_fee_off_plan || current.transferFee
            : current.transferFee,
    }));
  }

  if (status === "loading") return <FullScreenLoader text="Checking Google session..." />;

  if (status !== "authenticated") {
    return (
      <main className="login">
        <section className="loginPanel">
          <FileText size={40} />
          <h1>MOU Builder</h1>
          <p>Войдите через рабочий Google-аккаунт, чтобы читать таблицу, создавать Google Docs и сохранять draft log.</p>
          <button className="primary" onClick={() => signIn("google")}>Sign in with Google</button>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <header className="topbar">
        <div>
          <h1>MOU Builder</h1>
        </div>
        <div className="topActions">
          <CustomSelect
            id="draftRow"
            value={draftRow}
            options={[
              { value: "", label: "Existing Draft" },
              ...(init.drafts || []).map((draft) => ({ value: draft.rowNumber, label: draft.label })),
            ]}
            onChange={setDraftRow}
          />
          <button className="secondary" onClick={loadDraft} disabled={!draftRow || busy}>Load Draft</button>
          <button className="secondary iconText" onClick={loadInit} disabled={loadingInit}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="ghost" onClick={() => signOut()}>Sign out</button>
        </div>
      </header>

      {message && <StatusLine text={message} type={message.includes("created") || message.includes("loaded") ? "ok" : actionErrors.length ? "error" : "info"} />}
      {/* плашки «… created / Open Google Doc» нет: ссылки на документы — на нижней панели (Даша, 05.10 и 07.10).
          Остаётся только предупреждение, если в документе что-то не подставилось. */}
      {result && [].concat(result).some((r) => r.remainingPlaceholders?.length) && (
        <StatusLine
          type="error"
          text={`Остались placeholders: ${[].concat(result).flatMap((r) => r.remainingPlaceholders || []).join(", ")}`}
        />
      )}

      <SectionNav items={navItems} />

      <div className="workspace">
        <form className="formPanel" onSubmit={(e) => e.preventDefault()}>
          {(init.config?.templates || []).length > 1 && (
            <Section title="Template" status={{ state: templateId ? "ok" : "warning", label: templateId ? "Selected" : "Choose template" }}>
              <SelectField
                id="templateId"
                label="Document Template"
                tip="Выберите шаблон Google Doc, на основе которого будет создан MOU."
                value={templateId}
                onChange={(_, value) => {
                  setTemplateId(value);
                  const selectedTemplate = init.config?.templates?.find((t) => t.id === value);
                  if (selectedTemplate) {
                    const label = (selectedTemplate.label || "").toLowerCase();
                    if (label.includes("off-plan") || label.includes("off plan")) {
                      patch("unitStatus", "Off-Plan");
                      applyProjectData(form.projectName, "Off-Plan");
                    } else if (label.includes("ready") || label.includes("cash")) {
                      patch("unitStatus", "Ready");
                      applyProjectData(form.projectName, "Ready");
                    }
                  }
                }}
                options={[
                  { value: "", label: "Select template..." },
                  ...(init.config?.templates || []).map((t) => ({ value: t.id, label: t.label })),
                ]}
              />
            </Section>
          )}

          <Section title="Agreement" status={sectionStatuses.agreement}>
            <DateField id="agreementDate" label="Agreement Date" tip={tips.agreementDate} value={form.agreementDate} onChange={(_, value) => setAgreementDate(value)} />
            <SelectField
              id="reservationMode"
              label="Reservation Deadline Mode"
              tip={tips.reservationDeadlineMode}
              value={reservationMode}
              onChange={(_, value) => changeReservationMode(value)}
              options={[
                { value: "date", label: "Specific date" },
                { value: "days", label: "Calculate by days" },
              ]}
            />
            {reservationMode === "date" ? (
              <DateField id="reservationDeadline" label="Reservation Deadline" tip={tips.reservationDeadline} value={form.reservationDeadline} onChange={patch} />
            ) : (
              <>
                <Field id="reservationDays" label="Reservation Period Days" tip={tips.reservationDays} value={reservationDays} onChange={(_, value) => changeReservationDays(value)} placeholder="Например 30" />
                <SelectField
                  id="reservationDayType"
                  label="Day Type"
                  tip={tips.reservationDays}
                  value={reservationDayType}
                  onChange={(_, value) => changeReservationDayType(value)}
                  options={[
                    { value: "calendar", label: "Calendar days" },
                    { value: "business", label: "Business days" },
                  ]}
                />
                <DateField id="reservationDeadline" label="Reservation Deadline" tip={tips.reservationDeadline} value={form.reservationDeadline} onChange={patch} />
              </>
            )}
            {holidaysInRange.length > 0 ? (
              <div style={{ gridColumn: "1 / -1" }}>
                <Notice 
                  title="⚠️ Внимание: В выбранный период попадают государственные праздники ОАЭ!" 
                  type="warning" 
                  items={[
                    ...holidaysInRange.map(h => `${h.name} (${h.date})`),
                    "В расчётах использованы ожидаемые астрономические даты. Точные даты могут быть изменены правительством. Пожалуйста, проверьте дедлайн вручную."
                  ]} 
                />
              </div>
            ) : null}
          </Section>

          <Section title="Project / Developer" status={sectionStatuses.project}>
            <Field id="projectName" label="Project" tip={tips.projectName} value={form.projectName} onChange={(id, value) => { patch(id, value); applyProjectData(value, form.unitStatus, { syncLocation: true }); }} list="projectsList" options={projectNames} />
            <SelectField
              id="unitStatus"
              label="Unit Status"
              tip={tips.unitStatus}
              value={form.unitStatus}
              onChange={(id, value) => { patch(id, value); applyProjectData(form.projectName, value); }}
              options={["", "Off-Plan", "Ready"]}
              disabled={Boolean(templateId && (init.config?.templates?.find((t) => t.id === templateId)?.label || "").toLowerCase().match(/off-plan|off plan|ready|cash/))}
            />
            <Field id="developerName" label="Developer Name" tip={tips.developerName} value={form.developerName} onChange={patch} />
            <Field id="developerLegalName" label="Developer Legal Name" tip={tips.developerLegalName} value={form.developerLegalName} onChange={patch} />
            {!isCashToCash && <Field id="escrowAccountName" label="Escrow Account Name" tip={tips.escrowAccountName} value={form.escrowAccountName} onChange={patch} />}
            {isMortgage && !isReadyTemplate ? (
              <>
                <AutoMoneyField id="admFee" label="ADM Fee (2% or ADM valuation)" tip={tips.admFee} value={form.admFee} autoValue={preview?.summary?.admFee} onChange={patch} placeholder="Посчитается автоматически" />
                <AutoMoneyField id="admElectronicFee" label="ADM Electronic Fee" tip={tips.admElectronicFee} value={form.admElectronicFee} onChange={patch} />
                <AutoMoneyField id="admValuationFee" label="ADM Valuation Certificate" tip={tips.admValuationFee} value={form.admValuationFee} onChange={patch} />
              </>
            ) : isReadyTemplate ? (
              <>
                <AutoMoneyField id="admFee" label="ADM Fee (2% or ADM valuation)" tip={tips.admFee} value={form.admFee} autoValue={preview?.summary?.admFee} onChange={patch} placeholder="Посчитается автоматически" />
                <AutoMoneyField id="admElectronicFee" label="ADM Electronic Fee" tip={tips.admElectronicFee} value={form.admElectronicFee} onChange={patch} />
                <AutoMoneyField id="admValuationFee" label="ADM Valuation Certificate" tip={tips.admValuationFee} value={form.admValuationFee} onChange={patch} />
                <AutoMoneyField id="developerNocFee" label="Developer NOC Fee" tip={tips.developerNocFee} value={form.developerNocFee} onChange={patch} />
                <AutoMoneyField id="communityNocFee" label="Community NOC Fee" tip={tips.communityNocFee} value={form.communityNocFee} onChange={patch} />
                {hasUnitVerification && <AutoMoneyField id="unitVerificationFee" label="Unit Verification / Search Certificate" tip={tips.unitVerificationFee} value={form.unitVerificationFee} onChange={patch} />}
                {hasSellerMortgage && <AutoMoneyField id="mortgageReleaseFee" label="Mortgage Release Fee" tip={tips.mortgageReleaseFee} value={form.mortgageReleaseFee} onChange={patch} />}
              </>
            ) : (
              <AutoMoneyField id="admAdminFee" label="ADM Admin Fee" tip={tips.admAdminFee} value={form.admAdminFee} onChange={patch} />
            )}
            {!isReadyTemplate && <Field id="transferFeeLabel" label="Transfer Fee Label" tip={tips.transferFeeLabel} value={form.transferFeeLabel} onChange={patch} />}
          </Section>

          <Section title="Property" status={sectionStatuses.property}>
            <Field id="titleDeedNumber" label="Title Deed Number" tip={tips.titleDeedNumber} value={form.titleDeedNumber} onChange={patch} placeholder="N/A" />
            <Field id="propertyLocation" label="Property Location / Island" tip={tips.propertyLocation} value={form.propertyLocation} onChange={patch} />
            <Field id="bedrooms" label="Bedrooms" tip={tips.bedrooms} value={form.bedrooms} onChange={patch} list="bedroomsList" options={lists.bedroom || []} />
            <Field id="areaM2" label="Area, sq.m" tip={tips.areaM2} value={form.areaM2} onChange={patch} onBlur={(id, value) => patch(id, formatArea(value))} placeholder="Например 67.20" />
            <Field id="propertyType" label="Property Type" tip={tips.propertyType} value={form.propertyType} onChange={patch} list="propertyTypesList" options={lists.property_types || []} />
            <Field id="unitNumber" label="Unit Number" tip={tips.unitNumber} value={form.unitNumber} onChange={patch} />
            {isReadyTemplate && <Field id="projectNumber" label="Project No." tip={tips.projectNumber} value={form.projectNumber} onChange={patch} />}
            <Field
              id="parkingSpaces"
              label={isReadyTemplate ? "Parking Space No." : "Parking Spaces"}
              tip={isReadyTemplate ? "Номер парковочного места в готовом объекте, например B27." : tips.parkingSpaces}
              value={form.parkingSpaces}
              onChange={patch}
            />
            {!isReadyTemplate && <Field id="additionalInformation" label="Additional Information" tip={tips.additionalInformation} value={form.additionalInformation} onChange={patch} />}
            {isReadyTemplate && (
              <>
                <SelectField id="propertyRented" label="Property is rented?" tip={tips.propertyRented} value={form.propertyRented || "No"} onChange={patch} options={["No", "Yes"]} />
                {form.propertyRented === "Yes" && (
                  <>
                    <AutoMoneyField id="annualRent" label="Annual Rent" tip={tips.annualRent} value={form.annualRent} onChange={patch} />
                    <DateField id="tenancyEndDate" label="Tenancy Contract Until" tip={tips.tenancyEndDate} value={form.tenancyEndDate} onChange={patch} />
                  </>
                )}
              </>
            )}
          </Section>

          <PartySection title="Seller" type="sellers" parties={form.sellers} setForm={setForm} lists={lists} status={sectionStatuses.sellers} />
          <PartySection title="Buyer" type="buyers" parties={form.buyers} setForm={setForm} lists={lists} status={sectionStatuses.buyers} />

          <Section title="Payments" status={sectionStatuses.payments}>
            {!isCashToCash && <AutoMoneyField id="originalPrice" label="Original Price from SPA" tip={tips.originalPrice} value={form.originalPrice} onChange={patch} />}
            <AutoMoneyField id="sellingPrice" label="Selling Price agreed by Parties" tip={tips.sellingPrice} value={form.sellingPrice} onChange={patch} />
            {!isCashToCash && <AutoMoneyField id="paidAmountToDeveloper" label="Paid to Developer" tip={tips.paidAmountToDeveloper} value={form.paidAmountToDeveloper} onChange={patch} placeholder="Например 600,000" />}
            <Field id="amountToSellerAuto" label="Amount to be paid to Seller" tip={tips.amountToSeller} value={preview?.summary?.amountToSeller ? `AED ${preview.summary.amountToSeller}` : ""} onChange={() => {}} placeholder={isCashToCash ? "= Selling Price" : "Посчитается автоматически"} readOnly />
            {!isMortgage && <SelectField
              id="amountToSellerPaymentMethod"
              label="Amount to Seller Payment Method"
              tip={isReadyTemplate
                ? "В этом шаблоне сумма Продавцу платится только Manager\u2019s Cheque, выбора нет."
                : tips.amountToSellerPaymentMethod}
              value={isReadyTemplate ? "manager_cheque" : form.amountToSellerPaymentMethod}
              onChange={patch}
              disabled={isReadyTemplate}
              options={[
                { value: "", label: "Select..." },
                { value: "manager_cheque", label: "Manager's Cheque" },
                { value: "cash", label: "Cash" },
                { value: "manager_cheque_in_favour", label: "Manager's Cheque issued in favour of..." },
              ]}
            />}
            {!isMortgage && !isReadyTemplate && form.amountToSellerPaymentMethod === "manager_cheque_in_favour" ? (
              <Field
                id="amountToSellerChequeInFavourOf"
                label="Cheque in favour of"
                tip={tips.amountToSellerChequeInFavourOf}
                value={form.amountToSellerChequeInFavourOf}
                onChange={patch}
                placeholder="Введите имя и фамилию"
              />
            ) : null}
            {hasSellerMortgage && (
              <>
                <Field id="sellerBankName" label="Seller's Bank (mortgage)" tip={tips.sellerBankName} value={form.sellerBankName} onChange={patch} options={lists.banks || []} />
                {!isMortgage && <SelectField
                  id="buyerFunds"
                  label="Buyer Funds"
                  tip={tips.buyerFunds}
                  value={form.buyerFunds || "own_funds"}
                  onChange={patch}
                  options={[
                    { value: "own_funds", label: "Own funds" },
                    { value: "financing", label: "Own funds, Personal Loan, Equity Release" },
                  ]}
                />}
              </>
            )}
            {!isCashToCash && <Field id="transferThresholdPercent" label="Transfer Threshold %" tip={tips.transferThresholdPercent} value={form.transferThresholdPercent} onChange={patch} list="thresholdList" options={lists.transfer_threshold_percent || []} />}
            {!isCashToCash && <AutoMoneyField id="thresholdTopUpAmount" label="Threshold Top-up to Developer" tip={tips.thresholdTopUpAmount} value={form.thresholdTopUpAmount} autoValue={preview?.summary?.thresholdTopUpAmount} onChange={patch} placeholder="Посчитается автоматически" />}
            {!isCashToCash && <AutoMoneyField id="remainingDeveloperBalance" label="Remaining Developer Balance" tip={tips.remainingDeveloperBalance} value={form.remainingDeveloperBalance} autoValue={preview?.summary?.remainingDeveloperBalance} onChange={patch} placeholder="Посчитается автоматически" />}
            <AutoMoneyField id="transferFee" label="Transfer / NOC Fee" tip={tips.transferFee} value={form.transferFee} onChange={patch} />
          </Section>

          <Section title="Agency" status={sectionStatuses.agency}>
            <div style={{ display: "grid", gap: "10px", alignContent: "start" }}>
              <CheckboxField id="sellerAgentEnabled" label="Seller has an Agent" tip="Есть ли агентство со стороны продавца?" checked={form.sellerAgentEnabled === "Yes"} onChange={(_, checked) => patch("sellerAgentEnabled", checked ? "Yes" : "No")} />
              {form.sellerAgentEnabled === "Yes" ? (
                <>
                  <Field id="sellerAgentName" label="Seller Agent" tip={tips.sellerAgentName} value={form.sellerAgentName} onChange={(_, value) => patchAgentName("seller", value)} list="agentsList" options={agencyOptions(init.agents, lists.agent)} />
                  <Field id="sellerAgentPosition" label="Position" tip="Должность представителя (из вкладки AGENTS, можно поправить). Пусто — Manager" value={form.sellerAgentPosition} onChange={patch} placeholder="Manager" />
                  <Field id="sellerAgentRepresentative" label="Representative" tip="Представитель агентства: выберите из AGENTS или впишите нового — при создании MOU он сохранится в таблицу" value={form.sellerAgentRepresentative} onChange={(_, value) => patchAgentRepresentative("seller", value)} options={agentRepresentatives(init.agents, form.sellerAgentName)} placeholder="Авто из справочника" />
                  <Field id="sellerAgentLicense" label="License" tip="Номер лицензии агентства" value={form.sellerAgentLicense} onChange={patch} placeholder="Авто из справочника" />
                  <Field id="sellerAgentAddress" label="Address" tip="Адрес агентства" value={form.sellerAgentAddress} onChange={patch} placeholder="Авто из справочника" />
                  <CheckboxField id="sellerAgentFeeEnabled" label="Include Seller's Agency fee in MOU" tip="Есть ли комиссия у агентства продавца? Если снять — строка комиссии уйдет из договора (шаблон v2)" checked={form.sellerAgentFeeEnabled !== "No"} onChange={(_, checked) => patch("sellerAgentFeeEnabled", checked ? "Yes" : "No")} />
                  {form.sellerAgentFeeEnabled !== "No" ? (
                    <AutoMoneyField id="agencyFeeSeller" label="Agency Fee Seller" tip={tips.agencyFeeSeller} value={form.agencyFeeSeller} autoValue={preview?.summary?.agencyFeeSeller} onChange={patch} placeholder="Пусто = auto 2.1%, 0 = нет комиссии" />
                  ) : null}
                </>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: "10px", alignContent: "start" }}>
              <CheckboxField id="buyerAgentEnabled" label="Buyer has an Agent" tip="Есть ли агентство со стороны покупателя?" checked={form.buyerAgentEnabled === "Yes"} onChange={(_, checked) => patch("buyerAgentEnabled", checked ? "Yes" : "No")} />
              {form.buyerAgentEnabled === "Yes" ? (
                <>
                  <Field id="buyerAgentName" label="Buyer Agent" tip={tips.buyerAgentName} value={form.buyerAgentName} onChange={(_, value) => patchAgentName("buyer", value)} list="agentsList" options={agencyOptions(init.agents, lists.agent)} />
                  <Field id="buyerAgentPosition" label="Position" tip="Должность представителя (из вкладки AGENTS, можно поправить). Пусто — Manager" value={form.buyerAgentPosition} onChange={patch} placeholder="Manager" />
                  <Field id="buyerAgentRepresentative" label="Representative" tip="Представитель агентства: выберите из AGENTS или впишите нового — при создании MOU он сохранится в таблицу" value={form.buyerAgentRepresentative} onChange={(_, value) => patchAgentRepresentative("buyer", value)} options={agentRepresentatives(init.agents, form.buyerAgentName)} placeholder="Авто из справочника" />
                  <Field id="buyerAgentLicense" label="License" tip="Номер лицензии агентства" value={form.buyerAgentLicense} onChange={patch} placeholder="Авто из справочника" />
                  <Field id="buyerAgentAddress" label="Address" tip="Адрес агентства" value={form.buyerAgentAddress} onChange={patch} placeholder="Авто из справочника" />
                  <CheckboxField id="buyerAgentFeeEnabled" label="Include Buyer's Agency fee in MOU" tip="Есть ли комиссия у агентства покупателя? Если снять — строка комиссии уйдет из договора (шаблон v2)" checked={form.buyerAgentFeeEnabled !== "No"} onChange={(_, checked) => patch("buyerAgentFeeEnabled", checked ? "Yes" : "No")} />
                  {form.buyerAgentFeeEnabled !== "No" ? (
                    <AutoMoneyField id="agencyFeeBuyer" label="Agency Fee Buyer" tip={tips.agencyFeeBuyer} value={form.agencyFeeBuyer} autoValue={preview?.summary?.agencyFeeBuyer} onChange={patch} placeholder="Пусто = auto 2.1%, можно вручную" />
                  ) : null}
                </>
              ) : null}
            </div>
          </Section>

          <DepositSection side="seller" title="Security Deposit - Seller" form={form} patch={patch} lists={lists} status={sectionStatuses.sellerDeposit} preview={preview} />
          <DepositSection side="buyer" title="Security Deposit - Buyer" form={form} patch={patch} lists={lists} status={sectionStatuses.buyerDeposit} preview={preview} />

          <Section title="Articles" status={sectionStatuses.articles} defaultOpen={false}>
            {/* без выбранного шаблона показывался старый список на 27 статей — он
                остался от движка до v2 и ни к одному размеченному шаблону не относится */}
            {!selectedTemplate ? (
              <p className="smallNote">Выберите шаблон в разделе Template — список статей берётся из него.</p>
            ) : null}
            {form.buyerDepositEnabled === "No" && form.sellerDepositEnabled === "No" ? (
              <p className="smallNote">Оба security cheque отключены: Article 6 и Article 9 снимаются автоматически.</p>
            ) : null}
            {(selectedTemplate ? currentArticleDefs : []).map(([key, originalNumber, title]) => {
              const isMandatory = [
                "article_sale_offer_number",
                "article_effective_date_number",
                "article_property_details_number",
                "article_selling_price_number",
                "article_payment_table_number",
                "article_reservation_period_number"
              ].includes(key);
              const isSecurityDisabled = (key === "article_security_deposit_number" || key === "article_deposit_release_number") && form.buyerDepositEnabled === "No" && form.sellerDepositEnabled === "No";
              // в шаблонах на движке v2 состав статей задан самим документом:
              // выключить статью галочкой нельзя, иначе номера съедут, а текст останется
              const isV2 = selectedTemplate?.engine === "v2";

              return (
                <CheckboxField
                  key={key}
                  id={key}
                  label={`Include Article ${originalNumber} - ${title}`}
                  tip={isV2
                    ? "Состав статей задан шаблоном: галочки только показывают, что войдёт. Статьи про депозит уходят сами, когда обе стороны без чеков."
                    : articleTips[key] || tips.articles}
                  checked={isMandatory ? true : isArticleIncluded(form, key)}
                  onChange={(_, checked) => !isMandatory && toggleArticle(key, checked)}
                  disabled={isMandatory || isSecurityDisabled || isV2}
                />
              );
            })}
          </Section>

          <CommissionSection
            form={form}
            agentOptions={agencyOptions(init.agents, lists.agent)}
            patchCa={patchCa}
            patchCaAgency={patchCaAgency}
            patchCaPayerCompany={patchCaPayerCompany}
            busy={busy || loadingInit}
            onCreate={createCommission}
          />
        </form>

        <aside className="previewPanel">
          <div className="previewHeader">
            <div>
              <h2>Preview Summary</h2>
              <p>Это проверочный summary. Финальный текст берется из Google Doc-шаблона.</p>
            </div>
            <button className="primary iconText" onClick={createMou} disabled={busy || loadingInit}>
              {busy ? <Loader2 className="spin" size={16} /> : <FileText size={16} />} Create MOU
            </button>
          </div>
          <Preview preview={preview} actionErrors={actionErrors} />
        </aside>
      </div>

      <ActionBar
        missingTotal={missingTotal}
        sellingPrice={form.sellingPrice}
        busy={busy}
        disabled={busy || loadingInit}
        onCreate={createMou}
        onCreateBoth={createBoth}
        results={result ? [].concat(result) : []}
      />
    </main>
  );
}

// Commission Agreement: отдельный документ к MOU. Сумма по умолчанию — 2,1% от
// Selling Price, поле редактируемое. Платит Продавец (обычно), Покупатель или
// компания; если платят обе стороны сделки — два отдельных соглашения.
function CommissionSection({ form, agentOptions, patchCa, patchCaAgency, patchCaPayerCompany, busy, onCreate }) {
  const agencies = form.caAgencies?.length ? form.caAgencies : [emptyCaAgency(DEFAULT_AGENT)];
  const isCompany = form.caPayer === "Company";
  const price = Number(String(form.sellingPrice || "").replace(/,/g, ""));
  const autoFee = price ? String(Math.round(price * 0.021 * 100) / 100) : "";
  const company = form.caPayerCompany || emptyCaAgency("");
  const maxAgencies = isCompany ? 1 : 2;

  const agencyFields = (a, onField, prefix, withFee) => (
    <>
      <Field id={`${prefix}Name`} label="Agency" tip="Агентство из справочника AGENTS или любое другое — с MOU не связано" value={a.name} onChange={(_, v) => onField("name", v)} options={agentOptions} />
      <Field id={`${prefix}Position`} label="Position" tip="Должность представителя (из AGENTS, можно поправить)" value={a.position} onChange={(_, v) => onField("position", v)} placeholder="Manager" />
      <Field id={`${prefix}Representative`} label="Representative" tip="Представитель агентства (из AGENTS, можно поправить)" value={a.representative} onChange={(_, v) => onField("representative", v)} placeholder="Авто из справочника" />
      <Field id={`${prefix}License`} label="License" tip="Номер лицензии без #" value={a.license} onChange={(_, v) => onField("license", v)} placeholder="Авто из справочника" />
      <Field id={`${prefix}Address`} label="Address" tip="Адрес агентства" value={a.address} onChange={(_, v) => onField("address", v)} placeholder="Авто из справочника" />
      {withFee ? (
        <AutoMoneyField id={`${prefix}Fee`} label="Commission (VAT inclusive)" tip="По умолчанию 2,1% от Selling Price, можно изменить" value={a.fee} autoValue={autoFee} onChange={(_, v) => onField("fee", v)} placeholder="Пусто = auto 2.1%" />
      ) : null}
    </>
  );

  return (
    <Section title="Commission Agreement" status={{ state: "optional", label: "Separate document" }} defaultOpen={false}>
      <SelectField id="caPayer" label="Who pays (First Party)" tip="Обычно платит Продавец. Если платят оба — делаем два отдельных соглашения." value={form.caPayer || "Seller"} onChange={(_, v) => {
        patchCa("caPayer", v);
        if (v === "Company" && agencies.length > 1) patchCa("caAgencies", agencies.slice(0, 1));
      }} options={[{ value: "Seller", label: "Seller (из MOU)" }, { value: "Buyer", label: "Buyer (из MOU)" }, { value: "Company", label: "Company (компания — компании)" }]} />
      <SelectField id="caPaymentTerm" label="Payment term" tip="Когда платится комиссия" value={form.caPaymentTerm === "two_days" ? "within_days" : form.caPaymentTerm || "on_transfer"} onChange={(_, v) => patchCa("caPaymentTerm", v)} options={[{ value: "on_transfer", label: "In full on the day of transfer" }, { value: "within_days", label: "Within N business days after Transfer" }]} />
      {form.caPaymentTerm === "within_days" || form.caPaymentTerm === "two_days" ? (
        <Field id="caPaymentDays" label="Business days" tip="Сколько рабочих дней после Transfer Date на оплату. В договоре: within 2 (two) business days following the Transfer Date" value={form.caPaymentDays ?? "2"} onChange={(_, v) => patchCa("caPaymentDays", v)} placeholder="2" />
      ) : null}
      <DateField id="caDate" label="Agreement date" tip="Дата Commission Agreement — по умолчанию сегодняшняя (дата создания), можно выбрать другую" value={form.caDate || todayFormValue()} onChange={(_, v) => patchCa("caDate", v)} />

      {isCompany ? (
        <div style={{ display: "grid", gap: "10px", alignContent: "start" }}>
          <strong>First Party — company</strong>
          {agencyFields(company, patchCaPayerCompany, "caPayerCompany", false)}
        </div>
      ) : null}

      {agencies.slice(0, maxAgencies).map((a, i) => (
        <div key={i} style={{ display: "grid", gap: "10px", alignContent: "start" }}>
          <strong>{i === 0 ? "Second Party" : "Third Party"} — receives commission</strong>
          {agencyFields(a, (field, v) => patchCaAgency(i, field, v), `caAgency${i}`, true)}
          {i > 0 ? (
            <button type="button" className="secondary iconText" onClick={() => patchCa("caAgencies", agencies.filter((_, k) => k !== i))}>
              <Trash2 size={16} /> Remove agency
            </button>
          ) : null}
        </div>
      ))}

      {agencies.length < maxAgencies ? (
        <button type="button" className="secondary iconText" onClick={() => patchCa("caAgencies", [...agencies, emptyCaAgency("")])}>
          <Plus size={16} /> Add second agency
        </button>
      ) : null}

      <button type="button" className="primary iconText" onClick={onCreate} disabled={busy}>
        {busy ? <Loader2 className="spin" size={16} /> : <FileText size={16} />} Create Commission Agreement
      </button>
    </Section>
  );
}

function FullScreenLoader({ text }) {
  return <main className="login"><section className="loginPanel"><Loader2 className="spin" /><p>{text}</p></section></main>;
}

function StatusLine({ text, type }) {
  return <div className={`status ${type}`}>{type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {text}</div>;
}

function ActionErrorBox({ errors }) {
  return (
    <section className="actionErrorBox">
      <strong>MOU was not created</strong>
      <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
    </section>
  );
}

// Якорь секции: из заголовка делаем стабильный id для прокрутки из чипов.
function sectionAnchor(title) {
  return "sec-" + String(title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function useStickyHeights(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const root = document.documentElement;
    const update = () => {
      const topbar = document.querySelector(".topbar");
      const nav = document.querySelector(".sectionNav");
      const topbarSticky = topbar && window.getComputedStyle(topbar).position === "sticky";
      root.style.setProperty("--topbar-h", `${topbarSticky ? topbar.offsetHeight : 0}px`);
      root.style.setProperty("--nav-h", `${nav ? nav.offsetHeight : 0}px`);
    };
    update();
    const observer = new window.ResizeObserver(update);
    for (const el of document.querySelectorAll(".topbar, .sectionNav")) observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [enabled]);
}

function SectionNav({ items }) {
  return (
    <nav className="sectionNav" aria-label="Разделы формы">
      {items.map((item) => (
        <button
          key={item.title}
          type="button"
          className={`navChip ${item.state}`}
          title={item.missing?.length ? `Не заполнено:\n${item.missing.join("\n")}` : undefined}
          onClick={() => document.getElementById(sectionAnchor(item.title))?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          {item.title}
          {item.missingCount > 0 && <span className="navChipCount">{item.missingCount}</span>}
        </button>
      ))}
    </nav>
  );
}

function ActionBar({ missingTotal, sellingPrice, busy, disabled, onCreate, onCreateBoth, results = [] }) {
  return (
    <div className="actionBar">
      <div className="actionBarInfo">
        <strong>{missingTotal ? `Не заполнено полей: ${missingTotal} — договор не создастся, пока они пустые` : "Все обязательные поля заполнены"}</strong>
        {sellingPrice ? <span>Selling Price — AED {sellingPrice}</span> : null}
        {/* ссылки на созданные документы — рядом с кнопками, отдельно MOU и Commission Agreement */}
        {results.length ? (
          <span className="actionBarLinks">
            {results.map((r) => (
              <a key={r.url} className="openDoc" href={r.url} target="_blank" rel="noreferrer">
                Open {r.kind || "MOU"} <ExternalLink size={14} />
              </a>
            ))}
          </span>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button className="secondary iconText" onClick={onCreateBoth} disabled={disabled}>
          {busy ? <Loader2 className="spin" size={16} /> : <FileText size={16} />} Create MOU and Commission Agreement
        </button>
        <button className="primary iconText" onClick={onCreate} disabled={disabled}>
          {busy ? <Loader2 className="spin" size={16} /> : <FileText size={16} />} Create MOU
        </button>
      </div>
    </div>
  );
}

function Section({ title, children, status, grid = true, className = "", defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const statusState = status?.state || "optional";
  const statusLabel = status?.label || "Optional";

  return (
    <section id={sectionAnchor(title)} className={`section ${className} ${open ? "" : "collapsed"}`}>
      <button className="sectionTitle" type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className={`sectionChevron ${open ? "open" : ""}`}><ChevronDown size={16} /></span>
        <span className="sectionName">{title}</span>
        <span className={`sectionStatus ${statusState}`} title={status?.missing?.length ? `Не заполнено:\n${status.missing.join("\n")}` : undefined}>{statusLabel}</span>
      </button>
      {open && <div className={grid ? "grid" : "sectionBody"}>{children}</div>}
    </section>
  );
}

function Label({ label, tip }) {
  return (
    <label>
      <span>{label}</span>
      <Tooltip text={tip} />
    </label>
  );
}

function Tooltip({ text }) {
  const iconRef = useRef(null);
  const [bubble, setBubble] = useState(null);

  function showBubble() {
    const rect = iconRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 12), window.innerWidth - width - 12);
    const preferredTop = rect.top - 12;
    const top = preferredTop > 110 ? preferredTop : rect.bottom + 12;

    setBubble({
      width,
      left,
      top,
      placement: preferredTop > 110 ? "above" : "below",
    });
  }

  function hideBubble() {
    setBubble(null);
  }

  return (
    <span
      ref={iconRef}
      className="tooltip"
      tabIndex={0}
      onMouseEnter={showBubble}
      onMouseOver={showBubble}
      onMouseLeave={hideBubble}
      onFocus={showBubble}
      onBlur={hideBubble}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (bubble) {
          hideBubble();
        } else {
          showBubble();
        }
      }}
    >
      <HelpCircle size={15} />
      {bubble && (
        <span
          className={`tooltipBubble ${bubble.placement}`}
          style={{
            width: bubble.width,
            left: bubble.left,
            top: bubble.top,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function Field({ id, label, tip, value, onChange, onBlur, list, options, placeholder, readOnly = false, invalid = false }) {
  return (
    <div className={`field${invalid ? " invalid" : ""}`}>
      <Label label={label} tip={tip} />
      {options?.length ? (
        <ComboInput id={id} value={value || ""} options={options} onChange={(next) => onChange(id, next)} />
      ) : (
        <input
          id={id}
          value={value || ""}
          placeholder={placeholder || ""}
          readOnly={readOnly}
          className={readOnly ? "readOnlyInput" : ""}
          onChange={(e) => onChange(id, e.target.value)}
          onBlur={onBlur ? (e) => onBlur(id, e.target.value) : undefined}
        />
      )}
    </div>
  );
}

function EidField({ id, label, tip, value, onChange, invalid = false }) {
  return (
    <div className={`field${invalid ? " invalid" : ""}`}>
      <Label label={label} tip={tip} />
      <IMaskInput
        id={id}
        mask="784-0000-0000000-0"
        value={value || ""}
        unmask={false}
        onAccept={(val) => onChange(id, val)}
        placeholder="784-XXXX-XXXXXXX-X"
      />
    </div>
  );
}

function AutoMoneyField({ id, label, tip, value, autoValue, onChange, placeholder }) {
  const hasManualValue = String(value || "").trim() !== "";
  const hasAutoValue = String(autoValue || "").trim() !== "";

  const formatWithCommas = (val) => {
    if (!val) return "";
    const str = String(val).replace(/,/g, "");
    if (str === "-") return "-";
    const parts = str.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    if (isNaN(Number(integerPart)) && integerPart !== "" && integerPart !== "-") return val;
    
    let formattedInteger = integerPart;
    if (integerPart !== "" && integerPart !== "-") {
      formattedInteger = new Intl.NumberFormat("en-US").format(Number(integerPart));
    }
    
    if (parts.length > 1) {
      return `${formattedInteger}.${decimalPart}`;
    }
    return formattedInteger;
  };

  const displayValue = hasManualValue ? formatWithCommas(value) : hasAutoValue ? `AED ${formatWithCommas(autoValue)}` : "";

  const handleChange = (e) => {
    const val = e.target.value;
    const cleaned = val.replace(/[^\d.,\-]/g, "");
    onChange(id, formatWithCommas(cleaned));
  };

  return (
    <div className="field">
      <Label label={label} tip={tip} />
      <input
        id={id}
        value={displayValue}
        placeholder={placeholder || ""}
        className={!hasManualValue && hasAutoValue ? "autoCalculatedInput" : ""}
        onFocus={(event) => {
          if (!hasManualValue && hasAutoValue) event.target.select();
        }}
        onChange={handleChange}
      />
    </div>
  );
}

function DateField({ id, label, tip, value, onChange }) {
  return (
    <div className="field">
      <Label label={label} tip={tip} />
      <input
        id={id}
        type="date"
        value={toDateInputValue(value)}
        onChange={(event) => onChange(id, fromDateInputValue(event.target.value))}
      />
    </div>
  );
}

function SelectField({ id, label, tip, value, onChange, options, disabled, invalid = false }) {
  return (
    <div className={`field${invalid ? " invalid" : ""}`}>
      <Label label={label} tip={tip} />
      <CustomSelect id={id} value={value || ""} options={options} onChange={(next) => onChange(id, next)} disabled={disabled} />
    </div>
  );
}

function normalizeSelectOption(option) {
  if (typeof option === "string") {
    return {
      value: option,
      label: option || "Select...",
    };
  }

  return {
    value: option.value,
    label: option.label || option.value || "Select...",
  };
}

function CustomSelect({ id, value, options, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const normalizedOptions = options.map(normalizeSelectOption);
  const menuOptions = normalizedOptions.filter((option) => String(option.value) !== "");
  const selected = normalizedOptions.find((option) => String(option.value) === String(value)) || normalizedOptions[0];

  function choose(nextValue) {
    if (disabled) return;
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div className="selectWrap" onBlur={() => window.setTimeout(() => setOpen(false), 120)}>
      <button
        id={id}
        className={`selectButton ${open ? "open" : ""}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selected?.label || "Select..."}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="selectMenu" role="listbox" aria-labelledby={id}>
          {menuOptions.length ? menuOptions.map((option) => {
            const isSelected = String(option.value) === String(value);

            return (
              <button
                key={`${id}-${option.value}`}
                className={`selectOption ${isSelected ? "selected" : ""}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.value)}
              >
                {option.label}
              </button>
            );
          }) : <div className="comboEmpty">No options</div>}
        </div>
      )}
    </div>
  );
}

function CheckboxField({ id, label, tip, checked, onChange, disabled = false }) {
  return (
    <div className="checkField">
      <input id={id} type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(e) => onChange(id, e.target.checked)} />
      <Label label={label} tip={tip} />
    </div>
  );
}

function ComboInput({ id, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  // фильтруем только по тому, что печатают сейчас: при открытии списка с уже
  // выбранным значением показываем все варианты, иначе виден один выбранный
  const [typing, setTyping] = useState(false);
  const normalized = typing ? String(value || "").trim().toLowerCase() : "";
  const filtered = normalized
    ? options.filter((option) => String(option).toLowerCase().includes(normalized))
    : options;

  return (
    <div className="combo" onBlur={() => window.setTimeout(() => setOpen(false), 120)}>
      <input
        id={id}
        value={value || ""}
        autoComplete="off"
        onFocus={() => { setTyping(false); setOpen(true); }}
        onChange={(e) => {
          onChange(e.target.value);
          setTyping(true);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <button className="comboToggle" type="button" aria-label="Open options" onMouseDown={(e) => e.preventDefault()} onClick={() => { setTyping(false); setOpen((current) => !current); }}>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="comboMenu" role="listbox">
          {filtered.length ? (
            filtered.map((option) => (
              <button
                key={`${id}-${option}`}
                className="comboOption"
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="comboEmpty">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

function PartySection({ title, type, parties, setForm, lists, status }) {
  function setParty(index, key, value) {
    setForm((current) => ({
      ...current,
      [type]: current[type].map((party, i) => (i === index ? { ...party, [key]: value } : party)),
    }));
  }

  function addParty() {
    setForm((current) => ({ ...current, [type]: rebalance([...current[type], initialParty()]) }));
  }

  function removeParty(index) {
    setForm((current) => ({ ...current, [type]: rebalance(current[type].filter((_, i) => i !== index)) }));
  }

  const total = parties.reduce((sum, p) => sum + (Number(String(p.ownershipPercent || "").replace(",", ".")) || 0), 0);

  return (
    <Section title={title} status={status} grid={false} className="full">
      {parties.map((party, index) => {
        const gaps = partyMissingFields(party);
        return (
        <div className="partyCard" key={`${type}-${index}`}>
          <div className="partyHead">
            <h3>{title} {index + 1}</h3>
            {parties.length > 1 && <button className="danger iconText" type="button" onClick={() => removeParty(index)}><Trash2 size={15} /> Remove</button>}
          </div>
          <div className="grid">
            <SelectField
              id={`${type}-${index}-salutation`}
              label="Title"
              tip={tips.salutation}
              value={party.salutation || ""}
              onChange={(_, v) => setParty(index, "salutation", v)}
              invalid={Boolean(gaps.salutation)}
              options={[
                { value: "", label: "Select..." },
                "Mr.",
                "Mrs.",
                "Ms.",
              ]}
            />
            <Field id={`${type}-${index}-name`} label="Name Surname" tip={tips.partyName} value={party.name} onChange={(_, v) => setParty(index, "name", v)} invalid={Boolean(gaps.name)} />
            <Field id={`${type}-${index}-nationality`} label="Nationality" tip={tips.nationality} value={party.nationality} onChange={(_, v) => setParty(index, "nationality", v)} invalid={Boolean(gaps.nationality)} list={`${type}-${index}-nationalities`} options={orderedOptions(lists.nationalities, PRIORITY_NATIONALITIES)} />
            <Field id={`${type}-${index}-passport`} label="Passport" tip={tips.passport} value={party.passport} onChange={(_, v) => setParty(index, "passport", v)} invalid={Boolean(gaps.passport)} />
            <CheckboxField id={`${type}-${index}-hasEid`} label="Has Emirates ID" tip={tips.hasEid} checked={partyHasEid(party)} onChange={(_, v) => setParty(index, "hasEid", v)} />
            {partyHasEid(party) && <EidField id={`${type}-${index}-eid`} label="EID" tip={tips.eid} value={party.eid} onChange={(_, v) => setParty(index, "eid", v)} invalid={Boolean(gaps.eid)} />}
            <Field id={`${type}-${index}-ownership`} label="Ownership %" tip={tips.ownershipPercent} value={party.ownershipPercent} onChange={(_, v) => setParty(index, "ownershipPercent", v)} invalid={Boolean(gaps.ownershipPercent)} list={`${type}-${index}-ownerships`} options={lists.ownership_percent || []} />
            <SelectField id={`${type}-${index}-poa`} label="POA?" tip={tips.poa} value={party.hasPoa ? "Yes" : "No"} onChange={(_, v) => setParty(index, "hasPoa", v === "Yes")} options={["No", "Yes"]} />
          </div>
          {party.hasPoa && (
            <div className="grid poaGrid">
              <Field id={`${type}-${index}-poaName`} label="POA Name Surname" tip="Имя представителя по Power of Attorney (доверенности)." value={party.poaName} onChange={(_, v) => setParty(index, "poaName", v)} invalid={Boolean(gaps.poaName)} />
              <Field id={`${type}-${index}-poaNationality`} label="POA Nationality" tip={tips.nationality} value={party.poaNationality} onChange={(_, v) => setParty(index, "poaNationality", v)} invalid={Boolean(gaps.poaNationality)} list={`${type}-${index}-poa-nationalities`} options={orderedOptions(lists.nationalities, PRIORITY_NATIONALITIES)} />
              <Field id={`${type}-${index}-poaPassport`} label="POA Passport" tip={tips.passport} value={party.poaPassport} onChange={(_, v) => setParty(index, "poaPassport", v)} invalid={Boolean(gaps.poaPassport)} />
              <EidField id={`${type}-${index}-poaEid`} label="POA EID" tip={tips.eid} value={party.poaEid} onChange={(_, v) => setParty(index, "poaEid", v)} invalid={Boolean(gaps.poaEid)} />
            </div>
          )}
        </div>
      );
      })}
      <div className="sectionFooter">
        <button className="secondary iconText" type="button" onClick={addParty}><Plus size={16} /> Add {title}</button>
        <span className={Math.round(total * 100) / 100 === 100 ? "okText" : "warningText"}>Ownership total (итого доля): {Math.round(total * 100) / 100}%</span>
      </div>
      {Math.round(total * 100) / 100 !== 100 ? (
        <Notice title="Ошибка долей" items={[`Сумма долей (${Math.round(total * 100) / 100}%) не равна 100%. Пожалуйста, распределите доли корректно.`]} type="error" />
      ) : null}
    </Section>
  );
}

function rebalance(parties) {
  if (!parties.length) return [initialParty()];
  const base = Math.floor((100 / parties.length) * 100) / 100;
  let total = 0;
  return parties.map((party, index) => {
    const ownershipPercent = index < parties.length - 1 ? base : Math.round((100 - total) * 100) / 100;
    total += ownershipPercent;
    return { ...party, ownershipPercent: String(ownershipPercent).replace(".", ",") };
  });
}

function isArticleIncluded(form, key) {
  if ((key === "article_security_deposit_number" || key === "article_deposit_release_number") && form.buyerDepositEnabled === "No" && form.sellerDepositEnabled === "No") {
    return false;
  }
  if ((form.excludedArticleKeys || []).includes(key)) return false;
  const legacyField = legacyArticleFields[key];
  if (legacyField && form[legacyField] === false) return false;
  return true;
}

function partyNameOptions(parties) {
  return Array.from(new Set(
    (parties || [])
      .map((party) => String(party?.name || "").trim())
      .filter(Boolean),
  ));
}

function DepositSection({ side, title, form, patch, lists, status, preview }) {
  const cap = side[0].toUpperCase() + side.slice(1);
  const enabledKey = `${side}DepositEnabled`;
  const calcTypeKey = `${side}DepositCalcType`;
  const enabled = form[enabledKey] === "Yes";
  const fixed = String(form[calcTypeKey] || "").includes("Fixed");
  const depositAutoValue = preview?.summary?.[`${side}Deposit`];
  const sellerNames = partyNameOptions(form.sellers);
  const buyerNames = partyNameOptions(form.buyers);
  const drawnByOptions = side === "buyer" ? buyerNames : sellerNames;
  const inFavourOptions = side === "buyer" ? sellerNames : buyerNames;

  return (
    <Section title={title} status={status}>
      <SelectField id={enabledKey} label={`${cap} provides cheque?`} tip={tips.depositEnabled} value={form[enabledKey]} onChange={patch} options={["Yes", "No"]} />
      {!enabled && (
        <AutoMoneyField id={`${side}DefaultPenaltyAmount`} label="Default Penalty Amount" tip="Сумма штрафа в случае дефолта (по умолчанию 10% от Selling Price)" value={form[`${side}DefaultPenaltyAmount`]} autoValue={preview?.summary?.[`${side}DefaultPenaltyAmount`]} onChange={patch} placeholder="Пусто = 10% от Selling Price" />
      )}
      {enabled && (
        <>
          <SelectField id={calcTypeKey} label="Calculation Type" tip={tips.depositCalcType} value={form[calcTypeKey]} onChange={patch} options={["% of Selling Price", "Fixed Amount"]} />
          {!fixed && <Field id={`${side}DepositPercent`} label="Deposit %" tip={tips.depositPercent} value={form[`${side}DepositPercent`]} onChange={patch} />}
          {fixed && <AutoMoneyField id={`${side}DepositFixedAmount`} label="Fixed Amount" tip={tips.depositFixedAmount} value={form[`${side}DepositFixedAmount`]} onChange={patch} />}
          <Field id={`${side}DepositCalculated`} label="Calculated Deposit Amount" tip="Автоматически посчитанная сумма deposit (депозита), которая попадет в MOU." value={depositAutoValue ? `AED ${depositAutoValue}` : ""} onChange={() => {}} placeholder="Посчитается автоматически" readOnly />
          <SelectField id={`${side}ChequeTiming`} label="Cheque Timing" tip="Когда должен быть передан чек. Later — чека пока нет, будет позже: в договоре абзац без реквизитов чека" value={form[`${side}ChequeTiming`] || "Upon signing"} onChange={patch} options={["Upon signing", "Later", "Delayed (within X days)"]} />
          {form[`${side}ChequeTiming`] === "Delayed (within X days)" && <Field id={`${side}ChequeDays`} label="Days" tip="Количество дней на передачу чека (например, 5)" value={form[`${side}ChequeDays`]} onChange={patch} placeholder="5" />}
          {!chequeLater(form, side) && (
            <>
              <Field id={`${side}ChequeNumber`} label="Cheque No." tip={tips.chequeNumber} value={form[`${side}ChequeNumber`]} onChange={patch} />
              <DateField id={`${side}ChequeDate`} label="Cheque Date" tip={tips.chequeDate} value={form[`${side}ChequeDate`]} onChange={patch} />
              <Field id={`${side}ChequeBank`} label="Cheque Bank" tip={tips.chequeBank} value={form[`${side}ChequeBank`]} onChange={patch} list={`${side}Banks`} options={lists.banks || []} />
              <Field id={`${side}ChequeDrawnBy`} label="Drawn by" tip={tips.chequeDrawnBy} value={form[`${side}ChequeDrawnBy`]} onChange={patch} options={drawnByOptions} />
              <CheckboxField
                id={`${side}ChequeThirdParty`}
                label="Cheque issued by a third party"
                tip={side === "buyer"
                  ? "Чек выписан не самим покупателем (родственник, компания). В договор добавится фраза про undertaking letter (шаблон v2)"
                  : "Чек выписан не самим продавцом (родственник, компания). В договор добавится фраза про undertaking letter (шаблон v2)"}
                checked={form[`${side}ChequeThirdParty`] === "Yes"}
                onChange={(_, checked) => patch(`${side}ChequeThirdParty`, checked ? "Yes" : "No")}
              />
              <Field id={`${side}ChequeInFavourOf`} label="In favour of" tip={tips.chequeInFavourOf} value={form[`${side}ChequeInFavourOf`]} onChange={patch} options={inFavourOptions} />
            </>
          )}
        </>
      )}
    </Section>
  );
}

function Preview({ preview, actionErrors }) {
  // список пропусков после нажатия Create — даже если Preview ещё не посчитан
  if (!preview) {
    return actionErrors?.length
      ? <div className="previewContent"><Notice title="MOU was not created" items={actionErrors} type="error" /></div>
      : <div className="emptyPreview">Preview will appear after data loads.</div>;
  }
  const validation = preview.validation || { errors: [], warnings: [] };
  const s = preview.summary || {};

  if (preview.error) {
    return (
      <div className="previewContent">
        {actionErrors?.length ? <Notice title="MOU was not created" items={actionErrors} type="error" /> : null}
        <Notice title="Preview unavailable" items={[preview.error]} type="error" />
      </div>
    );
  }

  return (
    <div className="previewContent">
      {actionErrors?.length ? <Notice title="MOU was not created" items={actionErrors} type="error" /> : null}
      {validation.errors?.length ? (
        <Notice
          title={REQUIRED_FIELDS_BLOCKING ? "Fix before creating" : "Test mode: these fields are not blocking now"}
          items={validation.errors}
          type={REQUIRED_FIELDS_BLOCKING ? "error" : "warning"}
        />
      ) : (
        <Notice title="Ready checks" items={["No blocking validation errors."]} type="ok" />
      )}
      {validation.warnings?.length ? <Notice title="Warnings" items={validation.warnings} type="warning" /> : null}

      <PreviewCard title="Parties">
        <Row label="Seller" value={s.seller} />
        <Row label="Buyer" value={s.buyer} />
      </PreviewCard>
      <PreviewCard title="Property">
        <Row label="Project" value={preview.data?.projectName} />
        <Row label="Unit" value={preview.data?.unitNumber} />
        <Row label="Location" value={s.propertyLocation} />
        <Row label="Type of Area" value={s.typeOfArea} />
      </PreviewCard>
      <PreviewCard title="Payment Table">
        <Row label="Selling Price" value={aed(s.sellingPrice)} />
        <Row label="Amount to be paid to Seller" value={aed(s.amountToSeller)} />
        <Row label="Threshold Top-up to Developer" value={aed(s.thresholdTopUpAmount)} />
        <Row label="Remaining Developer Balance" value={aed(s.remainingDeveloperBalance)} />
        <Row label="ADM Fee" value={aed(s.admFee)} />
        <Row label="Agency Fee Seller" value={aed(s.agencyFeeSeller)} />
        <Row label="Agency Fee Buyer" value={aed(s.agencyFeeBuyer)} />
      </PreviewCard>
      <PreviewCard title="Security Deposits / Penalties">
        <Row label="Buyer Deposit" value={aed(s.buyerDeposit)} />
        <Row label="Seller Deposit" value={aed(s.sellerDeposit)} />
        <Row label="Buyer Penalty (No Deposit)" value={aed(s.buyerDefaultPenaltyAmount)} />
        <Row label="Seller Penalty (No Deposit)" value={aed(s.sellerDefaultPenaltyAmount)} />
      </PreviewCard>
      <PreviewCard title="Articles">
        <div className="articleGrid">
          {(preview.articles || []).map((article) => (
            <span
              key={article.key}
              className={article.included ? "articleOn articleHint" : "articleOff articleHint"}
              data-tip={articleTips[article.key] || "Короткое описание этой статьи пока не добавлено."}
              tabIndex={0}
            >
              {article.included ? `Article ${article.number}` : "Removed"} - {article.title}
            </span>
          ))}
        </div>
      </PreviewCard>
    </div>
  );
}

function Notice({ title, items, type }) {
  return (
    <div className={`notice ${type}`}>
      <strong>{title}</strong>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

function PreviewCard({ title, children }) {
  return <section className="previewCard"><h3>{title}</h3>{children}</section>;
}

function Row({ label, value }) {
  return <div className="row"><span>{label}</span><strong>{value || "—"}</strong></div>;
}

function aed(value) {
  return value ? `AED ${value}` : "";
}
