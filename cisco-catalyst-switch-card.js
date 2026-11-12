
// ---- switch-layout.js ----
function shortInterfaceName(name) {
  return String(name??"").replace(
    /^(GigabitEthernet|TenGigabitEthernet|FortyGigabitEthernet|TwentyFiveGigE)(?=\d)/,
    prefix=>({
      GigabitEthernet:"Gi",TenGigabitEthernet:"Te",
      FortyGigabitEthernet:"Fo",TwentyFiveGigE:"Twe",
    })[prefix]
  );
}

const PRIMARY = /^GigabitEthernet1\/0\/(\d+)$/;
const ADDITIONAL = /^GigabitEthernet1\/1\/(\d+)$/;

function classifyPhysicalPort(portOrName) {
  if (portOrName && typeof portOrName === "object" && portOrName.contractVersion === 1) {
    return {
      group: portOrName.physicalGroup || "other",
      position: portOrName.physicalPosition != null ? Number(portOrName.physicalPosition) : null,
    };
  }
  if (portOrName && typeof portOrName === "object" && portOrName.physicalGroup && portOrName.physicalPosition != null) {
    return { group: portOrName.physicalGroup, position: Number(portOrName.physicalPosition) };
  }
  const interfaceName = typeof portOrName === "string" ? portOrName : portOrName?.interfaceName;
  let match = PRIMARY.exec(interfaceName ?? "");
  if (match) { const position=Number(match[1]); if(position>=1&&position<=48)return {group:"primary",position}; }
  match = ADDITIONAL.exec(interfaceName ?? "");
  if (match) { const position=Number(match[1]); if(position>=1&&position<=4)return {group:"additional",position}; }
  return {group:"other",position:null};
}

function groupRank(group) {
  if (group === "primary") return 0;
  if (group === "additional") return 1;
  if (group === "other") return 3;
  return 2;
}

function numericCoordinate(value) {
  const number=Number(value);
  return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
}

function orderPorts(ports) {
  return [...ports].sort((a,b)=>{
    const la=classifyPhysicalPort(a),lb=classifyPhysicalPort(b);
    const rankDifference=groupRank(la.group)-groupRank(lb.group);
    if(rankDifference)return rankDifference;
    if(la.group!==lb.group)return String(la.group).localeCompare(String(lb.group));
    const memberDifference=numericCoordinate(a.member)-numericCoordinate(b.member);
    if(memberDifference)return memberDifference;
    const slotDifference=numericCoordinate(a.slot)-numericCoordinate(b.slot);
    if(slotDifference)return slotDifference;
    const positionDifference=numericCoordinate(la.position)-numericCoordinate(lb.position);
    if(positionDifference)return positionDifference;
    return String(a.interfaceName??"").localeCompare(String(b.interfaceName??""));
  });
}

function physicalPortLabel(port, peers = []) {
  const layout=classifyPhysicalPort(port);
  const position=layout.position ?? port?.port ?? null;
  if(position == null)return port?.interfaceName ?? "?";
  const groupPeers=peers.filter((peer)=>classifyPhysicalPort(peer).group===layout.group);
  const members=new Set(groupPeers.map((peer)=>peer.member).filter((member)=>member!=null).map(String));
  const slots=new Set(groupPeers.map((peer)=>peer.slot).filter((slot)=>slot!=null).map(String));
  if(slots.size>1 && port?.slot!=null){
    if(members.size>1 && port?.member!=null)return `${port.member}/${port.slot}/${position}`;
    return `${port.slot}/${position}`;
  }
  if(members.size>1 && port?.member!=null)return `${port.member}/${position}`;
  return String(position);
}

function physicalGroupColumns(count) {
  const total=Math.max(1,Number(count)||1);
  return {
    wide:Math.min(24,total),
    medium:Math.min(12,total),
    narrow:Math.min(8,total),
    small:Math.min(6,total),
  };
}


// ---- port-model.js ----
const LEGACY_ROLE_MAP = { rx: "rx_bytes", tx: "tx_bytes" };

