const PRIMARY = /^GigabitEthernet1\/0\/(\d+)$/;
const ADDITIONAL = /^GigabitEthernet1\/1\/(\d+)$/;

export function classifyPhysicalPort(portOrName) {
  if (portOrName && typeof portOrName === "object" && portOrName.contractVersion === 1) {
    return {
      group: portOrName.physicalGroup || "other",
      position: portOrName.physicalPosition != null ? Number(portOrName.physicalPosition) : null,
    };
  }
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

function groupRank(group) {
  if (group === "primary") return 0;
  if (group === "additional") return 1;
  if (group === "other") return 3;
  return 2;
}

function numericCoordinate(value) {
  const number=Number(value);
  return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
}

export function orderPorts(ports) {
  return [...ports].sort((a,b)=>{
    const la=classifyPhysicalPort(a),lb=classifyPhysicalPort(b);
    const rankDifference=groupRank(la.group)-groupRank(lb.group);
    if(rankDifference)return rankDifference;
    if(la.group!==lb.group)return String(la.group).localeCompare(String(lb.group));
    const memberDifference=numericCoordinate(a.member)-numericCoordinate(b.member);
    if(memberDifference)return memberDifference;
    const slotDifference=numericCoordinate(a.slot)-numericCoordinate(b.slot);
    if(slotDifference)return slotDifference;
    const positionDifference=numericCoordinate(la.position)-numericCoordinate(lb.position);
    if(positionDifference)return positionDifference;
    return String(a.interfaceName??"").localeCompare(String(b.interfaceName??""));
  });
}

export function physicalPortLabel(port, peers = []) {
  const layout=classifyPhysicalPort(port);
  const position=layout.position ?? port?.port ?? null;
  if(position == null)return port?.interfaceName ?? "?";
  const groupPeers=peers.filter((peer)=>classifyPhysicalPort(peer).group===layout.group);
  const members=new Set(groupPeers.map((peer)=>peer.member).filter((member)=>member!=null).map(String));
  const slots=new Set(groupPeers.map((peer)=>peer.slot).filter((slot)=>slot!=null).map(String));
  if(slots.size>1 && port?.slot!=null){
    if(members.size>1 && port?.member!=null)return `${port.member}/${port.slot}/${position}`;
    return `${port.slot}/${position}`;
  }
  if(members.size>1 && port?.member!=null)return `${port.member}/${position}`;
  return String(position);
}

export function physicalGroupColumns(count) {
  const total=Math.max(1,Number(count)||1);
  return {
    wide:Math.min(24,total),
    medium:Math.min(12,total),
    narrow:Math.min(8,total),
    small:Math.min(6,total),
  };
}
