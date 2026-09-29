# Network Management and Intelligence — Shared Design Note

This document is a **cross-repository design note** shared by the dashboard and integration projects.

The concise project sequence now lives in [ROADMAP.md](ROADMAP.md). Detailed project-specific ideas live under [docs/roadmap/](roadmap/) so this shared design note can focus on cross-cutting architecture, vocabulary, and research questions rather than accumulating implementation detail for every project.

It describes possible future Cisco Catalyst capabilities beyond the current port dashboard. It is deliberately not an implementation commitment: individual capabilities must be validated against the supported Catalyst models, IOS/IOS-XE versions, available management transports, and the Home Assistant integration architecture before implementation.

## Repository boundaries

- **Dashboard:** `WhoaLookAtThat/HA-Cisco-Catalyst-Dashboard`
- **Integration:** `WhoaLookAtThat/HA-Cisco-Catalyst`
- **Durable infrastructure inventory:** an external authoritative inventory system; it is intentionally outside this dashboard repository.

The integration should own communication with/configuration of Cisco equipment and expose stable data/actions/events to Home Assistant. The dashboard should consume that contract and provide presentation and user controls. Durable knowledge such as known physical assets/network identities should not become mutable dashboard-local state.

## A. VLAN management

Potential integration capabilities:

- Enumerate VLAN ID, name, and status.
- Create VLANs.
- Rename VLANs.
- Delete VLANs.
- Change a port's access VLAN.
- Configure trunk mode, native VLAN, and allowed VLANs.
- Show VLAN membership/participating ports.

The dashboard could later provide a VLAN-management view over these integration services.

### Safety requirements

Configuration writes can disrupt management connectivity. VLAN management should therefore include validation and safeguards. Operations capable of disconnecting Home Assistant, removing a management VLAN, or otherwise isolating the switch require stronger protection than ordinary per-port changes.

Prefer bounded, explicit integration operations over sending arbitrary CLI from the dashboard. Investigate transactional/rollback-aware approaches where supported.

## B. DHCP and address-binding information

First determine **where DHCP authority actually resides**. The fact that a Catalyst can provide DHCP services does not mean DHCP should be migrated to it.

Treat these as separate capabilities:

### DHCP server management

If a supported switch is intentionally acting as the DHCP server, potential integration capabilities include inventory and management of relevant DHCP pools/configuration.

### DHCP snooping / device tracking

Potentially useful even when another router/firewall/server provides DHCP.

The important derived relationship is:

**MAC ↔ IP ↔ VLAN ↔ physical switch port**

Where supported, Cisco device-tracking information may provide additional IPv4/IPv6 host presence/location evidence.

This information should be exposed semantically by the integration so consumers do not need to parse CLI output.

## C. New-device detection and notification

### Wired devices

Where hardwired device attachment is relatively rare, a newly observed wired device can be a high-value event.

Potential event path:

**MAC learned / link event → integration → Home Assistant event/entity → automation → notification/alarm**

Useful event data may include:

- Switch and interface.
- Physical port/chassis position.
- MAC address.
- VLAN.
- IP address when known.
- Port description.
- First-seen/last-seen time.
- Link state/change.
- PoE state/draw.
- CDP/LLDP identity when available.
- Whether the identity is known, unknown, or correlated with a known asset.

Possible future opt-in responses include quarantine or disabling a port. Automatic disruptive responses must not be the default.

### Wi-Fi devices and private/random MAC addresses

The wired switch alone is not necessarily the best authority for wireless-client identity. Prefer AP/controller association information when available and correlate it with switch observations.

Do not assume a MAC address is a permanent device identity. Modern clients may use private/random MAC addresses. Identity correlation may use multiple observations, where available:

- Previously observed private MAC on this network.
- DHCP hostname/client information.
- IP/address history.
- VLAN.
- AP/controller association data.
- Home Assistant presence/device information.
- mDNS/Bonjour or other service information.
- Historical behavioral/topological observations.

Any inferred identity must preserve uncertainty. Distinguish, for example:

- **Known network identity**
- **Likely/correlated known device**
- **Unknown identity**

