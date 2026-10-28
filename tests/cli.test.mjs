import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const run = (args) =>
  spawnSync(process.env.PYTHON || "python", ["main.py", ...args], {
    encoding: "utf8",
  });
test("CLI JSON, detalhes e erros de argumentos", () => {
  const success = run(["--ip", "192.168.10.130", "--prefix", "26", "--json"]);
  assert.equal(success.status, 0, success.stderr);
  const result = JSON.parse(success.stdout);
  assert.equal(result.network, "192.168.10.128");
  assert.equal(result.classification, "Host utilizável");
  const details = run(["--ip", "1.2.3.4", "--prefix", "32", "--details"]);
  assert.equal(details.status, 0);
  assert.match(details.stdout, /CÁLCULOS DETALHADOS/);
  for (const args of [
    ["--ip", "1.2.3"],
    ["--json"],
    ["--ip", "256.0.0.1", "--prefix", "24"],
    ["--ip", "1.2.3.4", "--prefix", "33"],
  ]) {
    const result = run(args);
    assert.equal(result.status, 2);
    assert.ok(result.stderr.length > 0);
  }
});

test("menu permite detalhes, repetição e saída com entrada redirecionada", () => {
  const result = spawnSync(process.env.PYTHON || "python", ["main.py"], {
    input: "1.2.3.4\n24\n2\n1\n10.0.0.1\n31\n0\n",
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Host utilizável/);
  assert.match(result.stdout, /Host ponto a ponto/);
  assert.match(result.stdout, /Bits de rede: 24/);
});
