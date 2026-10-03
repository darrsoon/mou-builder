// Commission Agreement — отдельный документ к MOU (Даша, 03.10.2026).
// Стороны: платит физлицо (Продавец или Покупатель — обычно Продавец) одному или
// двум агентствам, либо одна компания платит другой. Если платят обе стороны
// сделки — это два отдельных соглашения. Агентства не обязаны совпадать с MOU.
// Шаблоны: COMMISSION_TEMPLATES (7 — одно агентство, 8 — два), условия и подписи
// размечены в документе (scripts/markup-commission.mjs).
import { amountToWords } from "./amount-words.js";
import { COMMISSION_TEMPLATES } from "./config.js";
import { buildPartyBlock, getMainPartyName, normalizeForm } from "./core.js";
import { money, n, s, sanitizeFileName } from "./helpers.js";

export const COMMISSION_RATE = 0.021;

export const PAYMENT_TERMS = {
  on_transfer: "full on the day of transfer",
  two_days: "full within 2 (two) business days following the Transfer Date",
};

const SIGNATURE_LINE = "________________";

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
    paymentTerm: PAYMENT_TERMS[form.caPaymentTerm] ? form.caPaymentTerm : "on_transfer",
  };
}

// Комиссия по умолчанию — 2,1% от Selling Price, поле остаётся редактируемым
export function commissionFee(agency, sellingPrice) {
  if (agency.fee !== "") return agency.fee;
  return sellingPrice !== "" ? Math.round(sellingPrice * COMMISSION_RATE * 100) / 100 : "";
}

function companyBlock(c) {
  return `<<${c.name}>>, represented by the ${c.position} ${c.representative}, authorized by the Economic license #${c.license}, located at ${c.address}`;
}

// Подписи как в MOU: жирные только подписи полей, имена обычным, дату не ставим,
// строки блока — переносом внутри абзаца (\u000b), без пустых строк
function companySignature(c) {
  return `<<Company:>> ${c.name}\u000b<<Represented by:>> ${c.representative}  <<Signature:>> ${SIGNATURE_LINE}\u000b<<Date:>>\u000b<<Company Stamp>>`;
}

function personSignature(parties) {
  return parties
    .map((p) => (p.hasPoa && p.poaName ? p.poaName : p.name))
    .filter(Boolean)
    .map((name) => `<<Name:>> ${name}  <<Signature:>> ${SIGNATURE_LINE}\u000b<<Date:>>`)
    .join("\n\n");
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
    mou_date: data.agreementDate,
    unit_number: data.unitNumber,
    selling_price: money(data.sellingPrice),
    selling_price_words: amountToWords(data.sellingPrice),
    payment_term: PAYMENT_TERMS[ca.paymentTerm],
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
  const title = sanitizeFileName(
    ["Commission Agreement", data.projectName, data.unitNumber, r.payer_name].filter(Boolean).join(" - "),
  );
  return { templateId, title, replacements: r, flags: { payer_is_company: isCompany }, fees, data, ca };
}
