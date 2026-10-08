export function buildSwitchSummary(ports, switchEntities, states) {
  const active = ports.filter((p) => p.linkUp === true).length;
  const disabled = ports.filter((p) => p.adminEnabled === false).length;
  const unknown = ports.filter((p) => p.linkUp == null && p.adminEnabled !== false).length;
  const down = ports.length - active - disabled - unknown;
  const poePorts = ports.filter((p) => p.poeDetected === true).length;
  const poeUsed = ports.reduce((sum, p) => sum + (Number(p.poeConsumptionW) || 0), 0);
  const poeEntityId = Object.entries(switchEntities ?? {}).find(([key]) => key.endsWith("_poe_power_used"))?.[1];
  const poeState = poeEntityId ? states[poeEntityId] : undefined;
  return {
    total: ports.length, active, down, disabled, unknown, poePorts,
    poeUsedW: poeState && Number.isFinite(Number(poeState.state)) ? Number(poeState.state) : poeUsed,
    poeBudgetW: poeState?.attributes?.poe_budget_w ?? null,
    poeRemainingW: poeState?.attributes?.poe_remaining_w ?? null,
  };
}
