# Project 5 — Device Identity and Asset Correlation

## Goal

Relate network observations to durable real-world assets without pretending that a MAC address is the same thing as a physical or logical device.

## Expected duration

**About 2–4 weeks.**

## Dependencies

- Network Address Management.
- Observation/event foundation.
- A durable asset/network-identity model in an authoritative external inventory.

## Value

- **Home Assistant:** can present meaningful device names instead of only MAC/IP values.
- **Network intelligence:** movement and anomaly detection can distinguish known infrastructure from unknown endpoints.
- **Operations:** easier troubleshooting and migration.
- **ESPHome:** supports board recycling and prototype-to-production replacement.

## Identity layers

1. **Logical device/role** — e.g. Environmental Sensor.
2. **Physical asset/hardware** — e.g. one specific ESP32 board.
3. **Network identity** — MAC, hostname/client identifier, IP history.
4. **Attachment observation** — where/when that network identity was seen.
5. **Correlation** — evidence associating those layers.

## ESPHome hardware model

Most ESP boards are labeled with the last six MAC characters. Preserve that label as the human-facing board ID, for example `ESP-7A3F2C`, while the full MAC remains the authoritative network identifier.

A logical device may move from a prototype board to a production board. A physical board may later be recycled into another logical device.

Required operations should include:

- assign board to logical device;
- replace hardware;
- retire/recycle board;
- preserve reservation/IP intent when replacing hardware;
- keep assignment history.

## Uncertainty

Identity correlation must preserve confidence. Useful states include:

- known network identity;
- likely/correlated known device;
- unknown identity.

Do not silently turn probabilistic correlation into certainty.
