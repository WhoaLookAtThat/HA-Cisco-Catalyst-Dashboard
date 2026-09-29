# Dashboard Roadmap

This document tracks the development path for the Home Assistant Cisco Catalyst Dashboard.

## Stable baseline: v0.1.20

v0.1.20 is released and is the current stable dashboard baseline.

- `main` and tag `v0.1.20`: `5d90ee58547e25103ca2847af973725a0541227b`.
- Accepted root/dist Git blob: `0efa1a5a0e0d5d6c5b32f43219896eb7e62c2dc9`.
- Accepted installed SHA-256: `17c004bad1a9ff4295adc6d40add29dcb5960ebcdb5631ad5366a1c579a8066b`.
- Accepted installed size: 29,579 bytes.
- Post-merge CI passed on the release commit.
- Live Home Assistant acceptance passed for contract-v1 rendering, 48+4 physical layout, narrow-dialog layout, keyboard/scroll behavior, read-only rejection, v2c/v3 writes, live dialog refresh, independent Port/PoE pending controls, and stable clickable controls without rerender flicker.
- The v0.1.16 heuristic discovery/layout fallback remains intentionally available during the compatibility window.

HACS default-listing work remains separate from ordinary release engineering. The public replacement repository must pass HACS validation before its next stable release.

## Current milestone: hardware/model generalization

The current implementation and live regression baseline are grounded in a Catalyst 3650 48-port PoE+ layout: 48 primary ports plus four separately displayed additional ports.

Generalization is underway. The goal is to support additional physical layouts through explicit integration metadata while preserving the accepted 3650 behavior.

Implemented development support now includes adaptive smaller primary groups, arbitrary contract-v1 physical groups, non-PoE summary suppression, and member/slot-aware port labels/order. These changes remain on the development branch until live regression on the known Catalyst 3650 baseline.

Only the Catalyst 3650 development switch is currently hardware-validated. Other layouts are synthetic contract-level compatibility cases, not claims of tested hardware support. Additional hardware is not a release prerequisite; future real-model reports can promote compatible layouts from contract-tested to hardware-validated.

Potential future support still includes:

- Different uplink arrangements that need explicit ordering/labels.
- More complete switch-stack presentation.
- Other Catalyst generations/families.
- Explicit switch-level semantic summary roles if the integration contract is extended.

Model support should be driven by explicit integration metadata rather than an accumulation of dashboard-specific naming, entity-ID, or port-number heuristics.

### Generalization design constraints

- Preserve the physical-switch mental model and responsive reflow.
- Preserve inactive physical ports in the layout while visually subduing them.
- Do not rely on color alone to communicate state.
- Keep Port Enabled and PoE Enabled independent.
- Hide controls/fields that are genuinely unsupported rather than displaying misleading values.
- Prefer contract metadata over parsing user-visible names or IDs.
- Retain the v0.1.16 compatibility path during its planned window.
- Treat the accepted v0.1.20 48+4 layout as a regression fixture.
- Do not invent model-specific group-order/display-name heuristics when contract v1 metadata is insufficient.
- Do not modify the integration repository from dashboard development; document needed contract changes as versioned handoffs.

## Release engineering for future versions

For each future release:

- Run unit/regression tests and build validation.
- Keep root and `dist/` distributables identical.
- Verify exact-HEAD CI.
- Checksum/blob-gate the distributable before live Home Assistant installation.
- Perform appropriate live Home Assistant acceptance for behavior changed by the release.
- Promote the accepted development state to `main` only after validation.
- Verify post-merge CI and final artifact identity before tagging/releasing.

Manual `?v=` resource query changes are a development cache workaround, not the intended HACS-managed update mechanism.

## Post-generalization improvement backlog

Prioritize these from real use rather than treating them as mandatory pre-release scope:

- Better CDP/LLDP downstream-device presentation.
- Richer traffic/error visualization.
- Switch-level summaries.
- Additional accessibility refinements.
- Mobile refinements.
- Configuration/editor improvements.
- Performance and live-update improvements.

## Working principles

- Store durable knowledge once; observe transient state at its source; correlate when needed.
- Cisco switch/integration owns live switch state and configuration.
- An external authoritative inventory owns durable inventory/location/topology intent.
- Home Assistant/integration owns the HA representation and controls.
- Dashboard owns presentation, interaction, and correlation only.
- Avoid dashboard-local copies of mutable infrastructure inventory.

## High-level sequence

**Audit layout assumptions ✅ → metadata-driven generalization ✅/in progress → synthetic contract fixtures ✅/in progress → live regression on the 48+4 baseline → release validation → ongoing improvements.**
