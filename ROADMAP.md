# Dashboard Roadmap

This document tracks the development path for the Home Assistant Cisco Catalyst Dashboard. It separates immediate dashboard release work from later integration-contract, hardware-support, and release work.

## Current milestone: promote accepted v0.1.20

v0.1.20 has completed automated validation and live Home Assistant acceptance against the integration's dashboard contract v1.

Accepted behaviors include contract-v1 physical layout/entity-role consumption, legacy fallback retention, 48+4 physical topology, responsive/narrow dialog layout, keyboard navigation, read-only rejection handling, v2c/v3 write paths, live open-dialog state refresh, independent Port/PoE pending controls, and stable clickable controls without needless rerender flicker.

The accepted distributable is immutable for this version:

- Development artifact Git blob: `0efa1a5a0e0d5d6c5b32f43219896eb7e62c2dc9`.
- Installed SHA-256: `17c004bad1a9ff4295adc6d40add29dcb5960ebcdb5631ad5366a1c579a8066b`.
- Installed size: 29,579 bytes.

Remaining release work:

1. Promote the accepted development branch to `main` non-destructively.
2. Verify post-merge CI and exact distributable identity.
3. Create the v0.1.20 release/tag.
4. Keep HACS publication/default-listing work separate from the private-repository development workflow.

Manual `?v=` resource query changes remain a development cache workaround; they are not the intended HACS-managed update mechanism.

## Integration contract status

Dashboard contract v1 is implemented and live-validated in the separate `WhoaLookAtThat/HA-Cisco-Catalyst` integration. The dashboard prefers explicit contract metadata and retains the v0.1.16 heuristics as a compatibility fallback.


The contract work that originally followed v0.1.16 is now complete for contract v1. Future integration-contract changes should be versioned deliberately rather than reintroducing dashboard inference.

## Hardware/model generalization

The current dashboard is grounded in a Catalyst 3650 48-port PoE+ layout: 48 primary ports plus four separately displayed additional ports.

After the integration contract is stable, decide deliberately how broadly the dashboard should generalize. Potential future support includes:

- 24-port models.
- Different uplink arrangements.
- Non-PoE models.
- Switch stacks.
- Other Catalyst generations/families.

Model support should be driven by explicit integration metadata rather than an accumulation of dashboard-specific naming or port-number heuristics.

## Release engineering and stable release

After the dashboard and integration contract are working together:

- Run joint integration/dashboard regression testing.
- Validate clean installation and upgrades through the supported distribution path.
- Establish/document dashboard and integration version-compatibility expectations where necessary.
- Finish user-facing installation/configuration documentation.
- Prepare release notes/changelog.
- Produce and validate a release candidate in Home Assistant.
- Promote the accepted development state to the appropriate stable mainline/tagged release.

## Post-release improvement backlog

After a stable release, improvements should be prioritized from real use rather than treated as mandatory pre-release scope. Candidate areas include:

- Better CDP/LLDP downstream-device presentation.
- Richer traffic/error visualization.
- Switch-level summaries.
- Additional accessibility refinements.
- Mobile refinements.
- Configuration/editor improvements.
- Performance and live-update improvements.

## Working principles

- Do not modify the integration repository as part of dashboard work; use explicit handoffs.
- Preserve the physical-switch mental model: sequential primary ports, additional ports displayed separately, and responsive reflow based on actual available card width.
- Prefer explicit integration metadata over parsing user-visible names/IDs.
- Preserve inactive ports in the physical layout while visually subduing them.
- Do not rely on color alone to communicate state.
- Keep Port Enabled and PoE Enabled as independent controls.
- Hide irrelevant VLAN fields rather than displaying meaningless N/A values.
- Keep full detail available without sacrificing whole-switch context.
- Treat CI, artifact identity, checksum-gated installation, and real-HA acceptance as release gates.

## High-level sequence

**Promote v0.1.20 → verify stable artifact/release → hardware/model generalization → broader regression → ongoing improvements.**
