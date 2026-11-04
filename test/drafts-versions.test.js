// Load Draft: один и тот же договор, созданный ещё раз, — «(v2)», «(v3)»… (Алина, 04.11.2026)
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) return { url: new URL(`${specifier.slice(2)}.js`, ROOT).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
const { readDrafts } = await import("../lib/google/sheets.js");

const HEAD = ["Date Created ", "Agreement Date", "Project", "Unit Number", "Seller", "Buyer", "Selling Price ", "Google Doc Link", "Form JSON", "Document"];
const row = (date, unit, kind = "") => [date, "", "C3 Garden Residence", unit, "LUCKY HOLDING - F.Z.E", "Sameh Abdalla", "", "", "{}", kind];
const sheets = (values) => ({ spreadsheets: { values: { get: async () => ({ data: { values } }) } } });

test("версии черновиков: (v2) у повторного MOU, соглашения считаются отдельно, новые сверху", async () => {
  const drafts = await readDrafts(sheets([HEAD,
    row("04.11.2026, 11:10:06", "113"),
    row("04.11.2026, 11:12:00", "113", "Commission Agreement"),
    row("04.11.2026, 11:15:30", "113"),
    row("04.11.2026, 11:16:00", "112"),
  ]));
  assert.deepEqual(drafts.map((d) => d.label), [
    "04.11.2026, 11:16:00 | C3 Garden Residence | 112 | LUCKY HOLDING - F.Z.E | Sameh Abdalla",
    "04.11.2026, 11:15:30 | C3 Garden Residence | 113 | LUCKY HOLDING - F.Z.E | Sameh Abdalla (v2)",
    "04.11.2026, 11:12:00 | C3 Garden Residence | 113 | LUCKY HOLDING - F.Z.E | Sameh Abdalla | Commission Agreement",
    "04.11.2026, 11:10:06 | C3 Garden Residence | 113 | LUCKY HOLDING - F.Z.E | Sameh Abdalla",
  ]);
});
