import { mkdir, readFile, writeFile } from "node:fs/promises";
await mkdir("dist",{recursive:true});
const packageJson=JSON.parse(await readFile("package.json","utf8"));
const version=packageJson.version;
const modules=["switch-layout.js","port-model.js","switch-summary.js","entity-discovery.js","cisco-catalyst-switch-card.js"];
let output="";
for(const name of modules){
  let source=await readFile(`src/${name}`,"utf8");
  source=source.replace(/^import .*$/gm,"").replace(/export /g,"");
  if(name==="cisco-catalyst-switch-card.js") source=source.replaceAll("__DASHBOARD_VERSION__",version);
  output+=`\n// ---- ${name} ----\n${source}\n`;
}
if(output.includes("__DASHBOARD_VERSION__")) throw new Error("Dashboard version placeholder was not replaced");
await writeFile("dist/cisco-catalyst-switch-card.js",output);
await writeFile("cisco-catalyst-switch-card.js",output);