Do not silently convert probabilistic correlation into a certain identity.

## D. Network knowledge derived from switch observations

Individual switch observations become substantially more useful when correlated.

| Observation | Potential derived knowledge |
| --- | --- |
| MAC newly learned on an access port | Device connected or became active |
| MAC disappeared | Device disconnected, moved, or aged out |
| MAC moved between ports | Physical/topology change or unusual switching behavior |
| Link transition plus MAC event | Strong evidence of physical plug/unplug |
| PoE 0 → powered | PoE device connected/booting |
| Material PoE draw change | Reboot, operational change, or possible fault |
| New CDP/LLDP neighbor | Infrastructure/device identity or topology change |
| MAC plus DHCP/device tracking | MAC ↔ IP ↔ VLAN ↔ port correlation |
| Increasing errors/discards | Cabling, physical-layer, congestion, or endpoint problem requiring investigation |
| Repeated link flaps | Unstable cable/device/power/connection |
| Negotiated speed unexpectedly drops | Possible cable/device/negotiation problem |
| Unexpected VLAN/port state | Configuration drift |
| Multiple MACs appear on a normally single-host port | Downstream switch/AP/bridge/virtualization or unexpected equipment |
| MAC population changes sharply | Possible topology/loop/network-expansion anomaly |

These are **derived interpretations**, not all equivalent to direct switch facts. The integration/data model should retain the underlying observations and confidence/provenance needed to explain a derived event.

### Example correlation

A combination such as:

**Gi1/0/27 link up + PoE starts drawing power + new MAC learned + DHCP/device-tracking binding + LLDP/CDP identity**

can support a much richer event than “port 27 is up,” potentially describing the attached device, address, VLAN, physical location, and power state.

Likewise:

**port remains up + previously known MAC disappears + unknown MAC appears**

has a different meaning and may warrant a higher-priority notification.

### Topology-aware movement and anomaly semantics

MAC movement should not be treated as inherently suspicious. The same Layer-2 observation can have very different meanings depending on the known topology and the type of port involved.

Examples:

- A wireless client's MAC moving between switch ports that feed different access points may be ordinary roaming.
- A MAC moving between two user-facing access ports may indicate physical repatching or device movement.
- A MAC appearing behind a known downstream switch, AP, bridge, hypervisor, or other multi-host device is not proof that the endpoint is directly cabled to the Catalyst port.
- The same MAC rapidly alternating between unrelated access ports may indicate a loop, duplicate identity, unstable downstream topology, or another condition worth investigation.
- A normally single-host access port suddenly learning many MAC addresses may indicate a newly attached downstream switch/bridge, virtualization host, or unexpected equipment.

The system should therefore distinguish at least these concepts:

1. **Switch observation** — for example, MAC `aa:bb:cc:dd:ee:ff` is currently learned through interface X.
2. **Attachment interpretation** — for example, the MAC is likely directly attached, likely downstream of known infrastructure, or attachment type is unknown.
3. **Movement event** — the learned path changed from one switch interface to another.
4. **Anomaly interpretation** — the movement or population change is inconsistent with the expected topology or recent history.

The underlying observation must always remain available even when the interpretation is uncertain.

#### Port/topology expectations

Future intelligence may benefit from optional expectations about a port or downstream path, for example:

- normally single-host access port;
- known AP/uplink/downstream-switch port where many endpoint MACs are expected;
- infrastructure port where CDP/LLDP neighbor identity is expected;
- intentionally unused/quiet port;
- management-critical path where disruptive automation must be prohibited or heavily guarded.

These expectations should not be hard-coded from interface names or dashboard layout. They should come from durable infrastructure knowledge, integration-observed neighbor data, or explicit configuration with clear provenance.

#### Movement classification

A future movement classifier could use evidence such as:

- source and destination interfaces;
- port mode/VLAN;
- known downstream infrastructure on either port;
- CDP/LLDP neighbors;
- AP/controller association data;
- link transitions near the movement time;
- first-seen/last-seen timestamps;
- movement frequency within a rolling time window;
- whether multiple MACs moved together;
- DHCP/device-tracking evidence;
- durable inventory correlation.

