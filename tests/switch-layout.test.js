import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { classifyPhysicalPort, orderPorts, physicalPortLabel, physicalGroupColumns } from "../src/switch-layout.js";

test("classifies 48 primary ports in the legacy compatibility path", () => {
  assert.deepEqual(classifyPhysicalPort("GigabitEthernet1/0/1"), {group:"primary",position:1});
  assert.deepEqual(classifyPhysicalPort("GigabitEthernet1/0/48"), {group:"primary",position:48});
});
test("classifies four additional ports in the legacy compatibility path", () => {
  assert.deepEqual(classifyPhysicalPort("GigabitEthernet1/1/4"), {group:"additional",position:4});
});
test("keeps legacy physical order", () => {
  const result=orderPorts([{interfaceName:"GigabitEthernet1/1/1"},{interfaceName:"GigabitEthernet1/0/2"},{interfaceName:"GigabitEthernet1/0/1"}]);
  assert.deepEqual(result.map(x=>x.interfaceName),["GigabitEthernet1/0/1","GigabitEthernet1/0/2","GigabitEthernet1/1/1"]);
});

test("contract v1 physical metadata supports smaller primary layouts without name parsing",()=>{
  const ports=[
    {interfaceName:"renamed-24",physicalGroup:"primary",physicalPosition:24},
    {interfaceName:"renamed-1",physicalGroup:"primary",physicalPosition:1},
  ];
  assert.deepEqual(orderPorts(ports).map(p=>p.interfaceName),["renamed-1","renamed-24"]);
});

test("contract v1 preserves and deterministically orders arbitrary physical groups",()=>{
  const ports=[
    {interfaceName:"uplink-b",physicalGroup:"uplink",physicalPosition:2,member:1},
    {interfaceName:"uplink-a",physicalGroup:"uplink",physicalPosition:1,member:1},
    {interfaceName:"stack-b",physicalGroup:"stack",physicalPosition:1,member:2},
    {interfaceName:"stack-a",physicalGroup:"stack",physicalPosition:1,member:1},
    {interfaceName:"primary",physicalGroup:"primary",physicalPosition:1,member:1},
    {interfaceName:"additional",physicalGroup:"additional",physicalPosition:1,member:1},
  ];
  assert.deepEqual(orderPorts(ports).map(p=>p.interfaceName),["primary","additional","stack-a","stack-b","uplink-a","uplink-b"]);
});

test("dashboard card keeps valid section sizing and responsive physical layouts", async () => {
  const source = await readFile("src/cisco-catalyst-switch-card.js", "utf8");
  assert.ok(source.includes("getGridOptions(){return {columns:\"full\",min_columns:6,rows:8,min_rows:5}}"));
  assert.ok(source.includes(".grid{display:grid;grid-template-columns:repeat(var(--wide-columns,24),minmax(0,1fr))"));
  assert.ok(source.includes(".compact{max-width:620px}"));
  assert.ok(source.includes("@container (max-width:620px){.grid{grid-template-columns:repeat(var(--small-columns,6),minmax(0,1fr))"));
  assert.ok(source.includes("[...groups.entries()].map(([group,groupPorts])=>this.portGroupTemplate(group,groupPorts))"));
});

test("contract v1 physical metadata overrides interface-name parsing",()=>{const port={interfaceName:"Renamed interface",physicalGroup:"additional",physicalPosition:3};assert.deepEqual(classifyPhysicalPort(port),{group:"additional",position:3});assert.deepEqual(orderPorts([{interfaceName:"x",physicalGroup:"additional",physicalPosition:2},{interfaceName:"y",physicalGroup:"primary",physicalPosition:48}]).map(p=>p.interfaceName),["y","x"]);});

test("stacked groups show member and position when positions repeat across members",()=>{
  const peers=[
    {interfaceName:"member1-port1",physicalGroup:"primary",physicalPosition:1,member:1},
    {interfaceName:"member2-port1",physicalGroup:"primary",physicalPosition:1,member:2},
  ];
  assert.equal(physicalPortLabel(peers[0],peers),"1/1");
  assert.equal(physicalPortLabel(peers[1],peers),"2/1");
});

test("single-member groups keep compact position labels",()=>{
  const peers=[
    {interfaceName:"port1",physicalGroup:"primary",physicalPosition:1,member:1},
    {interfaceName:"port2",physicalGroup:"primary",physicalPosition:2,member:1},
  ];
  assert.equal(physicalPortLabel(peers[0],peers),"1");
});

test("physical grid columns scale down for smaller models while preserving 48-port baseline",()=>{
  assert.deepEqual(physicalGroupColumns(48),{wide:24,medium:12,narrow:8,small:6});
  assert.deepEqual(physicalGroupColumns(24),{wide:24,medium:12,narrow:8,small:6});
  assert.deepEqual(physicalGroupColumns(12),{wide:12,medium:12,narrow:8,small:6});
  assert.deepEqual(physicalGroupColumns(4),{wide:4,medium:4,narrow:4,small:4});
});

test("contract v1 orders multiple physical slots within a member",()=>{
  const ports=[
    {interfaceName:"slot2-port1",physicalGroup:"additional",physicalPosition:1,member:1,slot:2,port:1},
    {interfaceName:"slot1-port2",physicalGroup:"additional",physicalPosition:2,member:1,slot:1,port:2},
    {interfaceName:"slot1-port1",physicalGroup:"additional",physicalPosition:1,member:1,slot:1,port:1},
  ];
  assert.deepEqual(orderPorts(ports).map(p=>p.interfaceName),["slot1-port1","slot1-port2","slot2-port1"]);
  assert.equal(physicalPortLabel(ports[0],ports),"2/1");
  assert.equal(physicalPortLabel(ports[2],ports),"1/1");
});

test("contract v1 disambiguates member slot and position when both vary",()=>{
  const peers=[
    {interfaceName:"m1s1p1",physicalGroup:"additional",physicalPosition:1,member:1,slot:1,port:1},
    {interfaceName:"m2s2p1",physicalGroup:"additional",physicalPosition:1,member:2,slot:2,port:1},
  ];
  assert.equal(physicalPortLabel(peers[0],peers),"1/1/1");
  assert.equal(physicalPortLabel(peers[1],peers),"2/2/1");
});

test("contract v1 never falls back to legacy interface-name parsing when layout metadata is incomplete",()=>{
  const port={
    interfaceName:"GigabitEthernet1/0/7",
    physicalGroup:"unknown",
    physicalPosition:null,
    contractVersion:1,
  };
  assert.deepEqual(classifyPhysicalPort(port),{group:"unknown",position:null});
});

test("legacy compatibility path still parses interface names when no contract version is present",()=>{
  const port={interfaceName:"GigabitEthernet1/0/7",contractVersion:null};
  assert.deepEqual(classifyPhysicalPort(port),{group:"primary",position:7});
});
