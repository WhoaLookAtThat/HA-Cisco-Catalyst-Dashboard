# Project 3 — Network Address Management

## Goal

Make IP assignment, DHCP reservations, leases, and address migration easy to manage without depending on an unfriendly router-specific client list.

The user should manage a **device**, not a low-level DHCP reservation record.

## Expected duration

**About 2–4 weeks** for a useful first version. More advanced provider abstraction, bulk migration, and history can extend beyond that.

## Dependencies

- Decide the initial DHCP authority after the EasyMesh/VLAN design is known.
- Define address pools for the new VLANs.
- Determine what management interface/API is available from the DHCP authority.
- Agree on how intended reservations are represented in the authoritative external inventory.

## Value

- **Home Assistant:** friendly device-centric reservation management.
- **ESPHome workflow:** easy fixed addressing without hard-coded `manual_ip` in every firmware configuration.
- **Migration:** bulk movement from an existing router reservation workflow to the new network.
- **Operations:** conflict checking, available-address selection, current-vs-intended comparison.
- **Future flexibility:** DHCP authority can later move between router-based, Kea, or other providers without redesigning the user workflow.

## Core objects

- DHCP scopes/pools.
- Dynamic leases.
- Reservations.
- Excluded/reserved address ranges.
- Current IP versus intended reserved IP.
- MAC/client identity.
- VLAN/subnet.
- Friendly logical device/asset identity.
- Reservation provenance and last synchronization result.

## Desired user workflows

### Reserve a device

Select a known device and see:

- friendly name;
- MAC;
- current IP;
- current VLAN;
- suggested unused IP;
- intended network.

Then choose **Reserve current IP** or **Choose address**.

### Move a device to IoT

Select the logical device, choose the target VLAN/network, and have the system:

1. propose an address from the target pool;
2. validate that it is free and not excluded;
3. create/update the DHCP reservation;
4. preserve intended identity/history;
5. show the network-side changes still required.

### Bulk migration

Import or reconstruct current reservations, then classify devices as:

- keep on Main;
- move to IoT;
- infrastructure;
- dynamic/no reservation;
- unknown/investigate.

## ESPHome-specific requirements

Many ESP devices are physically labeled using the last six hexadecimal characters of their MAC address. Preserve that as a friendly **physical board ID**, while retaining the full MAC as the authoritative network identifier.

Do not equate the board with the logical automation role. A board may be:

- new;
- recycled from another role;
- used temporarily for testing;
- replaced by a different board when the device becomes production.

The address-management UI should therefore support:

- temporary/test board assignment;
- production promotion;
- replacement hardware while preserving the logical device and intended IP;
- recycling a retired board into a new logical role;
- history of prior MAC/board assignments.

## Authority model

The DHCP server is authoritative for active leases. Durable intended identity/address assignments may live in an authoritative external inventory. Home Assistant should provide the operational UI and synchronization/validation layer.

The initial provider may be a site-specific router or DHCP service. The design should avoid assuming any one provider will always be authoritative.

## Safety

- Detect duplicate reservations and conflicting leases.
- Validate subnet membership.
- Protect infrastructure ranges.
- Never silently repurpose an address already assigned to another intended asset.
- Keep provider-specific operations behind a semantic management layer.
