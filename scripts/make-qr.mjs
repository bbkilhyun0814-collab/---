/* QR 코드 이미지 생성
   실행: node scripts/make-qr.mjs [사이트주소]
   결과: images/qr.svg, images/qr.png  (사이트 주소가 바뀌면 다시 실행) */
import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "images");
const url = process.argv[2] || "https://silver-ai-school.onrender.com";

fs.mkdirSync(outDir, { recursive: true });
const opts = { errorCorrectionLevel: "H", margin: 2, color: { dark: "#2b2520", light: "#ffffff" } };

const svg = await QRCode.toString(url, { ...opts, type: "svg" });
fs.writeFileSync(path.join(outDir, "qr.svg"), svg, "utf8");
await QRCode.toFile(path.join(outDir, "qr.png"), url, { ...opts, width: 1024 });

console.log("QR 생성 완료:", url);
console.log(" -", path.join(outDir, "qr.svg"));
console.log(" -", path.join(outDir, "qr.png"));
