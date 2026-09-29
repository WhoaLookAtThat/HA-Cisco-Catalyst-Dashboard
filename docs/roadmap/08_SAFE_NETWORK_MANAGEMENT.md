# Project 8 — Safe Network Management and Response

## Goal

Expose useful Cisco configuration changes through bounded, validated integration actions rather than arbitrary CLI, and provide guarded response workflows for problematic endpoints.

## Expected duration

**About 3–5 weeks** for VLAN/port management plus initial isolation workflows.

## Dependencies

- Stable write architecture.
- Explicit Read-only / Read-write credential mode.
- VLAN/address model.
- Knowledge of management-critical paths.
- Proven rollback/recovery strategy for disruptive operations.

## Value

- **Home Assistant:** controlled network actions usable by dashboards and automations.
- **Cisco administration:** routine operations without manual CLI.
- **Security/operations:** fast but deliberate containment actions.
- **Safety:** central validation reduces the risk of locking out Home Assistant or the switch.

## Candidate actions

- change access VLAN;
- configure trunk/native/allowed VLAN state;
- create/rename/delete VLANs after stronger safety validation;
- port admin enable/disable;
- PoE enable/disable;
- move a port to a quarantine VLAN;
- restore prior state.

## Safety model

The integration, not the dashboard, must enforce safety.

Potential safeguards:

- block or strongly guard management-critical ports;
- preflight target VLAN/subnet;
- preserve prior configuration for rollback;
- explicit confirmation for high-impact operations;
- verify exact resulting state;
- never make disruptive automatic responses the default.

## Quarantine

Quarantine is a semantic workflow, not merely "shutdown port." Depending on the situation it may mean:

- disable port;
- disable PoE;
- move access port to a quarantine VLAN;
- notify without acting.

The chosen response should be policy-driven and reversible.