Potential interpretations include:

- **Expected roaming/movement**
- **Likely physical repatch**
- **Downstream topology change**
- **Rapid MAC flapping**
- **Unexpected multi-host attachment**
- **Unknown / insufficient evidence**

These are interpretation labels, not direct switch facts. Any event should retain the observations and reasoning inputs that produced the label.

#### Debounce, history, and thresholds

Topology intelligence requires history rather than reacting to every raw table change.

Future implementation should consider:

- minimum persistence before declaring departure;
- MAC aging behavior versus real disconnect;
- debounce windows around link up/down;
- suppression of duplicate learn/remove events during one physical transition;
- rolling movement counts and time windows for flap detection;
- per-port baselines for normal MAC population;
- grouped movement, where many MACs moving together suggests an infrastructure-path change rather than many independent endpoint moves;
- restart/reload behavior so integration startup does not generate a storm of false "new device" events.

The goal is to emit fewer, higher-quality semantic events while retaining enough raw evidence for diagnostics.

#### Example topology-aware interpretations

**Wireless roam**

A client MAC moves from the switch port feeding AP-A to the switch port feeding AP-B, while the Wi-Fi controller reports the corresponding association move. This should normally be treated as expected roaming rather than an anomaly.

**Physical repatch**

A previously stable wired-device MAC disappears from one single-host access port, a nearby link-down occurs, and shortly afterward the same MAC appears on another single-host access port with a link-up event. This can support a "likely physical move/repatch" interpretation.

**Possible loop or instability**

The same MAC alternates repeatedly between two unrelated access ports over a short period without corroborating AP/controller roaming evidence. This may warrant a higher-priority `port_anomaly` event with the movement history attached.

**Downstream infrastructure change**

A large set of MAC addresses moves together from one known infrastructure port to another. Treating those as dozens of independent endpoint moves would be misleading; the grouped change more likely reflects a downstream path or infrastructure change.

## E. Proposed architecture

Separate the feature set into three planes.

### Observation plane — primarily integration

Acquire and normalize facts/events such as:

- Link/admin state.
- MAC learning/removal/movement.
- MAC address table.
- VLAN/port configuration.
- DHCP snooping/bindings.
- Device tracking.
- CDP/LLDP.
- PoE state and measurements.
- Interface counters/errors/discards.
- Negotiated speed.
- Relevant switch event/trap data.

Prefer event-driven collection where reliable switch mechanisms exist, with polling/reconciliation where necessary.

### Management plane — integration services/actions

Potential bounded operations:

- VLAN create/rename/delete.
- Access VLAN changes.
- Trunk/native/allowed VLAN changes.
- DHCP configuration where the switch actually owns DHCP.
- Existing port administrative and PoE controls.
- Future explicit quarantine/isolation operations.

Management actions need validation, clear error reporting, and protection against accidental loss of management connectivity.

### Presentation/automation plane — Home Assistant and dashboard

- Visualize topology/state/history.
- Present bounded management controls exposed by the integration.
- Generate Home Assistant events/entities suitable for automations.
- Notify on new/unknown wired devices.
- Surface anomalies and explain the observations behind them.
- Correlate with durable known-device/asset inventory without making the dashboard itself the inventory database.

## F. Integration contract candidates

The existing dashboard/integration contract roadmap already calls for stable physical-port and semantic entity metadata. Network intelligence extends that contract.

Potential future semantic objects/events include:

- `network_device_seen`
- `network_device_departed`
- `network_device_moved`
- `port_link_changed`
- `poe_device_changed`
- `neighbor_changed`
- `address_binding_changed`
- `port_anomaly`

Names above are design placeholders, not committed API names.

Useful common fields could include:

- Switch/device ID.
- Stable interface identity.
- Physical port role/position.
- Timestamp.
- VLAN.
- MAC.
- IP addresses.
- Source/provenance (MAC table, DHCP snooping, CDP, LLDP, device tracking, etc.).
- Direct observation versus derived interpretation.
- Confidence where identity/correlation is inferred.

