import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("port dialog uses compact grouped detail sections", async () => {
  const source=await readFile("src/cisco-catalyst-switch-card.js","utf8");
  assert.match(source,/section\("Link",linkRows\)/);
  assert.match(source,/section\("Network",networkRows\)/);
  assert.match(source,/section\("PoE",poeRows\)/);
  assert.match(source,/section\("Traffic",trafficRows\)/);
  assert.match(source,/\.dialog-header\{position:sticky/);
  assert.match(source,/class="dialog-header"/);
  assert.match(source,/@media \(max-width:480px\)/);
  assert.match(source,/visible=rows\.filter/);
});
