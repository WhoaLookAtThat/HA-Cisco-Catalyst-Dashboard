import test from "node:test";
import assert from "node:assert/strict";
import { buildSwitchSummary } from "../src/switch-summary.js";

test("summarizes port state and PoE",()=>{
  const ports=[{linkUp:true,adminEnabled:true,poeDetected:true,poeConsumptionW:4.2,entityIds:{poe:"switch.p1_poe"}},{linkUp:false,adminEnabled:true,poeDetected:false},{linkUp:false,adminEnabled:false,poeDetected:false},{linkUp:null,adminEnabled:null,poeDetected:null}];
  const states={"sensor.poe":{state:"4.2",attributes:{poe_budget_w:390,poe_remaining_w:385.8}}};
  const s=buildSwitchSummary(ports,{"host_poe_power_used":"sensor.poe"},states);
  assert.equal(s.active,1);assert.equal(s.down,1);assert.equal(s.disabled,1);assert.equal(s.unknown,1);assert.equal(s.poeBudgetW,390);assert.equal(s.poeSupported,true);
});

test("non-PoE switches do not advertise PoE support",()=>{
  const ports=[{linkUp:true,adminEnabled:true,entityIds:{}},{linkUp:false,adminEnabled:true,entityIds:{}}];
  const s=buildSwitchSummary(ports,{}, {});
  assert.equal(s.poeSupported,false);
  assert.equal(s.poePorts,0);
  assert.equal(s.poeUsedW,0);
});
