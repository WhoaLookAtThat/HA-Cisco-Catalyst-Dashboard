# Dashboard → Integration Contract Handoff

Status: **proposed contract for the next Cisco Catalyst integration phase**

This document records the frontend data contract that the released v0.1.16 dashboard needs from the separate `WhoaLookAtThat/HA-Cisco-Catalyst` integration. It is a handoff/specification only. Integration implementation does not belong in this repository.

## Why this contract exists

v0.1.16 deliberately isolates several compatibility heuristics so the dashboard can operate before the integration exposes explicit frontend metadata. Those heuristics are adequate for the validated Catalyst 3650 but are not a durable API:

- `src/switch-layout.js` parses `GigabitEthernet1/0/<n>` as primary positions 1–48 and `GigabitEthernet1/1/<n>` as additional positions 1–4.
- `src/entity-discovery.js` recognizes port child devices by finding an entity whose integration `unique_id` ends in `_link`.
- `src/port-model.js` maps entity roles from private `unique_id` suffix/pattern conventions such as `_speed`, `_rx_bytes`, `_admin`, and `_poe_`.
- Switch selection recognizes candidates by a switch-level entity whose `unique_id` ends in `_poe_power_used`.

User-renamed Home Assistant names/entity IDs must not become part of the physical or semantic contract.

## Contract principles

1. **Stable identity is separate from presentation.** A physical interface must have an integration-owned identifier that survives Home Assistant display-name/entity-ID changes.
2. **Physical layout is integration data.** The dashboard should not infer chassis location from IOS interface-name syntax.
3. **Entity meaning is explicit.** The dashboard should not parse integration `unique_id` strings to discover semantic roles.
4. **Home Assistant-native relationships remain useful.** The parent switch device and child port devices should remain linked through the device registry.
5. **Live state remains live.** The contract identifies entities and physical topology; it does not duplicate changing entity state into dashboard-owned storage.
6. **Backward compatibility is staged.** A future dashboard should prefer the explicit contract and retain the v0.1.16 heuristics temporarily for older integration versions.

## Required port-device metadata

For each physical-port child device, the integration should expose frontend-readable, integration-owned metadata equivalent to:

| Field | Meaning | Requirement |
| --- | --- | --- |
| `interface_id` | Stable integration identity for the physical interface | Required |
| `interface_name` | Canonical switch interface name, e.g. `GigabitEthernet1/0/1` | Required |
| `physical_group` | Physical display group such as `primary` or `additional` | Required for deterministic layout |
| `physical_position` | 1-based position within the physical group | Required for deterministic layout |
| `is_physical` | Distinguishes physical switch ports from logical/virtual interfaces | Required if logical child interfaces can also exist |
| `member` / `slot` / `port` | Structured chassis coordinates when available | Recommended; required before stack/model generalization |

The exact Home Assistant representation should be chosen in the integration project after checking what frontend-readable registry/device metadata the integration can stably expose. The semantic requirements above are the contract; this dashboard specification does not require an unsupported custom registry field.

### Identity behavior

- `interface_id` must not depend on `device.name_by_user`, `entity_id`, or other user-editable display values.
- The child device's Home Assistant registry ID may still be used by the dashboard as an in-session lookup key, but it is not the network interface identity.
- Renaming a port device or any entity in Home Assistant must not change interface classification, ordering, or entity-role discovery.

## Required entity-role contract

Entities belonging to a physical-port device need an explicit integration-owned semantic role. The minimum roles required to replace v0.1.16 inference are:

| Role | Current v0.1.16 use |
| --- | --- |
| `link` | link state plus VLAN, PoE fallback, MAC/IP and CDP/LLDP attributes |
| `speed` | negotiated link speed |
| `rx_bytes` | received byte counter |
| `tx_bytes` | transmitted byte counter |
| `errors` | aggregate error state plus RX/TX discard attributes |
| `admin` | administrative port enable/disable control |
| `description` | switch interface description |
| `poe` | PoE enable/disable and per-port PoE telemetry |

The dashboard should receive this role without decoding `unique_id`. The integration may implement the frontend-visible role using an appropriate stable Home Assistant mechanism selected during integration work.

Role identifiers should be treated as API values: documented, stable, lowercase, and not translated.

## State/attribute payload currently consumed

The explicit role contract does not require changing existing entity state shapes unless integration review finds a reason to normalize them. v0.1.16 currently consumes:

### `link`

