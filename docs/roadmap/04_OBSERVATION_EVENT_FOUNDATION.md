# Project 4 — Observation and Event Foundation

## Goal

Create a normalized stream/model of network observations that later device detection, topology intelligence, and dashboard history can consume.

## Expected duration

**About 1–2 weeks.**

## Dependencies

- Stable initial Cisco integration.
- Validated polling.
- Validated real trap/inform reception.
- Stable interface identity and semantic entity metadata.

## Value

- **Home Assistant:** reliable semantic events suitable for automations.
- **Cisco integration:** one reusable event/observation model instead of feature-specific parsing.
- **Dashboard:** consistent history/event inputs.
- **Later intelligence:** provenance and timestamps needed for correlation.

## Observations to normalize

- link/admin changes;
- MAC learn/remove/move observations;
- VLAN/port state;
- PoE state and measurements;
- CDP/LLDP changes;
- address-binding changes;
- errors/discards and speed changes;
- relevant trap/inform data.

## Required metadata

- switch identity;
- stable interface identity;
- timestamp;
- source/provenance;
- raw/direct observation versus derived interpretation;
- related MAC/IP/VLAN where applicable.

## Important behavior

- Deduplicate repeated observations.
- Debounce noisy transitions.
- Avoid startup/reload storms.
- Keep polling authoritative for state reconciliation even when traps trigger faster refresh.
