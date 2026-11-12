# Cisco Catalyst Dashboard v0.2.0 — Public Beta

This is the first **coordinated public beta milestone** for the Cisco Catalyst Dashboard and Integration. Both use **v0.2.0** for this release, although earlier public versions existed.

## Highlights

- Responsive physical front-panel overview for Catalyst 3650-style primary and additional port groups.
- Port tiles summarize administrative/link state, description, negotiated speed, access VLAN and PoE power.
- Port Details displays link and network information, SNMP traffic, errors and discard totals, MAC addresses, CDP/LLDP neighbor information, and PoE consumption/allocation/availability/maximum observed values.
- Clear source-distinguished IPv4 discovery: **Learned endpoint IPs** (MAC/ARP correlation), **CDP neighbor IPs** (CDP-advertised addresses), and **Observed port IPs** (deduplicated union). A port can have no endpoint-correlated IP while still showing a CDP-advertised address.
- Uses native Home Assistant entities for supported administrative, PoE and access-VLAN controls, subject to the Integration's permissions and safety checks.
- Responsive desktop/mobile views, keyboard navigation, and a Catalyst switch selector in card configuration.

## Requirements and installation

Install and configure [Cisco Catalyst Integration v0.2.0](https://github.com/WhoaLookAtThat/HA-Cisco-Catalyst/releases) first. Follow the [Dashboard README](https://github.com/WhoaLookAtThat/HA-Cisco-Catalyst-Dashboard#installation-with-hacs--marketplace) for Marketplace/HACS or manual installation. The public Dashboard registers:

```yaml
type: custom:cisco-catalyst-switch-card
switch_device_id: REPLACE_WITH_YOUR_HOME_ASSISTANT_SWITCH_DEVICE_ID
title: Cisco Switch
```

If manually adding a resource, register the installed JavaScript file as **JavaScript module** and ensure that only one active resource corresponds to this card. Do **not** use the private development card type `custom:cisco-catalyst-switch-card-dev`. Reopen/refresh the browser after changing card resources. Existing device IDs can be reused when the switch's Home Assistant device identity is preserved; if a configuration entry is recreated, re-check the device selector and ID.

Tested primarily with a Cisco Catalyst 3650 and Home Assistant Core 2026.11.1; other device layouts require validation.

## Known limitations and next-release work

- Counts of learned endpoint, CDP and observed IPv4 addresses differ by design. A CDP-advertised address is an observation, not proof of current IP reachability.
- Proactive **Network Health** summaries, actionable informational/investigate/urgent findings, and discard-rate warnings are planned for a subsequent release (#91), **not present here**.
- Full native entity-state display of IP address strings is deferred in the companion Integration (#83); the Dashboard already shows observed address values.
- IPv6 discovery and optional external inventory integration remain future work.
- This is a public **beta**, not a claim of universal Cisco model support or production readiness. Review controls and snapshots before making changes.
