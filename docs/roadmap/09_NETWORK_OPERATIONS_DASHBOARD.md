# Project 9 — Network Operations Dashboard

## Goal

Provide a friendly Home Assistant operational UI over addressing, topology, history, network observations, and bounded management actions.

## Expected duration

**About 2–4 weeks**, implemented incrementally as upstream contracts stabilize.

## Dependencies

- Stable semantic contracts from the integration.
- Network Address Management provider/API.
- Event/history objects.
- Management actions for configuration controls.
- Durable inventory lookup where friendly asset identity is shown.

## Value

- **User experience:** one place to manage devices rather than separate Cisco, router, and DHCP UIs.
- **Operations:** faster troubleshooting and migration.
- **Architecture:** keeps presentation in the dashboard while authority remains in the appropriate backend.

## Device-centric design

A device view should be able to combine:

- friendly logical device/asset name;
- current and reserved IP;
- MAC/network identities;
- intended VLAN;
- current VLAN;
- Cisco switch/port;
- PoE;
- link/speed/errors;
- Wi-Fi/AP path when applicable;
- recent network events;
- identity confidence;
- management actions.

The user should think "Environmental Sensor" or "Access Point", not "DHCP reservation entry 47."

## Address-management UI

Possible controls:

- reserve current IP;
- choose another available IP;
- move reservation to another network;
- replace hardware/MAC while preserving logical device intent;
- bulk classify/migrate devices;
- display intended versus observed state.

## Network history

Views may include:

- recent new devices;
- attachment/movement history;
- anomaly explanations;
- VLAN changes;
- port changes;
- reservation changes.

## Boundary

The dashboard must not become the authoritative inventory database and must not construct raw IOS CLI. It consumes semantic data/actions from the integration and other authoritative providers.
