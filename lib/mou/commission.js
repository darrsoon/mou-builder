// Commission Agreement — отдельный документ к MOU (Даша, 03.10.2026).
// Стороны: платит физлицо (Продавец или Покупатель — обычно Продавец) одному или
// двум агентствам, либо одна компания платит другой. Если платят обе стороны
// сделки — это два отдельных соглашения. Агентства не обязаны совпадать с MOU.
// Шаблоны: COMMISSION_TEMPLATES (7 — одно агентство, 8 — два), условия и подписи
// размечены в документе (scripts/markup-commission.mjs).
import { amountToWords, numberToWords } from "./amount-words.js";
import { COMMISSION_TEMPLATES } from "./config.js";
import { buildPartyBlock, getMainPartyName, normalizeForm } from "./core.js";
import { markValue as mv, money, n, s, sanitizeFileName } from "./helpers.js";

export const COMMISSION_RATE = 0.021;

// Срок оплаты: в день перевода или через N рабочих дней — «within 2 (two) business days…»
export function paymentTermText(term, days) {
  if (term === "within_days" || term === "two_days") {
    const n = Math.max(1, parseInt(days, 10) || 2);
    return `full within ${n} (${numberToWords(n)}) business day${n === 1 ? "" : "s"} following the Transfer Date`;
  }
  return "full on the day of transfer";
}

const SIGNATURE_LINE = "________________";

// Дата в шапке шаблона: «23 June, 2026»
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function headerDate(value) {
  const m = String(value || "").match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  return m && MONTHS[Number(m[2]) - 1] ? `${Number(m[1])} ${MONTHS[Number(m[2]) - 1]}, ${m[3]}` : String(value || "");
}

// «dd/mm/yyyy», как дата MOU
function todayDubai() {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
}

