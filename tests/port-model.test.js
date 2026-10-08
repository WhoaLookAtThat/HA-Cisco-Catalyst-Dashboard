import test from "node:test";
import assert from "node:assert/strict";
import { buildPortModel } from "../src/port-model.js";

test("normalizes a port without depending on entity_id naming", () => {
  const entities=[
    {entity_id:"binary_sensor.renamed",unique_id:"host_10101_link"},
    {entity_id:"sensor.anything",unique_id:"host_10101_speed"},
    {entity_id:"switch.user_name",unique_id:"host_if_10101_admin"},
  ];
  const states={
    "binary_sensor.renamed":{state:"on",attributes:{if_index:10101,access_vlan:20,port_mode:"access"}},
    "sensor.anything":{state:"1G",attributes:{}},
    "switch.user_name":{state:"on",attributes:{}},
  };
  const p=buildPortModel({device:{id:"d1",name:"GigabitEthernet1/0/1"},entities,states});
  assert.equal(p.ifIndex,10101); assert.equal(p.linkUp,true); assert.equal(p.speed,"1G"); assert.equal(p.accessVlan,20);
});


test("a user-renamed child device does not change physical port layout identity", () => {
  const p=buildPortModel({device:{id:"d1",name:"GigabitEthernet1/0/17",name_by_user:"Living room AP"},entities:[],states:{}});
  assert.equal(p.interfaceName,"GigabitEthernet1/0/17");
  assert.equal(p.deviceDisplayName,"Living room AP");
});


test("contract v1 uses explicit roles and physical metadata instead of unique_id/device naming", () => {
  const entities=[{entity_id:"binary_sensor.renamed",unique_id:"totally_unrelated"},{entity_id:"sensor.rx_renamed",unique_id:"also_unrelated"}];
  const states={
    "binary_sensor.renamed":{state:"on",attributes:{cisco_catalyst_role:"link",interface_id:"if-10101",interface_name:"GigabitEthernet1/0/1",is_physical:true,physical_group:"primary",physical_position:1,member:1,slot:0,port:1,if_index:10101}},
    "sensor.rx_renamed":{state:"123",attributes:{cisco_catalyst_role:"rx_bytes",interface_id:"if-10101",interface_name:"GigabitEthernet1/0/1",is_physical:true,physical_group:"primary",physical_position:1}},
  };
  const p=buildPortModel({device:{id:"d1",name:"User visible nonsense",name_by_user:"Kitchen AP"},entities,states,contractVersion:1});
  assert.equal(p.interfaceId,"if-10101"); assert.equal(p.interfaceName,"GigabitEthernet1/0/1"); assert.equal(p.physicalGroup,"primary"); assert.equal(p.physicalPosition,1); assert.equal(p.rxBytes,"123"); assert.equal(p.linkUp,true);
});