## G. Inventory and identity model

A long-term known-device system should distinguish:

1. **Physical asset** — a durable real-world device.
2. **Network identity** — one or more MAC/IP/hostname identities observed over time.
3. **Attachment observation** — where/when that identity was seen.
4. **Correlation** — evidence associating a changing network identity with a physical asset.

This is especially important for devices using private/random MAC addresses.

A durable external inventory is the intended place to explore this model. Do not create a separate mutable inventory inside the dashboard.

## H. High-level project roadmap

Network management/intelligence should be treated as a program made up of several bounded projects rather than one large feature. Each project should have its own validation gate and can be prioritized independently.

The duration estimates below are **rough focused engineering-time estimates**, not calendar commitments. They assume the current Catalyst 3650 + Home Assistant environment remains the primary development target, automated tests continue to run in CI, and unexpected IOS/IOS-XE transport limitations do not require a major architecture change.

### Project 1 — Event/observation foundation

**Expected duration:** about **1–2 weeks**

**Purpose:** establish the normalized observation/event layer that later intelligence depends on.

**Dependencies:**
- Current integration 0.1 baseline completed and stable.
- Polling/readback behavior validated.
- Real SNMP trap/inform path validated.
- Stable physical-interface identity and semantic entity metadata retained.

**Likely work:**
- Normalize link, MAC, PoE, neighbor, VLAN, and relevant trap/poll observations into common internal structures.
- Add timestamps, source/provenance, and direct-observation versus derived-interpretation markers.
- Define deduplication/debounce behavior.
- Define Home Assistant event payload conventions without creating excessive entity churn.
- Ensure integration reload/startup does not emit a storm of false "new" events.

**Value:**
- **Home Assistant:** receives clean, explainable network events suitable for automations instead of consumers having to interpret raw SNMP tables.
- **Cisco integration:** gains a stable observation contract that later features can reuse.
- **Dashboard:** gets one semantic source of truth for event/history presentation rather than duplicating inference logic.

### Project 2 — Address binding and device-presence correlation

**Expected duration:** about **1–3 weeks**

**Purpose:** build the practical relationship:

**MAC ↔ IP ↔ VLAN ↔ switch port**

and retain enough timing/provenance to distinguish "currently seen" from historical knowledge.

**Dependencies:**
- Project 1 observation foundation.
- Determine where DHCP authority resides.
- Determine which DHCP snooping/device-tracking/address tables are available on the current Catalyst/IOS-XE release without brittle screen scraping.
- Decide how durable known-device inventory is queried from the authoritative external inventory.

**Likely work:**
- Normalize MAC-table, ARP, DHCP-snooping/device-tracking, and neighbor evidence.
- Track first-seen, last-seen, current attachment, and recent attachment history.
- Preserve uncertainty when IP/MAC/asset correlation is incomplete.
- Distinguish direct switch observation from durable asset identity.

**Value:**
- **Home Assistant:** can reason about which device is present on which physical network path and can use that in automations.
- **Cisco integration:** becomes a source of structured endpoint-location evidence rather than only port telemetry.
- **Operator:** gains much faster troubleshooting of "what is connected where?"

### Project 3 — New/unknown wired-device detection

**Expected duration:** about **1–2 weeks**

**Purpose:** generate high-quality notifications/events when a wired device appears that is new, unknown, or unexpected.

**Dependencies:**
- Projects 1 and 2.
- Basic durable known-device/network-identity model in the authoritative external inventory.
- Agreed debounce/aging rules so MAC-table churn is not mistaken for a new physical connection.

**Likely work:**
- Emit semantic events such as a future `network_device_seen`.
- Classify identity as known, likely/correlated known, or unknown.
- Include port, VLAN, IP, PoE, CDP/LLDP, and physical-layout context when available.
- Support Home Assistant automations/notifications.
- Keep disruptive responses opt-in.

**Value:**
- **Home Assistant:** can notify immediately when an unexpected wired endpoint appears.
- **Operator/security:** gets a high-signal event for a relatively rare physical-network change.
- **Dashboard:** can surface recent/new devices without maintaining its own identity database.

