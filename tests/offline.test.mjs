import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("service worker usa cache offline e preserva caches de outras aplicações", async () => {
  const source = await readFile(
    new URL("../web/sw.js", import.meta.url),
    "utf8",
  );
  const listeners = {};
  const deleted = [];
  let assets = [];
  let claimed = false;
  const cached = { text: "cached response" };
  const context = {
    URL,
    self: {
      location: { origin: "https://example.test" },
      addEventListener: (name, handler) => {
        listeners[name] = handler;
      },
      skipWaiting: async () => {},
      clients: {
        claim: async () => {
          claimed = true;
        },
      },
    },
    caches: {
      open: async () => ({
        addAll: async (list) => {
          assets = list;
        },
      }),
      keys: async () => [
        "subnet-ipv4-v0",
        "subnet-ipv4-v1.0.0",
        "other-application",
      ],
      delete: async (key) => {
        deleted.push(key);
      },
      match: async (request) =>
        request.url.endsWith("/app.js") ? cached : null,
    },
    fetch: async () => {
      throw new Error("offline");
    },
  };
  vm.runInNewContext(source, context);
  let pending;
  listeners.install({
    waitUntil: (promise) => {
      pending = promise;
    },
  });
  await pending;
  assert.ok(assets.includes("./app.js"));
  listeners.activate({
    waitUntil: (promise) => {
      pending = promise;
    },
  });
  await pending;
  assert.equal(claimed, true);
  assert.deepEqual(deleted, ["subnet-ipv4-v0"]);
  listeners.fetch({
    request: { method: "GET", url: "https://example.test/app.js" },
    respondWith: (promise) => {
      pending = promise;
    },
  });
  assert.equal(await pending, cached);
  let intercepted = false;
  listeners.fetch({
    request: { method: "GET", url: "https://external.test/app.js" },
    respondWith: () => {
      intercepted = true;
    },
  });
  assert.equal(intercepted, false);
});
