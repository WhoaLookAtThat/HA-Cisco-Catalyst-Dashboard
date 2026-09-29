# Project 10 — Broader Catalyst Model Validation

## Goal

Validate that the integration's abstractions work beyond the currently well-tested Catalyst 3650 environment.

## Expected duration

**Ongoing and model-dependent.** Initial validation of one additional family may take roughly 1–3 weeks depending on access to hardware and MIB differences.

## Dependencies

- Stable feature baseline on the current Catalyst 3650.
- Sufficient test hardware or trustworthy remote access to other models.

## Value

- **Integration:** confidence that interface discovery, PoE mapping, VLAN metadata, sensors, and write semantics generalize.
- **Users:** broader hardware compatibility.
- **Architecture:** reveals assumptions that accidentally depend on the 3650.

## Priority

This project is intentionally below the network management/intelligence work in current priority.

## Validation areas

- interface naming/ifIndex persistence;
- physical layout metadata;
- PoE ENTITY-MIB correlation;
- VLAN/trunk MIB behavior;
- CDP/LLDP;
- environmental sensors;
- CPU/memory;
- optional MIB absence;
- SNMPv2c/v3 behavior;
- write/readback semantics;
- traps/informs.

Avoid adding model-specific parsing to the dashboard. Model differences should be normalized by the integration.
