# Dashboard Roadmap

This document tracks the development path for the Home Assistant Cisco Catalyst Dashboard.

## Current stable release: v0.1.21

v0.1.21 is the current public dashboard release.

The release completed the current hardware/model-generalization milestone and the repository/HACS migration:

- The dashboard now prefers dashboard contract v1 metadata for physical-port discovery, grouping, ordering, and semantic roles.
- Adaptive smaller primary layouts, arbitrary contract-v1 physical groups, non-PoE summary suppression, and member/slot-aware port labels/order are implemented.
- The known Catalyst 3650 48+4 environment passed the full live regression for the generalized implementation.
- Synthetic tests cover additional layout shapes and contract cases; those are contract-compatible test cases, not claims of hardware validation.
- The public repository is live under `WhoaLookAtThat/HA-Cisco-Catalyst-Dashboard` with fresh public history.
- HACS validation passes in the public repository.
- v0.1.21 is published and the normal Home Assistant installation/update path is HACS.

The v0.1.20 Catalyst 3650 acceptance remains an important historical regression baseline, and the v0.1.16 heuristic discovery/layout fallback remains intentionally available during the compatibility window.

## Hardware/model support status

The Catalyst 3650 48-port PoE+ layout with 48 primary ports plus four additional physical interfaces is the only currently hardware-validated dashboard target.

The current generalization scope is complete: the dashboard renders layouts from explicit integration metadata instead of adding model-name heuristics. Other layouts covered by automated fixtures are contract-tested but should not be described as hardware-validated until real hardware or reliable field reports confirm them.

Additional hardware is not a release prerequisite. Future reports can confirm or refine support for:

- different uplink arrangements that need explicit ordering or labels;
- switch-stack presentation;
- other Catalyst generations/families;
- explicit switch-level semantic summary roles if the integration contract is extended.

Model support should continue to be driven by explicit integration metadata rather than dashboard-specific naming, entity-ID, or port-number heuristics.

### Generalization design constraints

- Preserve the physical-switch mental model and responsive reflow.
- Preserve inactive physical ports in the layout while visually subduing them.
- Do not rely on color alone to communicate state.
- Keep Port Enabled and PoE Enabled independent.
- Hide controls/fields that are genuinely unsupported rather than displaying misleading values.
- Prefer contract metadata over parsing user-visible names or IDs.
- Retain the v0.1.16 compatibility path during its planned window.
- Treat the accepted Catalyst 3650 48+4 behavior as the live regression fixture.
- Do not invent model-specific group-order/display-name heuristics when contract metadata is insufficient.
- Keep integration-owned switch semantics in the integration contract rather than duplicating them in the dashboard.

## Current improvement backlog

These are post-generalization improvements to prioritize from real use rather than mandatory release blockers:

- Better CDP/LLDP downstream-device presentation.
- Richer traffic/error visualization.
- Better switch-level summaries.
- Additional accessibility refinements.
- Mobile refinements.
- Configuration/editor improvements.
- Performance and live-update improvements.
- Read-only UI polish where Home Assistant exposes enough capability information to present it cleanly.
- Broader Catalyst model validation as additional hardware or field reports become available.

## Release engineering for future versions

For each future release:

- Run unit/regression tests and build validation.
- Keep root and `dist/` distributables identical.
- Verify exact-HEAD CI.
- Perform appropriate live Home Assistant acceptance for behavior changed by the release.
- Merge through the protected `main` branch workflow.
- Verify post-merge CI and final artifact identity before tagging/releasing.
- Confirm HACS validation remains green for public releases.

Manual `/local/` resources and `?v=` cache-busting query strings are development/troubleshooting tools, not the intended production update mechanism. HACS is the normal installation and update path.

## Working principles

- Store durable knowledge once; observe transient state at its source; correlate when needed.
- Cisco switch/integration owns live switch state and configuration.
- An external authoritative inventory owns durable inventory/location/topology intent.
- Home Assistant/integration owns the HA representation and controls.
- Dashboard owns presentation, interaction, and correlation only.
- Avoid dashboard-local copies of mutable infrastructure inventory.

## High-level sequence

**Audit layout assumptions ✅ → metadata-driven generalization ✅ → synthetic contract fixtures ✅ → live Catalyst 3650 regression ✅ → public/HACS migration ✅ → v0.1.21 release ✅ → ongoing improvements.**