function inferRole(entity, states = {}) {
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

function buildPortTopology({device, entities, states = {}, contractVersion = null}) {
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
function hydratePort(topology,states) {
  const state=(role)=>{const id=topology.entityIds[role];return id?states[id]:undefined};
  const link=state("link"),speed=state("speed"),errors=state("errors"),description=state("description"),admin=state("admin"),poe=state("poe");
  return {...topology,ifIndex:link?.attributes?.if_index??null,description:cleanState(description?.state)??"",
    linkUp:link?.state==="on"?true:link?.state==="off"?false:null,adminEnabled:admin?.state==="on"?true:admin?.state==="off"?false:null,speed:cleanState(speed?.state),
    portMode:link?.attributes?.port_mode??null,accessVlan:link?.attributes?.access_vlan??null,accessVlanOperational:link?.attributes?.access_vlan_operational??null,nativeVlan:link?.attributes?.native_vlan??null,allowedVlans:link?.attributes?.allowed_vlans??null,
    poeEnabled:poe?.state==="on"?true:poe?.state==="off"?false:link?.attributes?.poe?.enabled??null,poeDetected:poe?.attributes?.device_detected??link?.attributes?.poe?.device_detected??null,
    poeConsumptionW:poe?.attributes?.power_consumption_w??link?.attributes?.poe?.consumption_w??null,poeAllocatedW:poe?.attributes?.power_allocated_w??link?.attributes?.poe?.allocated_power_w??null,
    poeAvailableW:poe?.attributes?.power_available_w??link?.attributes?.poe?.available_power_w??null,poeMaxDrawnW:poe?.attributes?.max_power_drawn_w??link?.attributes?.poe?.max_drawn_w??null,
    rxBytes:cleanState(state("rx_bytes")?.state),txBytes:cleanState(state("tx_bytes")?.state),errors:cleanState(errors?.state),rxDiscards:errors?.attributes?.rx_discards??null,txDiscards:errors?.attributes?.tx_discards??null,
    macAddresses:link?.attributes?.mac_addresses??[],ipAddresses:link?.attributes?.ip_addresses??[],cdpNeighbors:link?.attributes?.cdp_neighbors??[],lldpNeighbors:link?.attributes?.lldp_neighbors??[]};
}
function buildPortModel({device,entities,states,contractVersion=null}){return hydratePort(buildPortTopology({device,entities,states,contractVersion}),states);}


// ---- switch-summary.js ----
function buildSwitchSummary(ports, switchEntities, states) {
  const active = ports.filter((p) => p.linkUp === true).length;
  const disabled = ports.filter((p) => p.adminEnabled === false).length;
  const unknown = ports.filter((p) => p.linkUp == null && p.adminEnabled !== false).length;
  const down = ports.length - active - disabled - unknown;
  const poePorts = ports.filter((p) => p.poeDetected === true).length;
  const poeUsed = ports.reduce((sum, p) => sum + (Number(p.poeConsumptionW) || 0), 0);
  const poeEntityId = Object.entries(switchEntities ?? {}).find(([key]) => key.endsWith("_poe_power_used"))?.[1];
  const poeState = poeEntityId ? states[poeEntityId] : undefined;
  const poeSupported = Boolean(poeEntityId) || ports.some((p) =>
    Boolean(p.entityIds?.poe) ||
    p.poeEnabled != null ||
    p.poeDetected != null ||
    p.poeConsumptionW != null ||
    p.poeAllocatedW != null ||
    p.poeAvailableW != null ||
    p.poeMaxDrawnW != null
  );
  return {
    total: ports.length, active, down, disabled, unknown, poePorts, poeSupported,
    poeUsedW: poeState && Number.isFinite(Number(poeState.state)) ? Number(poeState.state) : poeUsed,
    poeBudgetW: poeState?.attributes?.poe_budget_w ?? null,
    poeRemainingW: poeState?.attributes?.poe_remaining_w ?? null,
  };
}


// ---- entity-discovery.js ----



function isChildOf(device,switchDeviceId){return device.parent_device_id===switchDeviceId||device.via_device_id===switchDeviceId;}
async function loadRegistries(hass){return Promise.all([hass.callWS({type:"config/device_registry/list"}),hass.callWS({type:"config/entity_registry/list"})]);}
function contractMarker(entities,states={},switchDeviceId){return entities.map((e)=>({entity:e,state:states[e.entity_id]})).find(({entity,state})=>entity.device_id===switchDeviceId&&state?.attributes?.cisco_catalyst_role==="switch"&&state.attributes.is_cisco_catalyst_switch===true&&Number(state.attributes.dashboard_contract_version)===1);}
function isContractPort(entities,states={}){return entities.some((e)=>{const a=states[e.entity_id]?.attributes;return a?.is_physical===true&&a.interface_id&&a.cisco_catalyst_role;});}
async function discoverSwitch(hass,switchDeviceId){
  const [devices,entities]=await loadRegistries(hass);const switchDevice=devices.find((d)=>d.id===switchDeviceId);if(!switchDevice)throw new Error(`Switch device ${switchDeviceId} was not found`);
  const entitiesByDevice=new Map();for(const entity of entities){if(!entity.device_id)continue;const bucket=entitiesByDevice.get(entity.device_id)??[];bucket.push(entity);entitiesByDevice.set(entity.device_id,bucket);}
  const states=hass.states??{};const marker=contractMarker(entities,states,switchDeviceId);const contractVersion=marker?1:null;
  const ports=devices.filter((d)=>isChildOf(d,switchDeviceId)).filter((d)=>{const es=entitiesByDevice.get(d.id)??[];return contractVersion===1?isContractPort(es,states):es.some((e)=>(e.unique_id??"").endsWith("_link"));}).map((d)=>buildPortTopology({device:d,entities:entitiesByDevice.get(d.id)??[],states,contractVersion}));
  const switchEntities=Object.fromEntries(entities.filter((e)=>e.device_id===switchDeviceId).map((e)=>[e.unique_id??e.entity_id,e.entity_id]));
  return {switchDevice,ports:orderPorts(ports),switchEntities,contractVersion};
}
function findSwitchCandidates(devices,entities,states={}){
  const contractIds=new Set(entities.filter((e)=>{const a=states[e.entity_id]?.attributes;return a?.cisco_catalyst_role==="switch"&&a.is_cisco_catalyst_switch===true&&Number(a.dashboard_contract_version)===1;}).map((e)=>e.device_id).filter(Boolean));
  const legacyIds=new Set(entities.filter((e)=>(e.unique_id??"").endsWith("_poe_power_used")).map((e)=>e.device_id).filter(Boolean));
  return devices.filter((d)=>contractIds.has(d.id)||legacyIds.has(d.id));
}


// ---- vlan-review-requests.js ----
function vlanReviewRequest(device, port, value) {
  const entries = device?.config_entries;
  if (!Array.isArray(entries) || entries.length !== 1) throw new Error('Switch integration entry must be unique');
  if (!Number.isInteger(port?.ifIndex) || port.ifIndex <= 0 || !port.interfaceName) throw new Error('Physical port identity unavailable');
  if (port.portMode === 'trunk') throw new Error('Only access ports can be reviewed');
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value) || Number(value)>4094) throw new Error('Invalid VLAN ID');
  return {entry_id:entries[0],if_index:port.ifIndex,target_vlan:Number(value),expected_interface_name:port.interfaceName,confirmation_preference:'balanced'};
}


