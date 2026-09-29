# Project 7 — Topology and Anomaly Intelligence

## Goal

Turn historical network observations into explainable interpretations of movement, repatching, downstream topology changes, link instability, and other anomalies.

## Expected duration

**About 3–6 weeks.**

## Dependencies

- Observation/event foundation.
- Device/asset correlation.
- New-device semantics.
- Attachment history.
- Known infrastructure paths from inventory and/or CDP/LLDP.
- AP/EasyMesh client-association data strongly improves wireless interpretation.

## Value

- **Home Assistant:** meaningful network-health events that can drive alerts and automations.
- **Cisco integration:** becomes an interpretation layer while retaining raw evidence.
- **Operator:** earlier warning of loops, flapping, unexpected bridging, repatching, or topology change.

## Key principle

MAC movement is not inherently suspicious.

Examples:

- movement between ports feeding different APs may be normal Wi-Fi roaming;
- movement between single-host wired ports may indicate a physical repatch;
- many MACs moving together may indicate a downstream infrastructure-path change;
- rapid alternating movement between unrelated ports may indicate instability or a loop.

## Candidate interpretations

- expected roaming/movement;
- likely physical repatch;
- downstream topology change;
- rapid MAC flapping;
- unexpected multi-host attachment;
- unknown/insufficient evidence.

These are derived interpretations, not direct switch facts.

## Evidence

Potential inputs include:

- source/destination interfaces;
- VLAN and port mode;
- link transitions;
- MAC movement history;
- grouped movement;
- CDP/LLDP;
- PoE transitions;
- DHCP/device tracking;
- AP/mesh association data;
- durable topology expectations.

## Explainability

Every anomaly/interpretation should retain the observations and reasoning inputs that produced it. Avoid opaque "health scores" that cannot be traced back to evidence.
