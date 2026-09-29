# Project 11 — Read-only UI Polish

## Goal

Improve frontend affordance when the user has explicitly declared Cisco credentials as Read-only.

## Expected duration

**About 0.5–1 week if Home Assistant exposes a clean supported mechanism.** Otherwise this may remain deferred.

## Dependencies

- Home Assistant platform support for visibly non-editable controls without falsely marking state unavailable.

## Current behavior

The integration already:

- asks the user to declare Read-only or Read/write credential access;
- preserves readable state in either mode;
- blocks writes locally in Read-only mode;
- exposes the declared access mode.

That behavior is semantically correct.

## Value

- **User experience:** fewer attempts to use controls that cannot write.
- **Clarity:** better visual distinction between "state is unavailable" and "state is readable but not editable."

## Priority

Lower priority than broader multi-model validation because correctness and safety are already provided by the explicit Read-only / Read-write selector.

Do not misuse Home Assistant's unavailable state merely to mean "readable but not writable."
