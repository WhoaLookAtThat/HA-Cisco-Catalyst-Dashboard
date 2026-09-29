# Cisco Catalyst + Home Assistant Roadmap

> **Roadmap scope:** This is a detailed execution roadmap for Cisco Catalyst/Home Assistant network-management work. Broader infrastructure priorities may be maintained outside these repositories; this document should not become an authoritative inventory or site-specific network plan.

This is the high-level shared roadmap for the Cisco Catalyst integration, dashboard, and related home-network management work.

The roadmap intentionally stays concise. Detailed design notes belong in the per-project documents under `docs/roadmap/` so that topics such as DHCP, EasyMesh, ESPHome hardware lifecycle, VLAN migration, or anomaly detection can evolve without turning this file into a design dump.

The repositories retain clear ownership boundaries:

- **Cisco Catalyst integration:** communication with and bounded management of Cisco equipment; normalized observations, actions, and events.
- **Dashboard:** presentation and user controls over stable integration contracts.
- **External authoritative inventory:** durable physical/network asset knowledge and intended configuration.
- **Wireless mesh / DHCP authority:** network infrastructure outside the Cisco integration, but an important input to the shared network-management design.

Duration estimates are rough focused engineering-time estimates, not calendar commitments.

## Project-document standard

Each high-level roadmap item should have its own document under `docs/roadmap/`. The roadmap should remain concise; detailed design discussion belongs in the project document.

Each project document should capture, when applicable:

- **Goal / scope** — what the project is intended to accomplish and what is explicitly out of scope.
- **Status / priority** — planned, researching, active, blocked, deferred, or complete, plus its relative roadmap priority.
- **Expected duration** — rough focused engineering-time estimate, with assumptions where useful.
- **Benefits / value** — what the work gives Home Assistant, Cisco/network administration, the dashboard, the operator, security, reliability, or maintainability.
- **Dependencies / prerequisites** — other roadmap projects, hardware/firmware capabilities, APIs, inventory data, or validation that must exist first.
- **User workflows / use cases** — the practical tasks the project should make easier.
- **Architecture / ownership** — which repository/system is authoritative for each part of the feature.
- **Deliverables / capabilities** — the concrete outputs expected from the project.
- **Safety / migration concerns** — especially for network configuration, routing, VLAN, DHCP, PoE, or disruptive actions.
- **Research questions / unknowns** — items that must be validated before implementation decisions are considered final.
- **Acceptance / completion criteria** — evidence required before the project is considered complete.
- **Follow-ons / deferred ideas** — useful ideas that should not expand the current project scope.

Not every heading needs content on day one. The important rule is that substantial project-specific detail goes into the project document rather than expanding the high-level roadmap.

## Current completion gate — initial 0.1 integration

Before starting the larger roadmap, finish the current five-step validation/release sequence:

1. Complete the current integration write-validation cycle.
2. Complete SNMP trap/inform and reconfiguration validation.
3. Perform final Cisco operational cleanup and persist intended switch configuration.
4. Run one final Home Assistant acceptance pass.
5. Complete repository/documentation cleanup and promote the validated integration to `main`.

## Roadmap

| Order | Project | Approx. duration | Primary value | Key dependencies |
| --- | --- | --- | --- | --- |
| 1 | [EasyMesh and wireless consolidation](roadmap/01_EASYMESH_AND_WIRELESS.md) | 1–2 weeks | Fewer SSIDs, shared wireless design, stable basis for IoT segmentation | Router/AP firmware and EasyMesh validation |
| 2 | [VLAN segmentation and migration](roadmap/02_VLAN_SEGMENTATION.md) | 1–3 weeks | Separate home automation/IoT from the current flat network | EasyMesh/VLAN behavior, addressing plan |
| 3 | [Network Address Management](roadmap/03_NETWORK_ADDRESS_MANAGEMENT.md) | 2–4 weeks | Friendly DHCP reservations, leases, fixed addressing, migration tools | DHCP authority decision, VLAN plan |
| 4 | [Observation and event foundation](roadmap/04_OBSERVATION_EVENT_FOUNDATION.md) | 1–2 weeks | Clean network events for HA automations and later intelligence | Stable 0.1 integration, traps/polling |
| 5 | [Device identity and asset correlation](roadmap/05_DEVICE_IDENTITY_AND_ASSET_CORRELATION.md) | 2–4 weeks | Link logical devices, physical hardware, MAC/IP history, ports, and inventory | Projects 3–4, durable inventory model |
| 6 | [New/unknown device detection](roadmap/06_NEW_UNKNOWN_DEVICE_DETECTION.md) | 1–2 weeks | High-signal notification when unexpected wired devices appear | Projects 4–5 |
| 7 | [Topology and anomaly intelligence](roadmap/07_TOPOLOGY_AND_ANOMALY_INTELLIGENCE.md) | 3–6 weeks | Explain movement, flapping, repatching, downstream changes, and topology anomalies | Projects 4–6; AP/mesh context improves quality |
| 8 | [Safe network management and response](roadmap/08_SAFE_NETWORK_MANAGEMENT.md) | 3–5 weeks | Bounded VLAN/port changes and guarded quarantine/isolation workflows | VLAN model, write safety, critical-path knowledge |
| 9 | [Network operations dashboard](roadmap/09_NETWORK_OPERATIONS_DASHBOARD.md) | 2–4 weeks, incremental | Friendly operational UI over addressing, topology, history, and actions | Stable contracts from earlier projects |
| 10 | [Broader Catalyst model validation](roadmap/10_BROADER_MODEL_VALIDATION.md) | ongoing / model-dependent | Prove abstractions beyond the current Catalyst 3650 | Stable feature baseline |
| 11 | [Read-only UI polish](roadmap/11_READ_ONLY_UI_POLISH.md) | 0.5–1 week if HA supports it cleanly | Better visual affordance for declared read-only credentials | Current R/O–R/W semantics already correct |

## Sequencing notes

The first three projects establish the **network architecture and addressing foundation**. EasyMesh consolidation should come before a large wireless/VLAN migration so that devices are not moved twice. Network Address Management should be designed around the final VLAN/address model rather than around a legacy router-specific workflow.

Projects 4–7 establish the **observation and intelligence foundation**. They should preserve the distinction between direct facts and derived interpretations.

Projects 8–9 make the system **manageable and usable**. The integration should expose bounded actions; the dashboard should not send arbitrary IOS CLI.

Project 10 is intentionally below network management/intelligence in priority. Project 11 is lower still because the explicit user-selected Read-only / Read-write mode already provides correct semantics even though the frontend could eventually present read-only controls more clearly.

## Shared design source

The broader design vocabulary and research questions remain in [NETWORK_MANAGEMENT_AND_INTELLIGENCE.md](NETWORK_MANAGEMENT_AND_INTELLIGENCE.md). The roadmap files are the place for project-specific scope, dependencies, value, decisions, and detailed ideas.