- state `on` / `off`
- `if_index`
- `port_mode`
- `access_vlan`
- `native_vlan`
- `allowed_vlans`
- `mac_addresses`
- `ip_addresses`
- `cdp_neighbors`
- `lldp_neighbors`
- fallback `poe` object with `enabled`, `device_detected`, `consumption_w`, `allocated_power_w`, `available_power_w`, and `max_drawn_w`

### `speed`

- state: negotiated speed display value

### `rx_bytes` / `tx_bytes`

- state: numeric byte counter

### `errors`

- state: aggregate error value
- `rx_discards`
- `tx_discards`

### `admin`

- switch state `on` / `off`; dashboard invokes normal Home Assistant `switch.turn_on` / `switch.turn_off`

### `description`

- state: interface description

### `poe`

- switch state `on` / `off`
- `device_detected`
- `power_consumption_w`
- `power_allocated_w`
- `power_available_w`
- `max_power_drawn_w`

If the integration normalizes or renames any of these attributes, that is an integration API change and should be versioned/documented so the dashboard can migrate deliberately.

## Switch-level discovery contract

v0.1.16's visual editor identifies Catalyst switch candidates indirectly from a `_poe_power_used` entity. That should also become explicit.

A parent device representing a dashboard-capable Catalyst switch should be discoverable without requiring PoE support. This matters for non-PoE models and future hardware generalization.

The integration handoff therefore needs a stable way for the frontend to determine:

- the device belongs to the `cisco_catalyst` integration;
- it represents the parent switch/chassis rather than a port child device;
- physical-port child devices are associated with it;
- optionally, which dashboard contract/capability version it supports.

The existing visual-editor device selector may continue filtering by integration/manufacturer, but runtime candidate discovery should not use PoE as a proxy for “is a switch.”

## Contract/capability versioning

Recommended semantic requirement: expose a small integration-owned dashboard-contract/capability version, initially **1**, at the parent-switch level.

A version/capability signal gives the dashboard an unambiguous migration path:

- no contract version → legacy discovery/inference path;
- contract version 1 → explicit physical identity/layout/entity roles;
- later incompatible semantics → a new version or capability flag rather than silent reinterpretation.

The integration project should decide the Home Assistant-native representation after implementation research.

## Dashboard migration after integration implementation

The next dashboard release that consumes contract v1 should:

1. Prefer explicit physical-port metadata and semantic entity roles.
2. Fall back to the v0.1.16 interface-name/`unique_id` heuristics when the integration does not advertise contract v1.
3. Keep both paths covered by tests during the compatibility window.
4. Ensure user-renamed devices/entities produce the same topology and role mapping under contract v1.
5. Remove legacy inference only in a later release with a documented minimum integration version.

## Integration acceptance cases

The integration-side implementation is ready for dashboard consumption when all of these can be demonstrated:

- A 3650 primary port and additional port can be classified/ordered without parsing their display names or entity `unique_id` strings.
- Renaming the Home Assistant child device does not affect classification/order.
- Renaming an entity ID does not affect semantic-role discovery.
- All minimum port roles present on the device are discoverable explicitly.
- A non-PoE-capable parent switch can still be recognized as a switch/dashboard candidate.
- Parent/child device relationships remain intact.
- Existing entity state/control behavior needed by the dashboard remains compatible or any deliberate state-schema change is documented.
- Contract/capability version detection is deterministic.
- Existing v0.1.16 dashboard behavior remains supported during the planned compatibility period.

## Issues deliberately batched for integration implementation

These questions should be resolved together in the integration project rather than piecemeal in the dashboard:

- Which Home Assistant-supported frontend-readable mechanism should carry port physical metadata?
- Which supported mechanism should carry semantic entity roles?
- Whether structured chassis coordinates should be member/slot/port, another model, or both structured coordinates plus display group/position.
- Where the dashboard-contract/capability version should be exposed.
- Whether current link-entity attributes should remain grouped as-is or some should become separate normalized entities.
- How stacks and models with different uplink arrangements map to physical groups.
- Whether switch-level semantic roles should use the same role mechanism as port entities.

These are implementation-representation decisions. The semantic contract and acceptance behavior above should remain stable unless integration constraints require revisiting them.

## Repository boundary

This document does **not** authorize integration changes from dashboard development. When implementation begins, switch to the integration project/repository, use this document as the handoff, and keep dashboard changes here until an integration contract implementation is available for consumption.
