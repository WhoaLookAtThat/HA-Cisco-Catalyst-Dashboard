/** Build explicit execution request only for an unchanged, unblocked review. */
export function confirmedVlanRequest(reviewRequest, reviewResponse, livePort, selectedValue, acknowledged) {
  if (reviewResponse?.read_only !== true || reviewResponse?.authorized !== false ||
      reviewResponse?.can_execute !== false || reviewResponse?.status !== "requires_operator_review" ||
      !Array.isArray(reviewResponse.blockers) || reviewResponse.blockers.length !== 0) {
    throw new Error("Proposal is not eligible; review again");
  }
  if (!Number.isInteger(reviewResponse.current_vlan) ||
      reviewResponse.current_vlan !== livePort?.accessVlan ||
      reviewResponse.if_index !== reviewRequest.if_index ||
      reviewResponse.interface_name !== reviewRequest.expected_interface_name ||
      reviewResponse.requested_vlan !== reviewRequest.target_vlan ||
      livePort.ifIndex !== reviewRequest.if_index ||
      livePort.interfaceName !== reviewRequest.expected_interface_name ||
      selectedValue !== String(reviewRequest.target_vlan)) {
    throw new Error("Selected port or VLAN changed; review again");
  }
  if (reviewResponse.current_vlan === reviewResponse.requested_vlan) {
    throw new Error("Port is already on the requested VLAN; no change necessary");
  }
  if (acknowledged !== true) throw new Error("Confirm the connectivity warning first");
  return {
    entry_id: reviewRequest.entry_id,
    if_index: reviewRequest.if_index,
    expected_interface_name: reviewRequest.expected_interface_name,
    expected_current_vlan: reviewResponse.current_vlan,
    target_vlan: reviewRequest.target_vlan,
    acknowledged: true,
  };
}
