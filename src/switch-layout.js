const PRIMARY = /^GigabitEthernet1\/0\/(\d+)$/;
const ADDITIONAL = /^GigabitEthernet1\/1\/(\d+)$/;

export function classifyPhysicalPort(portOrName) {
  if (portOrName && typeof portOrName === "object" && portOrName.physicalGroup && portOrName.physicalPosition != null) {
    return { group: portOrName.physicalGroup, position: Number(portOrName.physicalPosition) };
  }
  const interfaceName = typeof portOrName === "string" ? portOrName : portOrName?.interfaceName;
  let match = PRIMARY.exec(interfaceName ?? "");
  if (match) { const position=Number(match[1]); if(position>=1&&position<=48)return {group:"primary",position}; }
  match = ADDITIONAL.exec(interfaceName ?? "");
  if (match) { const position=Number(match[1]); if(position>=1&&position<=4)return {group:"additional",position}; }
  return {group:"other",position:null};
}
export function orderPorts(ports) {
  const rank={primary:0,additional:1,other:2};
  return [...ports].sort((a,b)=>{const la=classifyPhysicalPort(a),lb=classifyPhysicalPort(b);return rank[la.group]-rank[lb.group]||(la.position??Number.MAX_SAFE_INTEGER)-(lb.position??Number.MAX_SAFE_INTEGER)||a.interfaceName.localeCompare(b.interfaceName);});
}
