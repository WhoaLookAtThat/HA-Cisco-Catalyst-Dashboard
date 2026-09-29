# Project 6 — New and Unknown Device Detection

## Goal

Generate high-signal Home Assistant events/notifications when a wired endpoint appears that is new, unknown, or inconsistent with expected inventory.

## Expected duration

**About 1–2 weeks.**

## Dependencies

- Observation/event foundation.
- Device identity/asset correlation.
- Debounce and MAC-aging rules.

## Value

- **Home Assistant:** immediate automations and notifications.
- **Security/operations:** new wired attachments are relatively rare and therefore high-value events.
- **Dashboard:** recent/new device views without its own identity database.

## Event context

When available, include:

- switch and interface;
- physical port position;
- MAC;
- IP;
- VLAN;
- port description;
- first/last seen;
- link transition;
- PoE state/draw;
- CDP/LLDP identity;
- known/likely/unknown classification;
- supporting provenance.

## Noise controls

A MAC-table aging event alone is not proof of physical disconnect. Require appropriate persistence/debounce and correlate with link state where possible.

Integration startup must not generate a flood of false "new device" notifications.

## Responses

Notification is the default. Automatic disruptive action is not.

Guarded quarantine/isolation belongs in the separate safe-management project.
