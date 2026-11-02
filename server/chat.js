/* ===== AI 도우미 API (Claude) =====
   POST /api/chat  { message: "질문", history?: [{role:"user"|"assistant", content:"..."}] }
   → { answer: "답변" }
   API 키가 없으면 503을 돌려주고, 화면 쪽(chat-engine.js)이 FAQ 사전 답변으로 대체합니다. */

import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";

export const chatRouter = Router();

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const SYSTEM_PROMPT = `당신은 '어르신을 위한 스마트폰 AI 배움터'의 친절한 도우미입니다. 70~80대 어르신이 스마트폰 사용법을 물어봅니다.

답변 원칙:
- 존댓말로, 손주가 할머니·할아버지께 설명하듯 따뜻하고 쉽게 말합니다.
- 외래어·전문용어를 피합니다. 예: '다운로드' 대신 '내려받기', '탭하다' 대신 '한 번 톡 누르다', '아이콘' 대신 '그림', '앱' 은 '앱(프로그램)'처럼 한 번 풀어줍니다.
- 순서가 있으면 1, 2, 3 번호를 붙여 한 줄에 한 동작씩, 최대 5단계로 씁니다. 각 단계는 '어디에 있는 어떤 모양을 누르세요'처럼 구체적으로 씁니다.
- 답은 짧게(200자 안팎). 어려우면 "자녀분이나 가까운 주민센터 디지털 배움터에 도움을 청하셔도 좋아요"라고 안내합니다.
- 돈을 보내라, 링크를 누르라, 비밀번호·계좌번호·주민번호를 입력하라는 내용은 절대 안내하지 않고, 사기일 수 있다고 주의시킵니다.
- 건강·법률·금융 판단이 필요한 질문은 전문가(의사·은행·경찰 112)에게 확인하라고 안내합니다.
- 이 배움터에는 다음 강좌가 있습니다. 관련 있으면 "첫 화면 'OO 단계'의 'OO' 강좌를 보세요"라고 한 줄 안내합니다:
  [기초 단계] 전화 걸기와 받기 / 문자 보내기 / 글자 크게, 소리 크게 하기 / 사진 찍기 / 찍은 사진 보기와 지우기
  [중급 단계] 카카오톡 메시지 보내기 / 카카오톡으로 사진 보내기 / 유튜브로 노래·영상 보기 / 유튜브 말로 찾기와 즐겨찾기 / 사기 문자·전화 피하기
  [고급 단계] AI(챗GPT)에게 말로 물어보기 / AI로 문자·편지 쓰기 / AI에게 사진 보여주고 물어보기 / 카카오톡 영상통화로 얼굴 보기
- 마크다운 기호(**, #, - 등)는 쓰지 않습니다. 이모지는 한두 개만 사용합니다.`;

chatRouter.post("/chat", async (req, res) => {
  if (!client) return res.status(503).json({ error: "AI 서버에 API 키가 설정되지 않았습니다." });

  const message = String(req.body?.message || "").trim().slice(0, 1000);
  if (!message) return res.status(400).json({ error: "질문이 비어 있습니다." });

  // 최근 대화 몇 개만 함께 보냄 (role/content 만 허용)
  const history = Array.isArray(req.body?.history)
    ? req.body.history
        .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }))
    : [];
  // 첫 메시지는 user 여야 함
  while (history.length && history[0].role !== "user") history.shift();

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [...history, { role: "user", content: message }]
    });

    if (response.stop_reason === "refusal") {
      return res.json({ answer: "죄송해요, 그 질문에는 답해드리기 어려워요. 다른 질문을 해주시거나 가족에게 여쭤보세요." });
    }

    const answer = response.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();

    res.json({ answer: answer || "죄송해요, 답을 만들지 못했어요. 다시 한 번 물어봐 주세요." });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Claude API 키가 올바르지 않습니다.");
      return res.status(503).json({ error: "AI 서버 인증 실패" });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(503).json({ error: "지금 질문이 많아요. 잠시 후 다시 시도해 주세요." });
    }
    console.error("Claude API 오류:", err);
    res.status(503).json({ error: "AI 서버 연결 실패" });
  }
});
