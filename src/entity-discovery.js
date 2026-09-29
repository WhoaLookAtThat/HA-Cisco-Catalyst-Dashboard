import { buildPortTopology } from "./port-model.js";
import { orderPorts } from "./switch-layout.js";

function isChildOf(device,switchDeviceId){return device.parent_device_id===switchDeviceId||device.via_device_id===switchDeviceId;}
export async function loadRegistries(hass){return Promise.all([hass.callWS({type:"config/device_registry/list"}),hass.callWS({type:"config/entity_registry/list"})]);}
function contractMarker(entities,states={},switchDeviceId){return entities.map((e)=>({entity:e,state:states[e.entity_id]})).find(({entity,state})=>entity.device_id===switchDeviceId&&state?.attributes?.cisco_catalyst_role==="switch"&&state.attributes.is_cisco_catalyst_switch===true&&Number(state.attributes.dashboard_contract_version)===1);}
function isContractPort(entities,states={}){return entities.some((e)=>{const a=states[e.entity_id]?.attributes;return a?.is_physical===true&&a.interface_id&&a.cisco_catalyst_role;});}
export async function discoverSwitch(hass,switchDeviceId){
  const [devices,entities]=await loadRegistries(hass);const switchDevice=devices.find((d)=>d.id===switchDeviceId);if(!switchDevice)throw new Error(`Switch device ${switchDeviceId} was not found`);
  const entitiesByDevice=new Map();for(const entity of entities){if(!entity.device_id)continue;const bucket=entitiesByDevice.get(entity.device_id)??[];bucket.push(entity);entitiesByDevice.set(entity.device_id,bucket);}
  const states=hass.states??{};const marker=contractMarker(entities,states,switchDeviceId);const contractVersion=marker?1:null;
  const ports=devices.filter((d)=>isChildOf(d,switchDeviceId)).filter((d)=>{const es=entitiesByDevice.get(d.id)??[];return contractVersion===1?isContractPort(es,states):es.some((e)=>(e.unique_id??"").endsWith("_link"));}).map((d)=>buildPortTopology({device:d,entities:entitiesByDevice.get(d.id)??[],states,contractVersion}));
  const switchEntities=Object.fromEntries(entities.filter((e)=>e.device_id===switchDeviceId).map((e)=>[e.unique_id??e.entity_id,e.entity_id]));
  return {switchDevice,ports:orderPorts(ports),switchEntities,contractVersion};
}
export function findSwitchCandidates(devices,entities,states={}){
  const contractIds=new Set(entities.filter((e)=>{const a=states[e.entity_id]?.attributes;return a?.cisco_catalyst_role==="switch"&&a.is_cisco_catalyst_switch===true&&Number(a.dashboard_contract_version)===1;}).map((e)=>e.device_id).filter(Boolean));
  const legacyIds=new Set(entities.filter((e)=>(e.unique_id??"").endsWith("_poe_power_used")).map((e)=>e.device_id).filter(Boolean));
  return devices.filter((d)=>contractIds.has(d.id)||legacyIds.has(d.id));
}
