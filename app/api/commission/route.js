import { getGoogleClients, jsonError } from "@/lib/google/client";
import { createMouDocument } from "@/lib/google/docs";
import { appendDraftLog, syncAgents } from "@/lib/google/sheets";
import { buildCommission, validateCommission } from "@/lib/mou/commission";
import { getMainPartyName } from "@/lib/mou/core";
import { money } from "@/lib/mou/helpers";

// Commission Agreement к MOU: та же форма, свой шаблон (7 или 8), тот же движок v2.
export async function POST(request) {
  try {
    const form = await request.json();
    const validation = validateCommission(form);
    if (!validation.ok) {
      return Response.json({ ok: false, error: validation.errors.join("\n"), validation }, { status: 422 });
    }
    const { drive, docs, sheets } = await getGoogleClients();
    const built = buildCommission(form);
    const document = await createMouDocument({
      engine: "v2",
      drive,
      docs,
      title: built.title,
      data: {},
      rules: [],
      replacements: built.replacements,
      flags: built.flags,
      templateId: built.templateId,
      // как в MOU: всё, что вставлено из формы, — жёлтым (Даша, 07.10.2026)
      highlightValues: true,
      // логотип — свой выбор в разделе Commission Agreement (Алина, 08.10.2026)
      withoutLogo: form.caWithLogo === "No",
    });

    await appendDraftLog(sheets, {
      agreementDate: built.ca.date,
      projectName: built.data.projectName,
      unitNumber: built.data.unitNumber,
      sellerName: getMainPartyName(built.data.sellers),
      buyerName: getMainPartyName(built.data.buyers),
      sellingPrice: money(built.data.sellingPrice),
      docUrl: document.url,
      formJson: JSON.stringify(form || {}),
    });

    // новые агентства / представители (и компания-плательщик) — в AGENTS; сбой договор не отменяет
    const agents = await syncAgents(sheets, [
      ...built.ca.agencies,
      ...(built.ca.payer === "Company" ? [built.ca.payerCompany] : []),
    ]).catch((error) => ({ error: error.message }));

    return Response.json({
      ok: true,
      agents,
      title: document.title,
      url: document.url,
      remainingPlaceholders: document.remainingPlaceholders,
    });
  } catch (error) {
    return jsonError(error);
  }
}
