import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import vm from "node:vm";

test("formulário, validação, colagem CIDR, histórico e casos especiais", async () => {
  const html = await readFile(
    new URL("../web/index.html", import.meta.url),
    "utf8",
  );
  const dom = new JSDOM(html, {
    url: "https://example.test/subnetting-calculator/",
  });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: window.navigator,
  });
  await import("../web/app.js");
  const $ = (id) => window.document.getElementById(id);
  const submit = () =>
    $("network-form").dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
  const set = (ip, prefix) => {
    ip.split(".").forEach((value, i) => {
      $(`octet-${i}`).value = value;
    });
    $("prefix").value = prefix;
    submit();
  };
  assert.equal($("network-address").textContent, "192.168.10.128");
  assert.equal($("hosts").textContent, "62");
  set("192.168.1.4", "31");
  assert.equal($("first-host").textContent, "192.168.1.4");
  assert.equal($("last-host").textContent, "192.168.1.5");
  assert.equal($("broadcast").textContent, "Não se aplica");
  set("255.255.255.255", "32");
  assert.equal($("hosts").textContent, "1");
  assert.equal($("binary").querySelectorAll(".host").length, 0);
  set("1.2.3.4", "0");
  assert.equal($("total").textContent, "4.294.967.296");
  assert.equal($("binary").querySelectorAll(".host").length, 32);
  set("01.2.3.4", "24");
  assert.equal($("ip-error").hidden, false);
  assert.equal($("copy").disabled, true);
  set("1.2.3.4", "33");
  assert.equal($("prefix-error").hidden, false);
  set("1.2.3.4", "");
  assert.equal($("prefix-error").hidden, false);
  $("reset").click();
  assert.equal($("empty-state").hidden, false);
  assert.equal($("octet-0").value, "");
  const paste = new window.Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(paste, "clipboardData", {
    value: { getData: () => "10.172.201.15/12" },
  });
  $("octet-0").dispatchEvent(paste);
  assert.equal($("prefix").value, "12");
  submit();
  assert.equal($("network-address").textContent, "10.160.0.0");
  assert.equal($("mask").textContent, "255.240.0.0");
  assert.ok($("history-list").children.length > 0);
  $("clear-history").click();
  assert.equal($("history-list").children.length, 0);
  $("octet-0").value = "25";
  $("octet-0").setSelectionRange(2, 2);
  const bad = new window.InputEvent("beforeinput", {
    data: "6",
    inputType: "insertText",
    cancelable: true,
  });
  $("octet-0").dispatchEvent(bad);
  assert.equal(bad.defaultPrevented, true);
  const dot = new window.KeyboardEvent("keydown", {
    key: ".",
    cancelable: true,
  });
  $("octet-0").dispatchEvent(dot);
  assert.equal(window.document.activeElement, $("octet-1"));
  assert.equal($("binary").querySelectorAll(".bit").length, 32);
  dom.window.close();
});

test("todos os arquivos offline e ícones do manifesto existem", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../web/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  );
  const sw = await readFile(new URL("../web/sw.js", import.meta.url), "utf8");
  const assets = vm.runInNewContext(sw + '\nASSETS', { self: { addEventListener() {} } });
  for (const asset of assets) {
    const file = await readFile(
      new URL(
        `../web/${asset === "./" ? "index.html" : asset}`,
        import.meta.url,
      ),
    );
    assert.ok(file.length > 0, asset);
  }
  for (const icon of manifest.icons) {
    const bytes = await readFile(
      new URL(`../web/${icon.src}`, import.meta.url),
    );
    const [width, height] = icon.sizes.split("x").map(Number);
    assert.equal(bytes.readUInt32BE(16), width);
    assert.equal(bytes.readUInt32BE(20), height);
  }
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
});