// ---- vlan-review-view-model.js ----
// Pure display model for the integration's read-only VLAN proposal review.
// No service calls, switch writes, or authorization decisions live here.
function vlanReviewViewModel(response) {
  if (!response || typeof response !== "object" || response.read_only !== true || response.authorized !== false || response.can_execute !== false) {
    throw new Error("Untrusted or incomplete VLAN review response");
  }
  const allowed = new Set(["blocked", "confirmation_recommended", "no_additional_confirmation_recommended"]);
  const advice = response.confirmation_advice;
  if (!allowed.has(advice) || (response.status === "blocked" && advice !== "blocked")) {
    throw new Error("Unknown or inconsistent VLAN review result");
  }
  const blockers = Array.isArray(response.blocker_messages) ? response.blocker_messages.filter((s) => typeof s === "string") : [];
  const warnings = Array.isArray(response.warning_messages) ? response.warning_messages.filter((s) => typeof s === "string") : [];
  return {
    title: advice === "blocked" ? "VLAN change cannot proceed" : advice === "confirmation_recommended" ? "Review VLAN change" : "VLAN proposal reviewed",
    interfaceName: typeof response.interface_name === "string" ? response.interface_name : "Unknown interface",
    currentVlan: Number.isInteger(response.current_vlan) ? response.current_vlan : null,
    requestedVlan: Number.isInteger(response.requested_vlan) ? response.requested_vlan : null,
    advice,
    noChange: response.status !== "blocked" && Number.isInteger(response.current_vlan) && response.current_vlan === response.requested_vlan,
    refreshNeeded: advice === "blocked" && Array.isArray(response.blockers) && response.blockers.some((reason) => ["snapshot_too_old", "snapshot_timestamp_unavailable", "coordinator_update_failed", "snapshot_timestamp_in_future"].includes(reason)),
    blockers,
    warnings,
    requiresConfirmation: advice === "confirmation_recommended",
    canExecute: false,
    readOnly: true,
  };
}


// ---- vlan-confirmed-request.js ----
/** Build explicit execution request only for an unchanged, unblocked review. */
function confirmedVlanRequest(reviewRequest, reviewResponse, livePort, selectedValue, acknowledged) {
  if (reviewResponse?.read_only !== true || reviewResponse?.authorized !== false ||
      reviewResponse?.can_execute !== false || reviewResponse?.status !== "requires_operator_review" ||
      !Array.isArray(reviewResponse.blockers) || reviewResponse.blockers.length !== 0) {
    throw new Error("Proposal is not eligible; review again");
  }
  if (!Number.isInteger(reviewResponse.current_vlan) ||
      reviewResponse.current_vlan !== livePort?.accessVlan ||
      reviewResponse.if_index !== reviewRequest.if_index ||
      reviewResponse.interface_name !== reviewRequest.expected_interface_name ||
      reviewResponse.requested_vlan !== reviewRequest.target_vlan ||
      livePort.ifIndex !== reviewRequest.if_index ||
      livePort.interfaceName !== reviewRequest.expected_interface_name ||
      selectedValue !== String(reviewRequest.target_vlan)) {
    throw new Error("Selected port or VLAN changed; review again");
  }
  if (reviewResponse.current_vlan === reviewResponse.requested_vlan) {
    throw new Error("Port is already on the requested VLAN; no change necessary");
  }
  if (acknowledged !== true) throw new Error("Confirm the connectivity warning first");
  return {
    entry_id: reviewRequest.entry_id,
    if_index: reviewRequest.if_index,
    expected_interface_name: reviewRequest.expected_interface_name,
    expected_current_vlan: reviewResponse.current_vlan,
    target_vlan: reviewRequest.target_vlan,
    acknowledged: true,
  };
}


// ---- cisco-catalyst-switch-card.js ----





const DASHBOARD_VERSION = "0.1.24";

class CiscoCatalystSwitchCard extends HTMLElement {
  static getConfigForm() {
    return {
      schema: [
        { name: "switch_device_id", required: true, selector: { device: { filter: [{ integration: "cisco_catalyst", manufacturer: "Cisco" }] } } },
        { name: "title", selector: { text: {} } },
      ],
      computeLabel: (schema) => schema.name === "switch_device_id" ? "Catalyst switch" : "Title",
    };
  }

  static getStubConfig() { return {}; }

