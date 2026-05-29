const http = require("http");
const fs = require("fs");
const path = require("path");
const BASE = __dirname;
const API = {};
try {
  const dir = path.join(BASE, "api-data");
  fs.readdirSync(dir).filter(f => f.endsWith(".json")).forEach(f => {
    try { API[f.replace(".json","")] = JSON.parse(fs.readFileSync(path.join(dir,f),"utf8")); } catch {}
  });
} catch {}
console.log("API endpoints:", Object.keys(API).length);
const SRV = path.join(BASE, ".next/server/app");
const STAT = path.join(BASE, ".next/static");
const PUB = path.join(BASE, "public");
const MT = {".html":"text/html;charset=utf-8",".js":"application/javascript;charset=utf-8",".mjs":"application/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".json":"application/json",".woff2":"font/woff2",".woff":"font/woff",".ttf":"font/ttf",".svg":"image/svg+xml",".png":"image/png",".ico":"image/x-icon",".map":"application/json"};
const gm = p => MT[path.extname(p).toLowerCase()] || "application/octet-stream";
const fc = {};
function sf(r,fp,ct,ca) {
  try {
    let d = ca && fc[fp] ? fc[fp] : (d=fs.readFileSync(fp), ca && Object.keys(fc).length<300 && (fc[fp]=d), d);
    r.writeHead(200,{"Content-Type":ct,"Content-Length":d.length,"Cache-Control":ca?"public,max-age=86400":"no-cache"});
    r.end(d);
  } catch { r.writeHead(404); r.end(); }
}
function sj(r,d,s) {
  s=s||200; const b=Buffer.from(JSON.stringify,d,(k,v)=>typeof v==="bigint"?v.toString():v));
  r.writeHead(s,{"Content-Type":"application/json","Content-Length":b.length});
  r.end(b);
}
function dm() {
  return {clients:API.clients||[],projects:API.projects||[],approvals:(API.approvals||{}).approvals||[],invoices:(API.finance||{}).invoices||[],documents:(API.documents||{}).documents||[],communications:(API.communications||{}).communications||[]};
}
function exists(p) { try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch { return false; } }

http.createServer((req, res) => {
  let u; try { u = new URL(req.url, "http://x"); } catch { res.writeHead(400); return res.end(); }
  const p = u.pathname, m = req.method;
  
  if (m === "OPTIONS") { res.writeHead(200,{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,PATCH,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Content-Length":"0"}); return res.end(); }
  
  if (m === "GET" && p.startsWith("/api/")) {
    const pts = p.slice(1).split("/");
    if (pts.length >= 3) { let id; try { id = parseInt(pts[2]); } catch { return sj(res,{error:"Invalid ID"},404); } const it = (dm()[pts[1]]||[]).find(i=>i.id===id); return it ? sj(res,it) : sj(res,{error:"Not found"},404); }
    return API[pts[1]] ? sj(res, API[pts[1]]) : sj(res, {error:"Not found"},404);
  }
  
  if ((m==="POST"||m==="PATCH") && p.startsWith("/api/")) {
    let b=""; req.on("data",c=>{b+=c}); req.on("end",()=>{
      let j; try{j=JSON.parse(b||"{}");}catch{j={};}
      if (m==="POST"&&p.includes("/bulk")) { if(j.action==="export") return sj(res,{data:API[p.split("/")[2]]||[]}); return sj(res,{message:"Done",data:[]}); }
      if (m==="PATCH"&&p.split("/").length>=4) { const it=(dm()[p.split("/")[2]]||[]).find(i=>i.id===parseInt(p.split("/")[3])); if(it) return sj(res,Object.assign({},it,j)); }
      sj(res,{message:m==="POST"?"Created":"Updated",data:j});
    }); return;
  }
  
  if (m==="DELETE"&&p.startsWith("/api/")) return sj(res,{message:"Deleted"});
  
  if (m==="GET") {
    if (p==="/"||p==="") return sf(res,path.join(SRV,"index.html"),"text/html;charset=utf-8");
    if (p.startsWith("/_next/static/")) { const fp=path.join(STAT,p.slice(14)); if(exists(fp)) return sf(res,fp,gm(fp),1); }
    if (p.startsWith("/_next/image")) { res.writeHead(404); return res.end(); }
    if (p.startsWith("/_next/")) { const r=p.slice(7); let fp=path.join(SRV,"_next",r); if(exists(fp)) return sf(res,fp,gm(fp)); fp=path.join(STAT,r); if(exists(fp)) return sf(res,fp,gm(fp),1); }
    if (["/favicon.ico","/logo.svg","/robots.txt"].includes(p)) { const fp=path.join(PUB,p.slice(1)); if(exists(fp)) return sf(res,fp,gm(fp)); }
    return sf(res,path.join(SRV,"index.html"),"text/html;charset=utf-8");
  }
  res.writeHead(405); res.end();
}).listen(3000, "0.0.0.0", () => console.log("GWS on :3000"));
