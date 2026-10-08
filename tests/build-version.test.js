import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("distributed bundle version matches package version", async () => {
  const pkg=JSON.parse(await readFile("package.json","utf8"));
  const bundle=await readFile("cisco-catalyst-switch-card.js","utf8");
  assert.match(bundle,new RegExp(`const DASHBOARD_VERSION = ["']${pkg.version}["'];`));
  assert.ok(!bundle.includes("__DASHBOARD_VERSION__"));
});
