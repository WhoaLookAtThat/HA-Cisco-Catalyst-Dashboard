export function vlanReviewRequest(device, port, value) {
  const entries = device?.config_entries;
  if (!Array.isArray(entries) || entries.length !== 1) throw new Error('Switch integration entry must be unique');
  if (!Number.isInteger(port?.ifIndex) || port.ifIndex <= 0 || !port.interfaceName) throw new Error('Physical port identity unavailable');
  if (port.portMode === 'trunk') throw new Error('Only access ports can be reviewed');
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value) || Number(value)>4094) throw new Error('Invalid VLAN ID');
  return {entry_id:entries[0],if_index:port.ifIndex,target_vlan:Number(value),expected_interface_name:port.interfaceName,confirmation_preference:'balanced'};
}
