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

## Known limitations

- Learned endpoint, CDP neighbor and observed port IPv4 addresses come from different discovery sources. Their counts may differ even when each reading is correct. A CDP-advertised IP address is not proof that the device is currently reachable.
- The Dashboard displays address values from available discovery data, but companion Integration address-count sensor states do not directly show the address string; those lists are exposed in sensor attributes.
- Traffic, error and discard values are observational, often cumulative counters. A high historical discard total by itself does not establish an active network problem. The card does not perform automated network-health analysis or send anomaly alerts.
- IPv6 endpoint/neighbor correlation and enrichment from external discovery inventories are not provided in this release.
- The front-panel layout and data have primarily been tested with the Catalyst 3650. Other switch models, supported entities, and firmware may behave differently. This release is a public beta, not a guarantee of production readiness.