  setConfig(config) {
    if (!config.switch_device_id) throw new Error("Select a Cisco Catalyst switch");
    const changed = this.config?.switch_device_id !== config.switch_device_id;
    this.config = config;
    this._renderQueued = false;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (changed) { this.data = undefined; this._load(); }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.data) this._load();
    else if (this.shadowRoot?.getElementById("port-dialog")?.open && this._selectedDeviceId) this.scheduleDialogRefresh();
    else this.scheduleRender();
  }

  scheduleDialogRefresh(force=false, returnFocusControl=null) {
    if (this._dialogRefreshQueued) return;
    this._dialogRefreshQueued = true;
    requestAnimationFrame(() => {
      this._dialogRefreshQueued = false;
      const dialog=this.shadowRoot?.getElementById("port-dialog");
      if (!dialog?.open || !this._selectedDeviceId) return;
      if(this._portEditing&&!force)return;
      const port=this.livePorts().find((p)=>p.deviceId===this._selectedDeviceId);
      if (!port) return;
      const stateKey=JSON.stringify(port);
      if (!force && stateKey===this._dialogStateKey) return;
      const scrollTop=dialog.scrollTop;
      // Focus rule: an async action restores focus to its initiating logical control; unrelated refreshes preserve current focus.
      const focusedControl=returnFocusControl ?? dialog.querySelector(":focus")?.dataset?.control ?? (dialog.querySelector(":focus")?.classList?.contains("close") ? "close" : null);
      this.openPort(this._selectedDeviceId,{preserveDialogState:true});
      dialog.scrollTop=scrollTop;
      if (focusedControl) requestAnimationFrame(()=>focusedControl==="close"?dialog.querySelector(".close")?.focus():dialog.querySelector(`[data-control="${CSS.escape(focusedControl)}"]`)?.focus());
    });
  }

  scheduleRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    requestAnimationFrame(() => {
      this._renderQueued = false;
      if (!this.shadowRoot?.getElementById("port-dialog")?.open && !this.shadowRoot?.activeElement?.matches?.("[data-port]")) this.render();
    });
  }

  async _load() {
    if (!this._hass || !this.config || this._loading) return;
    this._loading = true;
    try {
      this.data = await discoverSwitch(this._hass, this.config.switch_device_id);
      this.render();
    } catch (error) {
      this.renderError(error);
    } finally {
      this._loading = false;
    }
  }

  livePorts() {
    return (this.data?.ports ?? []).map((topology) => hydratePort(topology, this._hass.states));
  }

  render() {
    if (!this.shadowRoot || !this.data || !this._hass) return;
    const ports = this.livePorts();
    const groups = new Map();
    for (const port of ports) {
      const group=classifyPhysicalPort(port).group || "other";
      const bucket=groups.get(group) ?? [];
      bucket.push(port);
      groups.set(group,bucket);
    }
    const summary = buildSwitchSummary(ports, this.data.switchEntities, this._hass.states);
    const title = this.config.title || this.data.switchDevice.name_by_user || this.data.switchDevice.name || "Cisco Catalyst";
    const selected = this._selectedDeviceId;
    const focusedPort = this.shadowRoot.activeElement?.dataset?.port ?? null;
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}ha-card{padding:12px;max-width:100%;overflow:hidden;box-sizing:border-box}.card-body{container-type:inline-size;min-width:0;max-width:100%}h2,h3,h4{margin:0}h3{margin-top:14px;margin-bottom:6px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;opacity:.7}h4{margin:18px 0 8px}
        .header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;min-width:0}.title-wrap{display:flex;align-items:baseline;gap:6px;flex-wrap:nowrap;min-width:0}.title-wrap h2{font-size:18px;white-space:nowrap}.version{font-size:10px;opacity:.65;white-space:nowrap;flex:none}.summary{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;opacity:.85}
        .grid{display:grid;grid-template-columns:repeat(var(--wide-columns,24),minmax(0,1fr));gap:3px;min-width:0;max-width:100%;overflow:hidden}.compact{max-width:620px}
        button.port{font:inherit;text-align:left;background:var(--card-background-color);color:var(--primary-text-color);min-width:0;border:1px solid var(--divider-color);border-radius:5px;padding:4px 5px;cursor:pointer;overflow:hidden;min-height:48px}
        .port:hover{border-color:var(--primary-color)}.port.down{opacity:.5}.port.disabled{opacity:.38}.port.unknown{opacity:.62}.port.up{border-color:color-mix(in srgb,var(--primary-color) 35%,var(--divider-color))}.top{display:flex;justify-content:space-between;gap:4px;align-items:center;font-weight:700;font-size:12px}.status{font-size:10px}.desc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;font-size:10px;line-height:1.15}.meta{display:flex;gap:4px;margin-top:2px;line-height:1.1;font-size:9px}.meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.poe{margin-top:2px;font-size:9px;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.port.down .meta,.port.down .poe,.port.disabled .meta,.port.disabled .poe{display:none}
        #port-config-form{display:grid;gap:10px}#port-config-form label{display:grid;gap:4px}.detail dd input[type="text"],.detail dd select{padding:9px;max-width:100%;box-sizing:border-box;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:6px}#port-config-form label:has(input[type="checkbox"]){display:flex;align-items:center;gap:8px}
        dialog{border:0;border-radius:12px;background:var(--card-background-color);color:var(--primary-text-color);box-shadow:var(--ha-card-box-shadow);max-width:min(560px,92vw);width:100%;max-height:85vh;overflow:auto;padding:16px;box-sizing:border-box}dialog::backdrop{background:rgba(0,0,0,.45)}.detail-section{margin-top:12px}.detail-section h4{margin:14px 0 7px;padding:7px 9px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;opacity:1;background:var(--secondary-background-color,#eee);border-left:3px solid var(--primary-color,#03a9f4);border-radius:3px}.detail{display:grid;grid-template-columns:minmax(110px,.8fr) minmax(0,1.2fr);margin:0}.detail dt,.detail dd{padding:4px 0;border-bottom:1px solid var(--divider-color);font-size:13px;line-height:1.25}.detail dt{opacity:.65}.detail dd{margin:0;text-align:right;overflow-wrap:anywhere}.dialog-header{position:sticky;top:-16px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:-16px -16px 8px;padding:12px 16px 8px;background:var(--card-background-color);border-bottom:1px solid var(--divider-color)}.dialog-header h2{margin:0}.close{flex:none}.actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 4px}.actions button{padding:7px 10px}.control-error{margin:8px 0;padding:8px;border:1px solid var(--error-color);border-radius:6px;color:var(--error-color)}.neighbor{padding:6px 0;border-top:1px solid var(--divider-color);font-size:13px}.empty{opacity:.6}@media (max-width:480px){dialog{width:calc(100vw - 16px);max-width:none;padding:12px}.dialog-header{top:-12px;margin:-12px -12px 8px;padding:10px 12px 7px}.detail{grid-template-columns:minmax(92px,.8fr) minmax(0,1.2fr)}.detail dt,.detail dd{font-size:12px;padding:3px 0}}
        @container (max-width:1400px){.grid{grid-template-columns:repeat(var(--medium-columns,12),minmax(0,1fr))}}@container (max-width:900px){.grid{grid-template-columns:repeat(var(--narrow-columns,8),minmax(0,1fr))}}@container (max-width:620px){.grid{grid-template-columns:repeat(var(--small-columns,6),minmax(0,1fr))}.header{display:block}.summary{margin-top:6px}.detail{grid-template-columns:minmax(92px,.8fr) minmax(0,1.2fr)}}@container (max-width:420px){.grid{grid-template-columns:repeat(var(--small-columns,6),minmax(0,1fr))}}
      </style>
      <ha-card><div class="card-body">
        <div class="header"><div class="title-wrap"><h2>${escapeHtml(title)}</h2><span class="version">v${DASHBOARD_VERSION}</span></div><div class="summary">
          <span>● ${summary.active} active</span><span>○ ${summary.down} down</span><span>⊘ ${summary.disabled} disabled</span>
          ${summary.unknown ? `<span>? ${summary.unknown} unknown</span>` : ""}
          ${summary.poeSupported ? `<span>⚡ ${summary.poePorts} powered · ${formatWatts(summary.poeUsedW)} used${summary.poeBudgetW != null ? ` / ${formatWatts(summary.poeBudgetW)} budget` : ""}</span>` : ""}
        </div></div>
        ${[...groups.entries()].map(([group,groupPorts])=>this.portGroupTemplate(group,groupPorts)).join("")}
        <dialog id="port-dialog"></dialog>
      </div></ha-card>`;
    this.shadowRoot.querySelectorAll("[data-port]").forEach((el)=>{
      el.addEventListener("pointerdown",(event)=>{if(event.button===0)this.openPort(el.dataset.port);});
      el.addEventListener("click",(event)=>{if(event.detail===0)this.openPort(el.dataset.port);});
      el.addEventListener("keydown",(event)=>this.handlePortKeydown(event,el));
    });
    if (selected) this.openPort(selected);
    else if (focusedPort) this.shadowRoot.querySelector(`[data-port="${CSS.escape(focusedPort)}"]`)?.focus();
  }

  portGroupTemplate(group,ports) {
    const label=group==="primary"?"Front-panel ports":group==="additional"?"Additional ports":group==="other"?"Other physical interfaces":`${formatGroupLabel(group)} ports`;
    const compact=group!=="primary" && ports.length<=4;
    const columns=physicalGroupColumns(ports.length);
    const style=`--wide-columns:${columns.wide};--medium-columns:${columns.medium};--narrow-columns:${columns.narrow};--small-columns:${columns.small}`;
    return `<h3>${escapeHtml(label)}</h3><div class="grid${compact?" compact":""}" style="${style}">${ports.map((p)=>this.portTemplate(p,ports)).join("")}</div>`;
  }

  handlePortKeydown(event, current) {
    const key=event.key;
    if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(key)) return;
    const grid=current.closest(".grid");
    if (!grid) return;
    const ports=[...grid.querySelectorAll("[data-port]")];
    if (!ports.length) return;
    const rect=current.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    const tolerance=Math.max(2,rect.height*.25);
    let candidates=[];
    if (key==="Home" || key==="End") {
      if (event.ctrlKey) {
        const sameColumn=ports.map((el)=>{const r=el.getBoundingClientRect();return {el,x:r.left+r.width/2,y:r.top+r.height/2};})
          .filter(({x})=>Math.abs(x-cx)<=Math.max(tolerance,rect.width*.25))
          .sort((a,b)=>a.y-b.y);
        const target=key==="Home"?sameColumn[0]?.el:sameColumn[sameColumn.length-1]?.el;
        if (target && target!==current) { event.preventDefault(); target.focus(); }
        return;
      }
      const sameRow=ports.filter((el)=>Math.abs((el.getBoundingClientRect().top+el.getBoundingClientRect().height/2)-cy)<=tolerance);
      candidates=sameRow.sort((a,b)=>a.getBoundingClientRect().left-b.getBoundingClientRect().left);
      const target=key==="Home"?candidates[0]:candidates[candidates.length-1];
      if (target && target!==current) { event.preventDefault(); target.focus(); }
      return;
    }
    for (const el of ports) {
      if (el===current) continue;
      const r=el.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2;
      if (key==="ArrowLeft" && Math.abs(y-cy)<=tolerance && x<cx) candidates.push({el,primary:cx-x,secondary:Math.abs(y-cy)});
      if (key==="ArrowRight" && Math.abs(y-cy)<=tolerance && x>cx) candidates.push({el,primary:x-cx,secondary:Math.abs(y-cy)});
      if (key==="ArrowUp" && y<cy-tolerance) candidates.push({el,primary:cy-y,secondary:Math.abs(x-cx)});
      if (key==="ArrowDown" && y>cy+tolerance) candidates.push({el,primary:y-cy,secondary:Math.abs(x-cx)});
    }
    candidates.sort((a,b)=>a.primary-b.primary || a.secondary-b.secondary);
    const nearestPrimary=candidates[0]?.primary;
    const target=candidates.filter((c)=>Math.abs(c.primary-nearestPrimary)<=tolerance).sort((a,b)=>a.secondary-b.secondary)[0]?.el;
    if (target) { event.preventDefault(); target.focus(); }
  }

  portTemplate(port,peers=[]) {
    const layout=classifyPhysicalPort(port);
    const status=port.adminEnabled===false?"disabled":port.linkUp===true?"up":port.linkUp===false?"down":"unknown";
    const stateText=status==="disabled"?"DISABLED":status==="down"?"DOWN":status==="unknown"?"UNKNOWN":compactSpeed(port.speed);
    const vlan=port.portMode==="trunk"?`TRK ${port.nativeVlan??"?"}`:port.accessVlan!=null?`VLAN ${port.accessVlan}`:"";
    const draw=Number(port.poeConsumptionW);
    const poe=draw>0?`⚡ ${formatWatts(port.poeConsumptionW)}`:port.poeDetected===true?"⚡ Powered":"";
    const label=port.description||port.deviceDisplayName||shortInterfaceName(port.interfaceName);
    return `<button class="port ${status}" data-port="${escapeHtml(port.deviceId)}" title="${escapeHtml(`${port.interfaceName}${label?` · ${label}`:""}`)}"><div class="top"><span>${escapeHtml(physicalPortLabel(port,peers))}</span><span class="status">${status==="up"?"●":status==="disabled"?"⊘":status==="down"?"○":"?"}</span></div><div class="desc">${escapeHtml(label)}</div><div class="meta"><span>${escapeHtml(stateText)}</span><span>${escapeHtml(vlan)}</span></div><div class="poe">${escapeHtml(poe)}</div></button>`;
  }

  async savePortConfiguration(port) {
    const dialog=this.shadowRoot?.getElementById("port-dialog");
    const form=dialog?.querySelector("#port-config-form");
    if(!form||this._portSaveBusy)return;
    const status=dialog.querySelector("#port-config-status");
    const fresh=this.livePorts().find(p=>p.deviceId===port.deviceId);
    if(!fresh || fresh.accessVlan!==port.accessVlan || fresh.description!==port.description){
      status.textContent="Port changed while editing. Cancel and reopen before retrying.";return;
    }
    const newDescription=form.elements.description?.value??port.description;
    if(newDescription===port.description){
      this._portEditing=false;this.openPort(port.deviceId,{preserveDialogState:true});return;
    }
    this._portSaveBusy=true;
    form.querySelector('[type="submit"]').disabled=true;
    try {
      await this._hass.callService("text","set_value",{
        entity_id:port.entityIds.description,value:newDescription
      });
      this._portEditing=false;
      this.scheduleDialogRefresh(true);
    }catch(error){
      status.textContent="Description update not confirmed. Check current switch value before retrying. "+(error?.message||error);
      form.querySelector('[type="submit"]').disabled=false;
    }finally{this._portSaveBusy=false;}
  }
  openPort(deviceId,{preserveDialogState=false}={}) {
    const port=this.livePorts().find((p)=>p.deviceId===deviceId); if(!port)return;
    this._selectedDeviceId=deviceId;
    this._dialogStateKey=JSON.stringify(port);
    const dialog=this.shadowRoot.getElementById("port-dialog"); if(!dialog)return;
    const linkRows=[
      ["Interface",shortInterfaceName(port.interfaceName)],["Description",port.description||"—"],["Link",port.linkUp===true?"Up":port.linkUp===false?"Down":"Unknown"],["Administrative",port.adminEnabled===false?"Disabled":port.adminEnabled===true?"Enabled":"Unknown"],["Negotiated",port.speed??"—"]
    ];
    const networkRows=[["Mode",port.portMode??"—"]];
    if(port.portMode==="trunk"){networkRows.push(["Native VLAN",port.nativeVlan??"—"],["Allowed VLANs",formatList(port.allowedVlans)]);}
    else if(port.accessVlan!=null) networkRows.push(["Access VLAN",port.accessVlan]);
    const poeRows=[
      ["PoE status",port.poeEnabled===true?"Enabled":port.poeEnabled===false?"Disabled":"—"],
      ["Powered device",port.poeDetected==null?"—":port.poeDetected?"Yes":"No"],
      ["Consumption",port.poeConsumptionW==null?"—":formatWatts(port.poeConsumptionW)],
      ["Allocated",port.poeAllocatedW==null?"—":formatWatts(port.poeAllocatedW)],
      ["Available",port.poeAvailableW==null?"—":formatWatts(port.poeAvailableW)],
      ["Maximum observed",port.poeMaxDrawnW==null?"—":formatWatts(port.poeMaxDrawnW)]
    ];
    const trafficRows=[
      ["RX",formatBytes(port.rxBytes)],["TX",formatBytes(port.txBytes)],["Errors",port.errors??"—"],["Discards",`${port.rxDiscards??"—"} RX / ${port.txDiscards??"—"} TX`],["MACs",formatList(port.macAddresses)],["Learned endpoint IPs",formatList(port.ipAddresses)],["CDP neighbor IPs",formatList([...new Set((port.cdpNeighbors??[]).map(n=>n.address).filter(Boolean))])],["Observed port IPs",formatList([...new Set([...(port.ipAddresses??[]),...(port.cdpNeighbors??[]).map(n=>n.address).filter(Boolean)])])]
    ];
    const pending=this._controlPendingEntities??new Set();
    const controls=[
      port.entityIds.admin ? `<button data-control="admin" ${port.adminEnabled==null||pending.has(port.entityIds.admin)?"disabled":""}>${pending.has(port.entityIds.admin)?"Working…":port.adminEnabled===false?"Enable port":port.adminEnabled===true?"Disable port":"Port state unavailable"}</button>`:"",
      port.entityIds.poe ? `<button data-control="poe" ${port.poeEnabled==null||pending.has(port.entityIds.poe)?"disabled":""}>${pending.has(port.entityIds.poe)?"Working…":port.poeEnabled===false?"Enable PoE":port.poeEnabled===true?"Disable PoE":"PoE state unavailable"}</button>`:""
    ].join("");
    const vlanEntity=port.entityIds.access_vlan;
    const descriptionEntity=port.entityIds.description;
    const canEdit=Boolean(descriptionEntity);
    const vlanOptions=vlanEntity?(this._hass.states[vlanEntity]?.attributes?.options||[]):[];
    const editForm=canEdit&&this._portEditing?`<section class="detail-section">
      <form id="port-config-form">
        <div class="actions"><button type="submit" disabled>Save description</button><button type="button" data-control="cancel-edit">Cancel</button></div>
      </form><div id="port-config-status" role="status" aria-live="polite"></div></section>`:"";
    const editButton=canEdit&&!this._portEditing?'<button type="button" data-control="edit-config">Edit description</button>':"";
    const vlanState=vlanEntity?this._hass.states[vlanEntity]:null;
    const canChangeVlan=port.portMode!=="trunk"&&vlanEntity&&vlanState&&
      !["unavailable","unknown"].includes(vlanState.state)&&vlanOptions.length>0;
    const accessVlanForm=canChangeVlan&&!this._portEditing?`<section class="detail-section"><h4>Change access VLAN</h4>
      <label>Access VLAN <select id="access-vlan-id" data-control="access-vlan">${vlanOptions.map(value=>
        `<option value="${escapeHtml(value)}" ${String(value)===String(port.accessVlan)?"selected":""}>${escapeHtml(value)}</option>`
      ).join("")}</select></label>
      <div id="access-vlan-status" role="status" aria-live="polite"></div></section>`:"";
    const inactiveVlanNotice=port.portMode==="access"&&port.accessVlan!=null&&port.accessVlanOperational===false
      ?`<section class="detail-section"><h4>Inactive access VLAN</h4><p>VLAN ${escapeHtml(port.accessVlan)} is not operational. Standard VLAN reassignment is unavailable. Review recovery in <a href="/cisco-catalyst-vlan">VLAN Management</a>. Recovery may interrupt connected equipment.</p></section>`:"";
    const section=(title,rows)=>{
      const inlineField=(key,value)=>{
        if(!this._portEditing)return escapeHtml(value);
        if(title==="Link"&&key==="Description"&&descriptionEntity)
          return `<input form="port-config-form" name="description" type="text" maxlength="64" value="${escapeHtml(port.description)}">`;
        return escapeHtml(value);
      };
      const visible=rows.filter(([key,value])=>
        (this._portEditing&&title==="Link"&&key==="Description"&&descriptionEntity)||
        (value!==null&&value!==undefined&&value!==""&&value!=="—"));
      return visible.length?`<section class="detail-section"><h4>${escapeHtml(title)}</h4>
        <dl class="detail">${visible.map(([key,value])=>
          `<dt>${escapeHtml(key)}</dt><dd>${inlineField(key,value)}</dd>`).join("")}</dl></section>`:"";
    };
    const peers=this.livePorts().filter((candidate)=>classifyPhysicalPort(candidate).group===classifyPhysicalPort(port).group);
    dialog.innerHTML=`<div class="dialog-header"><h2>Port ${escapeHtml(physicalPortLabel(port,peers))}</h2><button class="close">Close</button></div><div class="actions">${controls}${editButton}</div>${section("Link",linkRows)}${editForm}${section("Network",networkRows)}${inactiveVlanNotice}${accessVlanForm}${section("PoE",poeRows)}${section("Traffic",trafficRows)}${this.downstreamTemplate(port)}`;
    const closeDialog=()=>{const returnPort=this._selectedDeviceId;this._selectedDeviceId=null;this._dialogStateKey=null;this._portEditing=false;dialog.close();this.render();if(returnPort)requestAnimationFrame(()=>this.shadowRoot.querySelector(`[data-port="${CSS.escape(returnPort)}"]`)?.focus());};
    dialog.querySelector(".close").onclick=closeDialog;
    dialog.onkeydown=(event)=>{
      if(event.key==="Escape"){event.preventDefault();closeDialog();return;}
      if(!["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"].includes(event.key))return;
      if(["BUTTON","INPUT","SELECT","TEXTAREA"].includes(event.target?.tagName) && !event.target?.classList?.contains("close"))return;
      const max=Math.max(0,dialog.scrollHeight-dialog.clientHeight);
      if(max<=0)return;
      event.preventDefault();
      const line=Math.max(40,Math.round(dialog.clientHeight*.12));
      const page=Math.max(80,Math.round(dialog.clientHeight*.85));
      if(event.key==="ArrowUp")dialog.scrollBy({top:-line,behavior:"smooth"});
      else if(event.key==="ArrowDown")dialog.scrollBy({top:line,behavior:"smooth"});
      else if(event.key==="PageUp")dialog.scrollBy({top:-page,behavior:"smooth"});
      else if(event.key==="PageDown")dialog.scrollBy({top:page,behavior:"smooth"});
      else if(event.key==="Home")dialog.scrollTo({top:0,behavior:"smooth"});
      else if(event.key==="End")dialog.scrollTo({top:max,behavior:"smooth"});
    };
    dialog.querySelector('[data-control="admin"]')?.addEventListener("click",()=>this.toggleEntity(port.entityIds.admin,port.adminEnabled,"admin"));
    dialog.querySelector('[data-control="poe"]')?.addEventListener("click",()=>this.toggleEntity(port.entityIds.poe,port.poeEnabled,"poe"));
    dialog.querySelector("#access-vlan-id")?.addEventListener("change",(event)=>this.changeAccessVlan(port,event.target.value));
    dialog.querySelector('[data-control="edit-config"]')?.addEventListener("click",()=>{
      this._portEditing=true;this.openPort(port.deviceId,{preserveDialogState:true});
    });
    dialog.querySelector('[data-control="cancel-edit"]')?.addEventListener("click",()=>{
      this._portEditing=false;this.openPort(port.deviceId,{preserveDialogState:true});
    });
    const configForm=dialog.querySelector("#port-config-form");
    if(configForm){
      const saveButton=configForm.querySelector('[type="submit"]');
      const updateSaveAvailability=()=>{
        const description=configForm.elements.description;
        const descriptionChanged=Boolean(description)&&description.value!==port.description;
        saveButton.disabled=Boolean(this._portSaveBusy)||!descriptionChanged;
      };
      const description=configForm.elements.description;
      description?.addEventListener("input",updateSaveAvailability);
      description?.addEventListener("change",updateSaveAvailability);
      updateSaveAvailability();
      configForm.addEventListener("submit",event=>{
        event.preventDefault();if(!saveButton.disabled)this.savePortConfiguration(port);
      });
    }
    if(!dialog.open) dialog.showModal();
    if(!preserveDialogState) requestAnimationFrame(()=>dialog.querySelector(".close")?.focus());
  }

  downstreamTemplate(port) {
    const cdp=port.cdpNeighbors.map((n)=>`<div class="neighbor"><strong>${escapeHtml(n.device_id||"CDP neighbor")}</strong><br>${escapeHtml([n.address,n.port_id,n.platform].filter(Boolean).join(" · "))}</div>`).join("");
    const lldp=port.lldpNeighbors.map((n)=>`<div class="neighbor"><strong>${escapeHtml(n.system_name||"LLDP neighbor")}</strong><br>${escapeHtml([n.chassis_id,n.port_id,n.port_description].filter(Boolean).join(" · "))}</div>`).join("");
    return `<h4>Downstream discovery</h4>${cdp||lldp ? `${cdp}${lldp}` : '<div class="empty">No CDP/LLDP neighbors reported.</div>'}`;
  }

  async changeAccessVlan(port, selectedVlan) {
    const dialog=this.shadowRoot?.getElementById("port-dialog");
    const selector=dialog?.querySelector("#access-vlan-id");
    const output=dialog?.querySelector("#access-vlan-status");
    const entityId=port.entityIds.access_vlan;
    if(!selector||!output||!entityId)return;
    if(selectedVlan===String(port.accessVlan))return;
    const entity=this._hass.states[entityId];
    const fresh=this.livePorts().find(p=>p.deviceId===port.deviceId);
    if(!entity||["unavailable","unknown"].includes(entity.state)||
       !entity.attributes?.options?.map(String).includes(selectedVlan)||
       !fresh||fresh.ifIndex!==port.ifIndex||fresh.interfaceName!==port.interfaceName||
       fresh.accessVlan!==port.accessVlan||fresh.portMode==="trunk") {
      selector.value=String(port.accessVlan);
      output.textContent="Port or VLAN availability changed; refresh and select again.";
      return;
    }
    selector.disabled=true;
    output.textContent="Changing access VLAN…";
    try {
      await this._hass.callService("select","select_option",{entity_id:entityId,option:selectedVlan});
      if(dialog.open&&this._selectedDeviceId===port.deviceId)
        output.textContent="Access VLAN change confirmed by the Integration.";
    } catch(error) {
      if(dialog.open&&this._selectedDeviceId===port.deviceId) {
        selector.value=String(port.accessVlan);
        output.textContent="VLAN change not confirmed: "+(error?.message||error)+
          ". Check the actual switch state before retrying.";
      }
    } finally {
      if(dialog.open&&this._selectedDeviceId===port.deviceId)selector.disabled=false;
    }
  }

  async toggleEntity(entityId,currentState,returnFocusControl=null) {
    if(!entityId || typeof currentState!=="boolean")return;
    const pending=this._controlPendingEntities??=new Set();
    if(pending.has(entityId))return;
    const service=currentState===false?"turn_on":"turn_off";
    pending.add(entityId);
    if(this._selectedDeviceId)this.openPort(this._selectedDeviceId,{preserveDialogState:true});
    let timer;
    let controlError=null;
    try {
      await Promise.race([
        this._hass.callService("switch",service,{entity_id:entityId}),
        new Promise((_,reject)=>{
          timer=setTimeout(()=>reject(new Error("Service call is taking too long. The command may still complete; check the Home Assistant entity state before trying again.")),20000);
        }),
      ]);
    } catch (error) {
      controlError=error;
    } finally {
      clearTimeout(timer);
      pending.delete(entityId);
      if(this._selectedDeviceId)this.scheduleDialogRefresh(true,returnFocusControl);
      if(controlError)requestAnimationFrame(()=>this.showControlError(controlError));
    }
  }

  showControlError(error) {
    const dialog=this.shadowRoot?.getElementById("port-dialog");
    if(!dialog)return;
    let box=dialog.querySelector(".control-error");
    if(!box){box=document.createElement("div");box.className="control-error";dialog.prepend(box);}
    box.textContent=`Control failed: ${error?.message||error}`;
  }

  renderError(error){if(this.shadowRoot)this.shadowRoot.innerHTML=`<ha-card><div style="padding:16px"><strong>Cisco Catalyst dashboard error</strong><p>${escapeHtml(error?.message||error)}</p></div></ha-card>`;}
  getCardSize(){return 8} getGridOptions(){return {columns:"full",min_columns:6,rows:8,min_rows:5}}
}
function formatGroupLabel(value){return String(value??"").replace(/[_-]+/g," ").replace(/\b\w/g,(c)=>c.toUpperCase())||"Other";}
function compactSpeed(v){if(!v)return"—";if(String(v).startsWith("N/A"))return"—";return v;}
function formatList(v){return Array.isArray(v)?(v.join(", ")||"—"):(v??"—");}
function formatWatts(v){const n=Number(v);return Number.isFinite(n)?`${n.toFixed(n<10?1:0)} W`:"—";}
function formatBytes(v){const n=Number(v);if(!Number.isFinite(n)||n<0)return"—";const units=["B","KiB","MiB","GiB","TiB"];let value=n,index=0;while(value>=1024&&index<units.length-1){value/=1024;index++;}return `${value.toFixed(index===0?0:value<10?1:0)} ${units[index]}`;}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}
// Private development and stable/HACS installations must not compete for the same custom element.
const CARD_ELEMENT = DASHBOARD_VERSION.includes("-dev.") ? "cisco-catalyst-switch-card-dev" : "cisco-catalyst-switch-card";
if(!customElements.get(CARD_ELEMENT))customElements.define(CARD_ELEMENT,CiscoCatalystSwitchCard);
window.customCards=window.customCards||[];if(!window.customCards.some((card)=>card.type===CARD_ELEMENT))window.customCards.push({type:CARD_ELEMENT,name:CARD_ELEMENT.endsWith("-dev")?"Cisco Catalyst Switch Card (Development)":"Cisco Catalyst Switch Card",description:`Physical port dashboard for Cisco Catalyst switches (v${DASHBOARD_VERSION})`,documentationURL:"https://github.com/WhoaLookAtThat/HA-Cisco-Catalyst-Dashboard"});

