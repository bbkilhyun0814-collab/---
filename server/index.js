/* ===== 백엔드 서버 =====
   - 정적 파일(index.html, css, js) 제공
   - /api/chat      : AI 도우미 (Claude)
   - /api/login     : 이름 + 숫자 4자리 간단 로그인
   - /api/progress  : 학습 진도 저장/불러오기
   실행: npm start  (개발 중 자동 재시작: npm run dev) */

import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chatRouter } from "./chat.js";
import { progressRouter } from "./progress.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: "200kb" }));

// API
app.use("/api", chatRouter);
app.use("/api", progressRouter);

// 정적 파일 (server/, data/, node_modules/ 는 공개하지 않음)
app.use((req, res, next) => {
  if (/^\/(server|data|node_modules)(\/|$)/.test(req.path) || req.path.startsWith("/.")) {
    return res.status(404).send("Not Found");
  }
  next();
});
app.use(express.static(root, { extensions: ["html"] }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요." });
});

app.listen(PORT, () => {
  console.log(`서버 시작: http://localhost:${PORT}`);
  console.log(process.env.ANTHROPIC_API_KEY ? "AI 채팅: Claude 연결됨" : "AI 채팅: API 키 없음 → 화면의 FAQ 사전 답변 사용");
});
