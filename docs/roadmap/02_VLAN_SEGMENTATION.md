# Project 2 — VLAN Segmentation and Migration

## Goal

Move from a flat network toward intentional segmentation, beginning with a dedicated home-automation/IoT VLAN.

## Expected duration

**About 1–3 weeks**, depending on how many devices require manual migration or unusual cross-VLAN access.

## Dependencies

- EasyMesh/VLAN behavior understood.
- Decision on where Layer-3 VLAN gateways live.
- Firewall/inter-VLAN policy design.
- Network Address Management plan sufficiently defined to avoid duplicate work.

## Value

- **Security:** automation/IoT devices can be isolated from general-purpose clients.
- **Reliability:** broadcast and device behavior are easier to reason about.
- **Home Assistant:** network role becomes explicit and can be used in automation/intelligence.
- **Cisco:** port/VLAN observations become semantically meaningful rather than just raw configuration.

## Migration principle

Prefer adding a new IoT subnet/VLAN and moving devices gradually rather than immediately splitting an existing flat subnet in a way that forces unrelated devices to renumber.

## Major design questions

- Main/user subnet and VLAN.
- Home-automation/IoT subnet and VLAN.
- Optional later networks: guest, cameras, infrastructure/management.
- Which devices must initiate connections across VLANs?
- Which discovery protocols require relays or special handling?
- Which wired Catalyst ports are access ports versus trunks?
- Which paths are management-critical and must be protected from disruptive changes?

## Migration safety

Every migration step should preserve a rollback path. Home Assistant, the main router, and critical infrastructure should not be moved casually as part of bulk endpoint migration.
