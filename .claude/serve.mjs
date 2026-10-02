// 로컬 미리보기용 정적 서버 + 개발용 모의 Firebase Realtime Database.
//
// 모의 DB는 /mock-db/<경로>.json 에서 RTDB REST API의 쓰는 부분만 흉내 낸다
// (GET / PUT / PATCH / DELETE + EventSource 스트리밍). 실시간 대결을 Firebase 없이
// 두 탭으로 확인하려고 둔 것이고, 배포에는 전혀 들어가지 않는다.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPE = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
  ".png":"image/png",".jpg":"image/jpeg",".webmanifest":"application/manifest+json",".svg":"image/svg+xml"};

/* ------------------------------------------------------------------ 모의 RTDB */
let DB = {};
const watchers = [];                       // {prefix, res}

function at(obj, parts) {
  let cur = obj;
  for (const k of parts) { if (cur == null || typeof cur !== "object") return undefined; cur = cur[k]; }
  return cur;
}
function setAt(parts, value) {
  if (!parts.length) { DB = value == null ? {} : value; return; }
  let cur = DB;
  for (const k of parts.slice(0, -1)) {
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  const last = parts[parts.length - 1];
  if (value === null) delete cur[last]; else cur[last] = value;
}
function notify(changed) {
  const key = "/" + changed.join("/");
  for (const w of watchers) {
    // 바뀐 곳이 보고 있는 가지 안이거나 그 조상이면 통째로 다시 보낸다
    if (key.startsWith(w.prefix) || w.prefix.startsWith(key)) {
      const data = at(DB, w.prefix.split("/").filter(Boolean));
      send(w.res, "put", { path: "/", data: data === undefined ? null : data });
    }
  }
}
function send(res, event, data) {
  try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch (e) {}
}
function body(req) {
  return new Promise(r => { let s = ""; req.on("data", c => s += c); req.on("end", () => r(s)); });
}

async function mock(req, res, rawPath) {
  const CORS = {"access-control-allow-origin": "*",
                "access-control-allow-methods": "GET,PUT,PATCH,DELETE,OPTIONS",
                "access-control-allow-headers": "content-type"};
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }

  const parts = rawPath.replace(/\.json$/, "").split("/").filter(Boolean);

  if (req.method === "GET" && (req.headers.accept || "").includes("text/event-stream")) {
    res.writeHead(200, Object.assign({"content-type": "text/event-stream; charset=utf-8",
                                      "cache-control": "no-store", "connection": "keep-alive"}, CORS));
    const w = { prefix: "/" + parts.join("/"), res };
    watchers.push(w);
    const data = at(DB, parts);
    send(res, "put", { path: "/", data: data === undefined ? null : data });
    const ping = setInterval(() => { try { res.write(": ping\n\n"); } catch (e) {} }, 25000);
    req.on("close", () => { clearInterval(ping); const i = watchers.indexOf(w); if (i >= 0) watchers.splice(i, 1); });
    return;
  }
  if (req.method === "GET") {
    const data = at(DB, parts);
    res.writeHead(200, Object.assign({"content-type": "application/json"}, CORS));
    return res.end(JSON.stringify(data === undefined ? null : data));
  }
  if (req.method === "PUT" || req.method === "PATCH" || req.method === "DELETE") {
    let value = null;
    if (req.method !== "DELETE") { try { value = JSON.parse(await body(req) || "null"); } catch (e) { value = null; } }
    if (req.method === "PATCH") {
      const cur = at(DB, parts);
      value = Object.assign({}, (cur && typeof cur === "object") ? cur : {}, value || {});
    }
    setAt(parts, req.method === "DELETE" ? null : value);
    notify(parts);
    res.writeHead(200, Object.assign({"content-type": "application/json"}, CORS));
    return res.end(JSON.stringify(req.method === "DELETE" ? null : value));
  }
  res.writeHead(405, CORS); res.end();
}

/* ------------------------------------------------------------------ 정적 파일 */
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.startsWith("/mock-db/")) return mock(req, res, p.slice("/mock-db".length));
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, {"content-type":"text/plain; charset=utf-8"}); return res.end("없음: " + p);
  }
  res.writeHead(200, {"content-type": TYPE[path.extname(file)] || "application/octet-stream",
                      "cache-control":"no-store"});
  fs.createReadStream(file).pipe(res);
}).listen(4173, () => console.log("http://localhost:4173  (모의 DB: /mock-db)"));
