// Pure display model for the integration's read-only VLAN proposal review.
// No service calls, switch writes, or authorization decisions live here.
export function vlanReviewViewModel(response) {
  if (!response || typeof response !== "object" || response.read_only !== true || response.authorized !== false || response.can_execute !== false) {
    throw new Error("Untrusted or incomplete VLAN review response");
  }
  const allowed = new Set(["blocked", "confirmation_recommended", "no_additional_confirmation_recommended"]);
  const advice = response.confirmation_advice;
  if (!allowed.has(advice) || (response.status === "blocked" && advice !== "blocked")) {
    throw new Error("Unknown or inconsistent VLAN review result");
  }
  const blockers = Array.isArray(response.blocker_messages) ? response.blocker_messages.filter((s) => typeof s === "string") : [];
  const warnings = Array.isArray(response.warning_messages) ? response.warning_messages.filter((s) => typeof s === "string") : [];
  return {
    title: advice === "blocked" ? "VLAN change cannot proceed" : advice === "confirmation_recommended" ? "Review VLAN change" : "VLAN proposal reviewed",
    interfaceName: typeof response.interface_name === "string" ? response.interface_name : "Unknown interface",
    currentVlan: Number.isInteger(response.current_vlan) ? response.current_vlan : null,
    requestedVlan: Number.isInteger(response.requested_vlan) ? response.requested_vlan : null,
    advice,
    noChange: response.status !== "blocked" && Number.isInteger(response.current_vlan) && response.current_vlan === response.requested_vlan,
    refreshNeeded: advice === "blocked" && Array.isArray(response.blockers) && response.blockers.some((reason) => ["snapshot_too_old", "snapshot_timestamp_unavailable", "coordinator_update_failed", "snapshot_timestamp_in_future"].includes(reason)),
    blockers,
    warnings,
    requiresConfirmation: advice === "confirmation_recommended",
    canExecute: false,
    readOnly: true,
  };
}
