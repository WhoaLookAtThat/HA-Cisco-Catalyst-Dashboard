const LEGACY_ROLE_MAP = { rx: "rx_bytes", tx: "tx_bytes" };

export function inferRole(entity, states = {}) {
  const explicit = states[entity.entity_id]?.attributes?.cisco_catalyst_role;
  if (explicit) return explicit === "poe" && !entity.entity_id.startsWith("switch.") ? null : explicit;
  const id = entity.unique_id ?? "";
  if (id.endsWith("_link")) return "link";
  if (id.endsWith("_speed")) return "speed";
  if (id.endsWith("_rx_bytes")) return "rx_bytes";
  if (id.endsWith("_tx_bytes")) return "tx_bytes";
  if (id.endsWith("_errors")) return "errors";
  if (id.endsWith("_admin")) return "admin";
  if (id.endsWith("_description")) return "description";
  if (entity.entity_id.startsWith("switch.") && id.includes("_poe_")) return "poe";
  return null;
}

export function buildPortTopology({device, entities, states = {}, contractVersion = null}) {
  const byRole = Object.fromEntries(entities.map((e) => [inferRole(e, states), e]).filter(([role]) => role));
  const metadataSource = contractVersion === 1
    ? entities.map((e) => states[e.entity_id]).find((s) => s?.attributes?.is_physical === true && s.attributes.interface_id)
    : null;
  const metadata = metadataSource?.attributes ?? {};
  return {
    deviceId: device.id,
    interfaceId: metadata.interface_id ?? null,
    interfaceName: metadata.interface_name ?? device.name ?? "",
    deviceDisplayName: device.name_by_user ?? device.name ?? "",
    physicalGroup: metadata.physical_group ?? null,
    physicalPosition: metadata.physical_position ?? null,
    member: metadata.member ?? metadata.physical_member ?? null,
    slot: metadata.slot ?? metadata.physical_slot ?? null,
    port: metadata.port ?? metadata.physical_port ?? null,
    contractVersion,
    entityIds: Object.fromEntries(Object.entries(byRole).map(([role,e]) => [LEGACY_ROLE_MAP[role] ?? role, e.entity_id])),
  };
}

function cleanState(v){return v==null||v==="unknown"||v==="unavailable"?null:v;}
export function hydratePort(topology,states) {
  const state=(role)=>{const id=topology.entityIds[role];return id?states[id]:undefined};
  const link=state("link"),speed=state("speed"),errors=state("errors"),description=state("description"),admin=state("admin"),poe=state("poe");
  return {...topology,ifIndex:link?.attributes?.if_index??null,description:cleanState(description?.state)??"",
    linkUp:link?.state==="on"?true:link?.state==="off"?false:null,adminEnabled:admin?.state==="on"?true:admin?.state==="off"?false:null,speed:cleanState(speed?.state),
    portMode:link?.attributes?.port_mode??null,accessVlan:link?.attributes?.access_vlan??null,nativeVlan:link?.attributes?.native_vlan??null,allowedVlans:link?.attributes?.allowed_vlans??null,
    poeEnabled:poe?.state==="on"?true:poe?.state==="off"?false:link?.attributes?.poe?.enabled??null,poeDetected:poe?.attributes?.device_detected??link?.attributes?.poe?.device_detected??null,
    poeConsumptionW:poe?.attributes?.power_consumption_w??link?.attributes?.poe?.consumption_w??null,poeAllocatedW:poe?.attributes?.power_allocated_w??link?.attributes?.poe?.allocated_power_w??null,
    poeAvailableW:poe?.attributes?.power_available_w??link?.attributes?.poe?.available_power_w??null,poeMaxDrawnW:poe?.attributes?.max_power_drawn_w??link?.attributes?.poe?.max_drawn_w??null,
    rxBytes:cleanState(state("rx_bytes")?.state),txBytes:cleanState(state("tx_bytes")?.state),errors:cleanState(errors?.state),rxDiscards:errors?.attributes?.rx_discards??null,txDiscards:errors?.attributes?.tx_discards??null,
    macAddresses:link?.attributes?.mac_addresses??[],ipAddresses:link?.attributes?.ip_addresses??[],cdpNeighbors:link?.attributes?.cdp_neighbors??[],lldpNeighbors:link?.attributes?.lldp_neighbors??[]};
}
export function buildPortModel({device,entities,states,contractVersion=null}){return hydratePort(buildPortTopology({device,entities,states,contractVersion}),states);}
