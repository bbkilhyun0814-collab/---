/* ===== 강좌 단계별 그림 지정 =====
   강좌 id → 단계 순서대로 그림 설정 배열.
   - { type, highlight, ... } : phone-scene.js 가 그려주는 휴대폰 화면 그림
   - { image: "images/파일.jpg" } : 실제 사진 파일을 쓰고 싶을 때 (images 폴더에 넣고 경로 적기)
   - null : 그림 없이 원래 이모지 표시 */

const LESSON_SCENES = {
  // ---------- 기초 ----------
  "phone-call": [
    { type: "home", highlight: "dock:전화" },
    { type: "list", title: "연락처", highlight: "name" },
    { type: "list", title: "연락처", highlight: "call" },
    { type: "call", highlight: "answer" },
    { type: "call", highlight: "end", status: "통화 중 03:12" }
  ],
  "sms-send": [
    { type: "home", highlight: "dock:메시지" },
    { type: "list", title: "메시지", highlight: "newmsg", names: ["우리 딸", "우리 아들", "김영희", "이순자"] },
    { type: "list", title: "받는 사람", highlight: "name" },
    { type: "chat", theme: "sms", highlight: "input", myText: "잘 지내니? 엄마야" },
    { type: "chat", theme: "sms", highlight: "send", myText: "잘 지내니? 엄마야" }
  ],

  "settings-basic": [
    { type: "home", highlight: "설정" },
    { type: "settings", highlight: "display" },
    { type: "settings", highlight: "fontsize" },
    { type: "video", highlight: "volume" },
    { type: "poster", icon: "🔇", lines: ["화면 맨 위에 이 그림이 있으면", "소리가 꺼진 거예요", "", "옆면 위쪽 버튼을 꾹 누르세요"] }
  ],

  // ---------- 카카오톡 ----------
  "kakao-message": [
    { type: "home", highlight: "카카오톡" },
    { type: "list", title: "친구", tabs: true, highlight: "name" },
    { type: "list", title: "친구", tabs: true, highlight: "chat1on1" },
    { type: "chat", highlight: "send", unread: true },
    { type: "chat", highlight: "emoji" }
  ],
  "kakao-photo": [
    { type: "list", title: "채팅", tabs: true, highlight: "name" },
    { type: "chat", highlight: "plus" },
    { type: "chat", highlight: "album" },
    { type: "picker", highlight: "select" },
    { type: "picker", highlight: "send" }
  ],

  // ---------- 사진 ----------
  "photo-take": [
    { type: "home", highlight: "dock:카메라" },
    { type: "camera", highlight: "focus" },
    { type: "camera", highlight: "shutter" },
    { type: "camera", highlight: "thumb" }
  ],
  "photo-view": [
    { type: "home", highlight: "갤러리" },
    { type: "gallery", highlight: "tile" },
    { type: "photo", highlight: "pinch" },
    { type: "photo", highlight: "trash" }
  ],

  // ---------- 유튜브 ----------
  "youtube": [
    { type: "home", highlight: "유튜브" },
    { type: "search", highlight: "search" },
    { type: "search", highlight: "typing" },
    { type: "search", highlight: "result" },
    { type: "video", highlight: "pause" }
  ],
  "youtube-voice": [
    { type: "search", highlight: "mic" },
    { type: "video", highlight: "full" },
    { type: "video", highlight: "subscribe" },
    { type: "video", highlight: "subtab" },
    { type: "video", highlight: "skip" }
  ],

  // ---------- AI ----------
  "ai-chat": [
    { type: "poster", icon: "🤖", lines: ["AI = 똑똑한 컴퓨터 비서", "", "챗GPT · 제미나이 · 클로드"] },
    { type: "home", highlight: "ChatGPT" },
    { type: "ai", highlight: "mic" },
    { type: "ai", highlight: "speaker" },
    { type: "ai", highlight: "mic", q: "된장찌개 끓이는 법 알려줘", a: ["1. 멸치 육수를 내고", "2. 된장 2큰술을 풀어요.", "3. 두부, 애호박, 양파를", "넣고 10분 끓이면 완성!"] }
  ],
  "ai-write": [
    { type: "ai", q: "손주 생일 축하 문자 써줘", a: ["사랑하는 우리 민준아,", "생일 축하해! 🎂", "건강하게 자라줘서", "할머니는 늘 고마워."] },
    { type: "ai", highlight: "mic", q: "며느리에게 보낼 추석 인사 써줘", a: ["어멈아, 명절 준비하느라", "고생 많았다.", "늘 고맙고 사랑한다.", "— 어머니가"] },
    { type: "ai", highlight: "copy", q: "손주 생일 축하 문자 써줘", a: ["사랑하는 우리 민준아,", "생일 축하해! 🎂", "건강하게 자라줘서", "할머니는 늘 고마워."] },
    { type: "chat", theme: "sms", name: "우리 손주", highlight: "paste", myText: "" },
    { type: "chat", theme: "sms", name: "우리 손주", highlight: "send", myText: "민준아 생일 축하해! 🎂" }
  ],

  "ai-photo": [
    { type: "poster", icon: "📸", lines: ["약 봉투 · 고지서 · 안내문", "사진을 찍어 보여주면", "AI가 읽고 설명해 줘요"] },
    { type: "chat", theme: "sms", name: "🤖 ChatGPT", highlight: "camera", myText: "" },
    { type: "camera", highlight: "shutter" },
    { type: "ai", highlight: "mic", q: "📷 이 약 언제 먹는 거야?", a: ["사진 속 약은 하루 2번,", "아침·저녁 식사 후 30분에", "드시라고 적혀 있어요.", "약사님께 꼭 확인하세요."] },
    { type: "ai", highlight: "speaker", q: "📷 이 약 언제 먹는 거야?", a: ["사진 속 약은 하루 2번,", "아침·저녁 식사 후 30분에", "드시라고 적혀 있어요.", "약사님께 꼭 확인하세요."] }
  ],
  "kakao-videocall": [
    { type: "list", title: "채팅", tabs: true, highlight: "name" },
    { type: "videocall", highlight: "menu" },
    { type: "search", title: "📹 페이스톡", highlight: "allow", query: "연결 중…" },
    { type: "videocall", highlight: "self" },
    { type: "videocall", highlight: "end" }
  ],

  // ---------- 안전 ----------
  "safety-smishing": [
    { type: "scam" },
    { type: "scam", highlight: "link" },
    { type: "call", highlight: "end", status: "'검찰입니다…' → 그냥 끊기" },
    { type: "scam", from: "모르는 번호", lines: ["엄마 나야, 폰 고장나서", "다른 번호로 연락해.", "급하게 돈 좀 보내줘", "계좌: 123-456-789"] },
    { type: "poster", icon: "🚨", color: "#c9402b", lines: ["바로 신고하세요", "", "경찰 112", "은행 '지급 정지' 요청"] }
  ]
};

function getScene(lessonId, stepIndex) {
  const arr = LESSON_SCENES[lessonId];
  return arr ? arr[stepIndex] || null : null;
}
