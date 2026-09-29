# Project 1 — EasyMesh and Wireless Consolidation

## Goal

Move from separate wireless-network sets per router/access point to a smaller, coherent EasyMesh-based wireless design.

The preferred outcome is a small number of meaningful SSIDs shared across the site, rather than one set per access point/router.

## Expected duration

**About 1–2 weeks** of focused validation and migration work.

## Dependencies

- Router/access-point firmware that supports the required EasyMesh behavior.
- Validation of Ethernet backhaul and VLAN behavior across mesh nodes.
- Understanding of which device is the main router and which devices are mesh nodes.
- Agreement on the initial SSID set and intended VLAN mapping.

## Value

- **Users/devices:** fewer SSIDs and less manual AP selection.
- **Home Assistant:** a more stable wireless topology to correlate with device presence.
- **Network administration:** one wireless design instead of per-router configuration islands.
- **Later topology intelligence:** clearer distinction between normal Wi-Fi roaming and suspicious wired MAC movement.

## Initial target

A likely first design is:

- one main/user SSID;
- one home-automation/IoT SSID;
- optional guest SSID.

Avoid creating many SSIDs merely to express policy that is better represented by VLAN/firewall rules.

## Key validation questions

- Do the required SSIDs/VLAN mappings propagate correctly to all EasyMesh nodes?
- Does Ethernet backhaul carry the intended tagged networks?
- Can IoT devices with older 2.4 GHz radios connect reliably?
- What AP/controller information is available for later Home Assistant correlation?
- How stable are roaming and client identity observations?

## Out of scope

This project does not decide every future VLAN, DHCP reservation, or device identity rule. It provides the wireless foundation those later projects depend on.