### Project 4 — Topology-aware movement and anomaly intelligence

**Expected duration:** about **3–6 weeks**

**Purpose:** move from raw observations to explainable topology-aware interpretations.

**Dependencies:**
- Projects 1–3.
- Attachment history from Project 2.
- Port/topology expectations from durable inventory and/or observed CDP/LLDP relationships.
- For reliable wireless interpretation, AP/controller association data is strongly preferred.
- Thresholds for movement, flap detection, grouped movement, and normal per-port MAC populations.

**Likely work:**
- Classify expected roaming, likely repatch, downstream topology change, rapid MAC flapping, and unexpected multi-host attachment.
- Detect grouped MAC movement rather than reporting dozens of independent endpoint moves.
- Correlate link, PoE, neighbor, VLAN, and address-binding changes.
- Retain the underlying evidence and confidence/provenance for every derived interpretation.
- Expose explainable `port_anomaly` / movement-style events rather than opaque scores.

**Value:**
- **Home Assistant:** gains meaningful network-health and topology events that can drive notifications and automations.
- **Cisco integration:** becomes an interpretation layer over switch telemetry while preserving raw evidence.
- **Operator:** gets earlier warning of loops, unstable links, unexpected bridging, repatching, or topology changes with enough context to investigate.

### Project 5 — VLAN inventory and safe VLAN/port management

**Expected duration:** about **2–4 weeks**

**Purpose:** expose bounded VLAN management through the integration instead of requiring direct IOS CLI work.

**Dependencies:**
- Stable 0.1 write architecture.
- Explicit Read-only / Read-write credential-access model.
- Verified current management VLAN/path and safeguards against disconnecting Home Assistant.
- Research into supported write transport and whether rollback/transaction-like protection is available.
- Integration service/action API design.

**Likely work:**
- Enumerate VLAN ID/name/status and membership.
- Change access VLAN.
- Configure trunk/native/allowed VLAN state.
- Add VLAN create/rename/delete only after safety rules are proven.
- Add preflight checks for operations that could isolate the switch or Home Assistant.
- Keep the dashboard as a consumer of bounded integration actions; do not expose arbitrary CLI.

**Value:**
- **Home Assistant:** gains controlled network-management actions usable by dashboards and automations.
- **Cisco administration:** common VLAN/port configuration can be managed through a safer semantic API.
- **Operator:** reduces routine CLI work while retaining guardrails around high-impact changes.

### Project 6 — Safe quarantine/isolation workflows

**Expected duration:** about **1–2 weeks**

**Purpose:** provide an explicit, guarded response path for an unknown or problematic endpoint.

**Dependencies:**
- Projects 2, 3, and 5.
- Existing port-admin and PoE controls.
- Clear knowledge of management-critical and infrastructure ports.
- Defined recovery/undo behavior.

**Likely work:**
- Bounded actions such as disable port, disable PoE, or move an access port to a designated quarantine VLAN where supported.
- Strong confirmation/guardrails for critical ports.
- Record why the action occurred and what prior state must be restored.
- Keep automatic disruptive response disabled by default.

**Value:**
- **Home Assistant:** can support deliberate response automations after a human-defined policy decision.
- **Operator/security:** gets a fast containment mechanism without opening arbitrary switch configuration access.
- **Cisco integration:** provides reversible, audited semantic actions rather than raw commands.

### Project 7 — Network intelligence dashboard/history experience

**Expected duration:** about **2–4 weeks**, with portions able to proceed in parallel once integration contracts stabilize.

**Purpose:** turn the integration's normalized observations and intelligence into an understandable operational UI.

**Dependencies:**
- Stable event/object contracts from Projects 1–4.
- Stable management actions from Project 5 for configuration UI.
- Durable inventory lookup contract where known assets are displayed.

**Likely work:**
- Recent network events and new-device timeline.
- Per-port attachment/history views.
- Explainable anomaly presentation with underlying evidence.
- VLAN inventory/management views.
- Safe quarantine/isolation controls when Project 6 exists.
- Filters for direct observations versus inferred interpretations.

