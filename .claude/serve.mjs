// 로컬 미리보기용 정적 서버 (미리보기 패널에서 빌드 결과를 열어 보려고 둔 것)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPE = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
  ".png":"image/png",".jpg":"image/jpeg",".webmanifest":"application/manifest+json",".svg":"image/svg+xml"};
http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, {"content-type":"text/plain; charset=utf-8"}); return res.end("없음: " + p);
  }
  res.writeHead(200, {"content-type": TYPE[path.extname(file)] || "application/octet-stream",
                      "cache-control":"no-store"});
  fs.createReadStream(file).pipe(res);
}).listen(4173, () => console.log("http://localhost:4173"));
