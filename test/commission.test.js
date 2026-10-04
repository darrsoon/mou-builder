import test from "node:test";
import assert from "node:assert/strict";
import { buildCommission, validateCommission } from "../lib/mou/commission.js";
import { COMMISSION_TEMPLATES } from "../lib/mou/config.js";

const PB = { name: "PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", position: "Manager",
  representative: "Mikhail Slobodchikov", license: "CN-6410679", address: "Office 6, Ar Raha 8 St, MUSAFFAH, Abu Dhabi, 20335" };
const base = {
  agreementDate: "29/11/2026", unitNumber: "Manarat-B1-01-00", projectName: "Manarat Living", sellingPrice: "1,000,000",
  sellers: [{ salutation: "Mr.", name: "Petr Petrov", nationality: "Egyptian", passport: "A1", eid: "784-1", ownershipPercent: "100" }],
  buyers: [{ salutation: "Ms.", name: "Anna Ivanova", ownershipPercent: "100" }],
};

test("Commission: Продавец платит одному агентству, 2,1% по умолчанию", () => {
  const b = buildCommission({ ...base, caAgencies: [PB] });
  assert.equal(b.templateId, COMMISSION_TEMPLATES.oneAgency);
  assert.equal(b.replacements.agency1_fee, "21,000");
  assert.equal(b.replacements.agency1_fee_words, "Twenty-one thousand dirhams");
  assert.equal(b.replacements.payer_role, "Seller");
  assert.equal(b.replacements.payer_name, "Petr Petrov");
  assert.match(b.replacements.ca_date, /^\d{2}\/\d{2}\/\d{4}$/); // пусто — сегодня
  assert.notEqual(b.replacements.ca_date, "29/11/2026");
  assert.equal(buildCommission({ ...base, caDate: "05/12/2026", caAgencies: [PB] }).replacements.ca_date, "05/12/2026");
  assert.equal(b.replacements.mou_date, "29/11/2026");
  assert.equal(buildCommission({ ...base, caDate: "05/12/2026", caAgencies: [PB] }).replacements.ca_date_header, "5 December, 2026");
  assert.equal(b.replacements.payment_term, "full on the day of transfer");
  assert.equal(b.flags.payer_is_company, false);
  assert.equal(b.replacements.first_party_signature, "<<Name:>> Petr Petrov   <<Signature:>> ________________\u000b<<Date:>>");
  assert.equal(b.replacements.second_party_signature,
    "<<Name:>> Mikhail Slobodchikov   <<Signature:>> ________________\u000b<<Date:>>\u000b<<Company Stamp>>");
});

test("Commission: Покупатель, два агентства, сумма вручную, срок 2 дня", () => {
  const b = buildCommission({ ...base, caPayer: "Buyer", caPaymentTerm: "two_days",
    caAgencies: [{ ...PB, name: "OTHER REAL ESTATE", fee: "23,625" }, PB] });
  assert.equal(b.templateId, COMMISSION_TEMPLATES.twoAgencies);
  assert.equal(b.replacements.payer_name, "Anna Ivanova");
  assert.equal(b.replacements.agency1_fee, "23,625");
  assert.equal(b.replacements.agency2_fee, "21,000");
  assert.equal(b.replacements.payment_term, "full within 2 (two) business days following the Transfer Date");
  const five = buildCommission({ ...base, caPaymentTerm: "within_days", caPaymentDays: "5", caAgencies: [PB] });
  assert.equal(five.replacements.payment_term, "full within 5 (five) business days following the Transfer Date");
  assert.ok(b.replacements.third_party_signature);
});

test("Commission: компания платит компании — одно агентство, без роли Seller/Buyer", () => {
  const b = buildCommission({ ...base, caPayer: "Company", caPayerCompany: { ...PB, name: "OTHER REAL ESTATE", license: "#CN-1" },
    caAgencies: [PB, PB] });
  assert.equal(b.templateId, COMMISSION_TEMPLATES.oneAgency);
  assert.equal(b.flags.payer_is_company, true);
  assert.match(b.replacements.payer_party_block, /^<<OTHER REAL ESTATE>>, represented by the Manager Mikhail Slobodchikov, authorized by the Economic license #CN-1,/);
  assert.match(b.replacements.first_party_signature, /<<Company Stamp>>/);
});

test("Commission: проверка обязательных полей", () => {
  assert.equal(validateCommission({ ...base, caAgencies: [PB] }).ok, true);
  const bad = validateCommission({ ...base, unitNumber: "", caAgencies: [{ name: "" }] });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => e.includes("Unit Number")));
});

test("Имена файлов: «<договор> <юнит>»", async () => {
  const { buildDraftTitle, normalizeForm } = await import("../lib/mou/core.js");
  const { MOU_TEMPLATES } = await import("../lib/mou/config.js");
  const data = normalizeForm({ unitNumber: "Manarat-B1-01-00" });
  assert.equal(buildDraftTitle(data, MOU_TEMPLATES[0]), "Off-plan Memorandum of Understanding (MOU) Manarat-B1-01-00");
  assert.equal(buildCommission({ ...base, caAgencies: [PB] }).title, "Commission Agreement Manarat-B1-01-00");
});