function normalizeAgency(a = {}) {
  return {
    name: s(a.name),
    position: s(a.position) || "Manager",
    representative: s(a.representative),
    license: s(a.license).replace(/^#+\s*/, ""),
    address: s(a.address),
    fee: n(a.fee),
  };
}

export function normalizeCommission(form = {}) {
  const payer = ["Seller", "Buyer", "Company"].includes(form.caPayer) ? form.caPayer : "Seller";
  let agencies = (Array.isArray(form.caAgencies) ? form.caAgencies : []).map(normalizeAgency);
  // компания платит компании — только одно агентство-получатель
  if (payer === "Company") agencies = agencies.slice(0, 1);
  return {
    payer,
    payerCompany: normalizeAgency(form.caPayerCompany),
    agencies: agencies.slice(0, 2),
    // дата соглашения — дата создания (по Дубаю), в редких случаях выбирается вручную
    date: s(form.caDate) || todayDubai(),
    paymentTerm: ["within_days", "two_days"].includes(form.caPaymentTerm) ? "within_days" : "on_transfer",
    paymentDays: form.caPaymentTerm === "two_days" && form.caPaymentDays === undefined ? "2" : s(form.caPaymentDays),
  };
}

// Комиссия по умолчанию — 2,1% от Selling Price, поле остаётся редактируемым
export function commissionFee(agency, sellingPrice) {
  if (agency.fee !== "") return agency.fee;
  return sellingPrice !== "" ? Math.round(sellingPrice * COMMISSION_RATE * 100) / 100 : "";
}

// значения из формы помечены markValue: в соглашении они выделяются жёлтым (Даша, 07.10.2026)
function companyBlock(c) {
  return `<<${mv(c.name)}>>, represented by the ${mv(c.position)} ${mv(c.representative)}, authorized by the Economic license #${mv(c.license)}, located at ${mv(c.address)}`;
}

// Подписи (Даша, 04.10.2026): «Name: …   Signature: ____», ниже «Date:»; у компании
// подписывает представитель, и после Date строка «Company Stamp». Жирные только подписи
// полей, дату не ставим, строки блока — переносом внутри абзаца (\u000b)
function signatureLines(name, company) {
  return `<<Name:>> ${mv(name)}   <<Signature:>> ${SIGNATURE_LINE}\u000b<<Date:>>${company ? "\u000b<<Company Stamp>>" : ""}`;
}

// у компании — должность и имя представителя: «Name: Manager Mikhail Slobodchikov»
function companySignature(c) {
  return signatureLines(c.representative ? `${c.position} ${c.representative}` : c.name, true);
}

function personSignature(parties) {
  return parties
    .map((p) => (p.hasPoa && p.poaName ? p.poaName : p.name))
    .filter(Boolean)
    .map((name) => signatureLines(name, false))
    .join("\n");
}

export function validateCommission(form) {
  const data = normalizeForm(form);
  const ca = normalizeCommission(form);
  const errors = [];
  if (!ca.agencies.length) errors.push("Commission Agreement: добавьте агентство, которое получает комиссию.");
  ca.agencies.forEach((a, i) => {
    if (!a.name) errors.push(`Commission Agreement: агентство ${i + 1} — название.`);
    if (!a.representative) errors.push(`Commission Agreement: агентство ${i + 1} — представитель.`);
  });
  if (ca.payer === "Company") {
    if (!ca.payerCompany.name) errors.push("Commission Agreement: компания-плательщик — название.");
  } else {
    const parties = ca.payer === "Seller" ? data.sellers : data.buyers;
    if (!getMainPartyName(parties)) errors.push(`Commission Agreement: в MOU не заполнен ${ca.payer}.`);
  }
  if (!data.unitNumber) errors.push("Commission Agreement: не заполнен Unit Number.");
  if (data.sellingPrice === "") errors.push("Commission Agreement: не заполнен Selling Price.");
  if (!ca.date) errors.push("Commission Agreement: нет даты соглашения.");
  if (ca.paymentTerm === "within_days" && !(parseInt(ca.paymentDays, 10) > 0)) {
    errors.push("Commission Agreement: укажите число рабочих дней на оплату.");
  }
  return { ok: !errors.length, errors };
}

export function buildCommission(form) {
  const data = normalizeForm(form);
  const ca = normalizeCommission(form);
  const isCompany = ca.payer === "Company";
  const parties = ca.payer === "Buyer" ? data.buyers : data.sellers;
  const date = ca.date;

  const r = {
    ca_date: date,
    ca_date_header: headerDate(date),
    mou_date: data.agreementDate,
    unit_number: data.unitNumber,
    selling_price: money(data.sellingPrice),
    selling_price_words: amountToWords(data.sellingPrice),
    payment_term: paymentTermText(ca.paymentTerm, ca.paymentDays),
    payer_role: ca.payer,
    payer_party_block: isCompany ? companyBlock(ca.payerCompany) : buildPartyBlock(parties),
    payer_name: isCompany ? ca.payerCompany.name : getMainPartyName(parties),
    first_party_signature: isCompany ? companySignature(ca.payerCompany) : personSignature(parties),
  };
  const fees = [];
  ca.agencies.forEach((a, i) => {
    const k = `agency${i + 1}`;
    const fee = commissionFee(a, data.sellingPrice);
    fees.push(fee);
    Object.assign(r, {
      [`${k}_name`]: a.name,
      [`${k}_position`]: a.position,
      [`${k}_representative`]: a.representative,
      [`${k}_license`]: a.license,
      [`${k}_address`]: a.address,
      [`${k}_fee`]: money(fee),
      [`${k}_fee_words`]: amountToWords(fee),
    });
  });
  if (ca.agencies[0]) r.second_party_signature = companySignature(ca.agencies[0]);
  if (ca.agencies[1]) r.third_party_signature = companySignature(ca.agencies[1]);

  const templateId = ca.agencies.length === 2 ? COMMISSION_TEMPLATES.twoAgencies : COMMISSION_TEMPLATES.oneAgency;
  // имя файла: «Commission Agreement <юнит>»
  const title = sanitizeFileName(["Commission Agreement", data.unitNumber].filter(Boolean).join(" "));
  return { templateId, title, replacements: r, flags: { payer_is_company: isCompany }, fees, data, ca };
}
