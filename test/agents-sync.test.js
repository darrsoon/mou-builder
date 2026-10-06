// syncAgents: новые агентства и представители из формы — во вкладку AGENTS (06.10.2026).
// Таблица — массив в памяти; колонки в порядке, как сейчас у Даши (Agent, License, Position,
// Representative, Address).
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
const { syncAgents, readAgents } = await import("../lib/google/sheets.js");

function fakeSheets(rows) {
  const table = rows.map((r) => [...r]);
  const colIndex = (letter) => letter.charCodeAt(0) - 65;
  return {
    table,
    spreadsheets: {
      values: {
        get: async () => ({ data: { values: table } }),
        append: async ({ requestBody }) => { table.push(...requestBody.values); },
        batchUpdate: async ({ requestBody }) => {
          for (const { range, values } of requestBody.data) {
            const [, letter, row] = range.match(/!([A-Z])(\d+)$/);
            table[Number(row) - 1][colIndex(letter)] = values[0][0];
          }
        },
      },
    },
  };
}

const HEAD = ["Agent", "License", "Position", "Representative", "Address"];
const PB = ["PRIME BRIDGE REAL ESTATE BROKERAGE - L.L.C - S.P.C", "#CN-6410679", "Manager", "Mikhail Slobodchikov", "Office 6, Ar Raha 8 St"];

test("новое агентство — новая строка", async () => {
  const sheets = fakeSheets([HEAD, PB]);
  const res = await syncAgents(sheets, [{ name: "NEW REALTY", representative: "Anna Smith", position: "Director", license: "CN-1", address: "Yas" }]);
  assert.deepEqual(res, { added: 1, updated: 0 });
  assert.deepEqual(sheets.table[2], ["NEW REALTY", "CN-1", "Director", "Anna Smith", "Yas"]);
});

test("новый представитель известного агентства — отдельная строка, справочник отдаёт обоих", async () => {
  const sheets = fakeSheets([HEAD, PB]);
  await syncAgents(sheets, [{ name: PB[0], representative: "Platon Medvedev", position: "Manager", license: "CN-6410679", address: PB[4] }]);
  assert.equal(sheets.table.length, 3);
  const agents = await readAgents(sheets);
  assert.deepEqual(agents.map((a) => a.representative), ["Mikhail Slobodchikov", "Platon Medvedev"]);
});

test("тот же представитель — ничего не добавляем; правка лицензии/адреса/должности — обновляем", async () => {
  const sheets = fakeSheets([HEAD, PB]);
  assert.deepEqual(await syncAgents(sheets, [{ name: PB[0], representative: "Mikhail Slobodchikov", position: "Manager", license: "CN-6410679", address: PB[4] }]), { added: 0, updated: 0 });
  const res = await syncAgents(sheets, [{ name: PB[0], representative: "mikhail slobodchikov", position: "General Manager", license: "CN-6410679", address: "Office 7" }]);
  assert.deepEqual(res, { added: 0, updated: 2 });
  assert.deepEqual(sheets.table[1], [PB[0], "#CN-6410679", "General Manager", "Mikhail Slobodchikov", "Office 7"]);
});

test("пустые поля формы таблицу не затирают", async () => {
  const sheets = fakeSheets([HEAD, PB]);
  assert.deepEqual(await syncAgents(sheets, [{ name: PB[0], representative: "Mikhail Slobodchikov" }]), { added: 0, updated: 0 });
  assert.deepEqual(sheets.table[1], PB);
});