**Value:**
- **Home Assistant/dashboard users:** can see network state, history, and actionable changes in one place.
- **Operator:** gets faster diagnosis and less need to correlate CLI output manually.
- **Architecture:** keeps presentation in the dashboard while intelligence/management remains integration-owned.

### Project 8 — DHCP server management, only if Cisco is actually authoritative

**Expected duration:** about **2–4 weeks if pursued**

**Purpose:** manage Cisco DHCP pools/configuration only when the switch intentionally owns DHCP service.

**Dependencies:**
- Confirm DHCP authority for each relevant VLAN.
- Confirm a safe, supportable management transport and rollback/error model.
- Project 5 management safety patterns.

**Likely work:**
- Inventory DHCP pools and relevant configuration.
- Add bounded pool-management operations.
- Reuse address-binding information from Project 2 where appropriate.

**Value:**
- **Home Assistant:** could expose DHCP configuration/state alongside VLAN and endpoint information.
- **Cisco administration:** centralizes another bounded management function.
- **Important limitation:** if DHCP is owned by another router/firewall/server, this project should be skipped rather than moving DHCP merely because the Catalyst can provide it.

### Suggested sequencing

A practical sequence is:

**Project 1 → Project 2 → Project 3 → Project 4**

for observation/intelligence, while **Project 5** can begin once the 0.1 write baseline is stable and its safety research is complete.

Then:

**Project 5 → Project 6**

for active response/management.

**Project 7** can start incrementally after Project 1 and expand as later contracts become available.

**Project 8** is conditional and should remain outside the critical path unless the Catalyst is confirmed to be the desired DHCP authority.

The first four projects primarily make the network **observable and understandable**. Projects 5 and 6 make it **manageable and actionable**. Project 7 makes those capabilities **usable and explainable in the Home Assistant UI**.

## I. Research/validation questions before implementation

Before turning this design into code, establish:

- Which relevant facilities are available on the target Catalyst 3650 and its actual IOS-XE release.
- Which data is available through the integration's chosen transport(s) without brittle screen scraping.
- Which Cisco event mechanisms can provide MAC learn/remove/move, link, PoE, DHCP/device-tracking, and neighbor changes.
- Whether event delivery requires SNMP traps, syslog, streaming telemetry, polling, or a combination.
- What DHCP server currently owns each relevant network/VLAN.
- What Wi-Fi platform owns client association data and whether it can be integrated.
- Appropriate event retention/deduplication/debounce behavior.
- What historical window and thresholds distinguish ordinary movement from MAC flapping.
- How to represent known AP/downstream-switch/bridge paths so MAC movement can be interpreted without claiming direct physical cabling.
- How grouped MAC movement should be detected and represented when a downstream infrastructure path changes.
- Which topology expectations belong in durable infrastructure inventory versus integration-derived runtime state.
- Which management actions can be made safely and idempotently.
- How Home Assistant events/entities/services should expose observations without generating excessive entity churn.
- How durable inventory correlation should interact with Home Assistant without making either the dashboard or switch integration the system of record for physical assets.

## J. Relationship to the dashboard roadmap

This work follows the current dashboard completion milestones:

**v0.1.15 hardening → exact HA installation → consolidated acceptance → productionized distribution → integration contract → network management/intelligence → broader model support/release work → lower-priority read-only UI polish**

Some integration-contract work may naturally overlap with the network-intelligence research. Repository boundaries still apply even when planning is shared.

Broader multi-model validation remains valuable, but it is intentionally a lower-priority follow-on rather than a gate for the network-management/intelligence work on the currently validated Catalyst 3650 environment.

Read-only UI polish is lower priority still. The integration already has an explicit user-declared Read-only / Read-write credential-access setting, preserves observed values in either mode, and blocks writes locally when Read-only is selected. A future Home Assistant-supported way to make those controls visually non-editable would improve affordance, but it is not needed for correctness and should follow broader multi-model validation unless platform capabilities or user experience needs change.
