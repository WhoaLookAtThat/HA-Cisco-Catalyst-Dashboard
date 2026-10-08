import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { classifyPhysicalPort, orderPorts } from "../src/switch-layout.js";

test("classifies 48 primary ports", () => {
  assert.deepEqual(classifyPhysicalPort("GigabitEthernet1/0/1"), {group:"primary",position:1});
  assert.deepEqual(classifyPhysicalPort("GigabitEthernet1/0/48"), {group:"primary",position:48});
});
test("classifies four additional ports", () => {
  assert.deepEqual(classifyPhysicalPort("GigabitEthernet1/1/4"), {group:"additional",position:4});
});
test("keeps physical order", () => {
  const result=orderPorts([{interfaceName:"GigabitEthernet1/1/1"},{interfaceName:"GigabitEthernet1/0/2"},{interfaceName:"GigabitEthernet1/0/1"}]);
  assert.deepEqual(result.map(x=>x.interfaceName),["GigabitEthernet1/0/1","GigabitEthernet1/0/2","GigabitEthernet1/1/1"]);
});

test("dashboard card keeps valid section sizing and responsive physical layouts", async () => {
  const source = await readFile("src/cisco-catalyst-switch-card.js", "utf8");
  assert.ok(source.includes("getGridOptions(){return {columns:\"full\",min_columns:6,rows:8,min_rows:5}}"));
  assert.ok(source.includes(".grid{display:grid;grid-template-columns:repeat(24,minmax(0,1fr))"));
  assert.ok(source.includes("@container (max-width:620px){.grid{grid-template-columns:repeat(6,minmax(0,1fr))"));
});


test("contract v1 physical metadata overrides interface-name parsing",()=>{const port={interfaceName:"Renamed interface",physicalGroup:"additional",physicalPosition:3};assert.deepEqual(classifyPhysicalPort(port),{group:"additional",position:3});assert.deepEqual(orderPorts([{interfaceName:"x",physicalGroup:"additional",physicalPosition:2},{interfaceName:"y",physicalGroup:"primary",physicalPosition:48}]).map(p=>p.interfaceName),["y","x"]);});
