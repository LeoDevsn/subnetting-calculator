import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  calculate,
  validateIP,
  validatePrefix,
  formatResult,
} from "../web/calculator.js";

test("JavaScript e Python concordam em todos os prefixos e extremos", () => {
  const cases = [];
  let state = 42;
  for (let prefix = 0; prefix <= 32; prefix++) {
    for (const ip of [
      "0.0.0.0",
      "255.255.255.255",
      "192.168.10.130",
      "10.172.201.15",
      "128.0.0.0",
    ])
      cases.push([ip, prefix]);
    for (let i = 0; i < 12; i++) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      cases.push([
        [24, 16, 8, 0].map((shift) => (state >>> shift) & 255).join("."),
        prefix,
      ]);
    }
  }
  const reference = spawnSync(
    process.env.PYTHON || "python",
    [
      "-c",
      "import json,sys; from ipv4calc import calculate; print(json.dumps([calculate(*case).as_dict() for case in json.load(sys.stdin)]))",
    ],
    {
      input: JSON.stringify(cases),
      encoding: "utf8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  assert.equal(reference.status, 0, reference.stderr);
  const expected = JSON.parse(reference.stdout);
  cases.forEach(([ip, prefix], index) =>
    assert.deepEqual(calculate(ip, prefix), expected[index], `${ip}/${prefix}`),
  );
});

test("entradas inválidas, zeros à esquerda e Unicode", () => {
  for (const ip of [
    "",
    "1.2.3",
    "1.2.3.4.5",
    "256.1.1.1",
    "01.2.3.4",
    "1..3.4",
    "１.2.3.4",
    "1e2.2.3.4",
    "1.2.3.4/24",
    null,
  ])
    assert.throws(() => validateIP(ip));
  for (const prefix of [
    "",
    "/",
    "//24",
    "-1",
    "33",
    "1.5",
    "２４",
    null,
    true,
    "+24",
  ])
    assert.throws(() => validatePrefix(prefix));
  assert.equal(validatePrefix(" /24 "), 24);
});

test("exportação legível e regras especiais", () => {
  assert.match(
    formatResult(calculate("192.168.10.130", 26)),
    /Primeiro host: 192.168.10.129/,
  );
  assert.match(
    formatResult(calculate("1.2.3.4", 31)),
    /Broadcast: Não se aplica/,
  );
  assert.equal(calculate("255.255.255.255", 0).total, 4294967296);
  assert.equal(calculate("255.255.255.255", 32).hosts, 1);
});
