# 어르신을 위한 스마트폰 AI 배움터

화면은 순수 HTML/CSS/JS, 백엔드는 Node.js(Express)입니다.

## 실행 방법

처음 한 번:

```
npm install
copy .env.example .env
```

`.env` 파일을 열어 `ANTHROPIC_API_KEY=` 뒤에 Claude API 키를 붙여 넣으면 AI 도우미가 진짜 AI로 답합니다.
키가 없어도 사이트는 동작하며, AI 도우미는 미리 적어둔 FAQ 답변을 씁니다.

서버 실행:

```
npm start
```

브라우저에서 http://localhost:3000 을 엽니다. (개발 중 코드가 바뀔 때 자동 재시작: `npm run dev`)

백엔드 없이 화면만 보려면 `powershell -ExecutionPolicy Bypass -File serve.ps1` 로 8080 포트에서 열 수도 있습니다.

## 인터넷에 공개하기 (Render 무료 배포)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/bbkilhyun0814-collab/---)

1. 위 버튼을 누르고 Render에 깃허브 계정으로 로그인합니다.
2. `ANTHROPIC_API_KEY` 칸에 Claude API 키를 넣습니다 (비워두면 FAQ 답변으로 동작).
3. **Apply**를 누르면 몇 분 뒤 `https://silver-ai-school.onrender.com` 같은 공개 주소가 생깁니다.

무료 요금제는 15분 동안 접속이 없으면 잠들었다가 다음 접속 때 30초쯤 걸려 깨어납니다.
또 무료 서버는 재시작될 때 `data/users.json`이 초기화되므로, 진도 저장을 오래 유지하려면 유료 디스크나 DB로 바꿔야 합니다.

## QR 코드

첫 화면 제목 옆 **▦ QR** 버튼을 누르면 사이트 QR 코드가 뜨고, `qr.html`은 A4 인쇄용 안내문입니다.
사이트 주소가 바뀌면 아래 명령으로 QR 이미지를 다시 만들고 깃허브에 올리면 됩니다.

```
node scripts/make-qr.mjs https://새주소
```

## 백엔드 API

| 주소 | 역할 |
|---|---|
| `POST /api/chat` | AI 도우미. `{ message, history }` → `{ answer }`. 키 없으면 503 (화면이 FAQ로 대체) |
| `POST /api/login` | 이름 + 숫자 4자리. 처음이면 자동 가입. `{ token, name, progress, created }` |
| `GET /api/progress` | 내 진도 불러오기 (`Authorization: Bearer 토큰`) |
| `PUT /api/progress` | 내 진도 저장 |
| `POST /api/logout` | 토큰 삭제 |

- 사용자 데이터는 `data/users.json` 에 저장됩니다 (숫자 4자리는 해시로 저장). DB로 바꾸려면 `server/progress.js` 의 `load`/`save` 만 바꾸면 됩니다.
- 로그인하지 않아도 진도는 브라우저에 저장됩니다. 로그인하면 서버와 합쳐져 다른 기기에서도 이어집니다.
- AI 모델은 `.env` 의 `CLAUDE_MODEL` 로 바꿀 수 있습니다 (기본 `claude-opus-5-5`). 어르신용 말투와 안전 규칙은 `server/chat.js` 의 `SYSTEM_PROMPT` 에 있습니다.

## 파일 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 첫 화면. 강좌 목록, 진도 표시, 글자 크기 조절 |
| `lesson.html` | 단계별 강좌 화면 (`?id=강좌아이디`) |
| `quiz.html` | 강좌 끝 연습 문제 (`?id=강좌아이디`) |
| `chat.html` | AI 도우미 채팅 (말로 묻기, 읽어주기) |
| `css/style.css` | 공통 스타일. 큰 글씨, 큰 버튼, 따뜻한 색 |
| `js/common.js` | 진도 저장(Progress), 읽어주기(Speaker), 글자 크기(FontSize) |
| `js/lessons-data.js` | 강좌 내용. 여기에 항목을 추가하면 강좌가 늘어납니다 |
| `js/chat-engine.js` | AI 도우미 답변 엔진. 지금은 FAQ 사전, 나중에 API 연결 |
| `js/phone-scene.js` | 휴대폰 화면 그림 생성기 (SVG). 눌러야 할 곳을 주황 테두리와 손가락으로 표시 |
| `js/lesson-scenes.js` | 강좌 단계마다 어떤 그림을 보여줄지 지정 |
| `login.html` | 이름 + 숫자 4자리 로그인 화면 |
| `server/index.js` | Express 서버. 정적 파일 + API |
| `server/chat.js` | Claude API 연결 (AI 도우미) |
| `server/progress.js` | 로그인, 진도 저장 (data/users.json) |
| `serve.ps1` | 백엔드 없이 화면만 볼 때 쓰는 간단 서버 |

## 강좌 구성 (14개, 3단계)

- 🌱 기초 단계: 전화 걸기와 받기, 문자 보내기, 글자 크게·소리 크게 하기, 사진 찍기, 찍은 사진 보기와 지우기
- 🌿 중급 단계: 카카오톡 메시지, 카카오톡 사진 보내기, 유튜브 보기, 유튜브 말로 찾기, 사기 문자·전화 피하기
- 🌳 고급 단계: AI에게 말로 물어보기, AI로 문자·편지 쓰기, AI에게 사진 보여주고 물어보기, 카카오톡 영상통화

## 놀이(게임) 3가지

첫 화면 '놀이하기' → `games.html`. 강의실 큰 화면용 '강의실 큰 화면' 버튼이 있습니다. 내용은 모두 `js/games-data.js`에 있습니다.

- 🃏 짝 맞추기 (`game-match.html`): 어려운 말 ↔ 쉬운 말 카드 짝 찾기. 쉬움(6쌍)/보통(8쌍). `MATCH_PAIRS`
- 🧩 부탁 문장 조립 (`game-prompt.html`): 지금 상태·원하는 것·답 형태 카드를 골라 부탁을 만들면 AI 답이 달라지고 별점이 나옴. `PROMPT_ROUNDS`
- 🕵️ 진짜냐 AI냐 사기냐 (`game-detect.html`): 사진·문자·전화를 보고 셋 중 하나 고르기. 두 팀 대결, 20초 제한 선택. `DETECT_ITEMS`

## 강좌 추가하기

`js/lessons-data.js`의 `LESSONS` 배열에 항목을 추가합니다.
각 강좌는 `id`, `level`(basic/middle/advanced), `category`, `icon`, `title`, `desc`, `steps[]`, `quiz[]`를 갖습니다.
단계 자체를 바꾸려면 같은 파일의 `LEVELS` 배열을 고치면 됩니다.

## 강좌 그림 바꾸기

강좌 단계의 그림은 `js/lesson-scenes.js`에서 강좌 id별로 단계 순서대로 지정합니다.

- `{ type: "camera", highlight: "shutter" }` : 생성기가 그려주는 휴대폰 화면 그림
- `{ image: "images/camera-1.jpg" }` : 실제 사진이나 캡처 파일. `images/` 폴더에 넣고 경로를 적으면 됩니다
- `null` : 그림 없이 이모지만 표시

그림 종류(type): `home`(홈 화면), `camera`, `gallery`, `photo`, `chat`(카톡/문자), `picker`(사진 고르기),
`list`(연락처/친구), `call`(전화), `search`(검색), `video`(영상), `ai`, `settings`, `scam`(사기 문자), `poster`(설명 카드).
각 type이 받는 `highlight` 값은 `js/phone-scene.js`의 해당 함수 주석에 적혀 있습니다.

## 나중에 Next.js로 옮길 때

| 지금 | Next.js |
|---|---|
| `js/lessons-data.js` | `data/lessons.json` 또는 DB |
| `index.html`, `lesson.html`, `quiz.html`, `chat.html` | `app/page.tsx`, `app/lesson/[id]/page.tsx` 등 |
| `server/progress.js` | `app/api/login/route.ts`, `app/api/progress/route.ts` (내용 거의 그대로) |
| `server/chat.js` | `app/api/chat/route.ts` (내용 거의 그대로) |

API 주소(`/api/chat`, `/api/login`, `/api/progress`)가 같으므로 화면 쪽 코드는 바꾸지 않아도 됩니다.

## 검색 노출(SEO)

- 모든 화면에 설명문(description), 미리보기(og) 태그, canonical 주소가 있고, 강좌·문제 화면은 `setPageMeta()`로 강좌 이름을 제목에 넣습니다.
- `sitemap.xml`(페이지 목록), `robots.txt`, `images/og.png`(카톡·문자 미리보기 그림)이 있습니다. 강좌를 추가하면 `sitemap.xml`에 `lesson.html?id=새아이디` 줄을 추가하세요.
- 네이버 서치어드바이저(searchadvisor.naver.com)와 구글 서치 콘솔(search.google.com/search-console)에 사이트를 등록하고, 사이트 확인용 `<meta>` 태그를 `index.html`의 `<head>`에 넣은 뒤 사이트맵 주소 `https://silver-ai-school.onrender.com/sitemap.xml`을 제출하면 됩니다.

## 강좌 안의 단계 (초급·중급·고급·심화)

모든 강좌는 안에서 다시 단계로 나뉩니다. 기초 단계 강좌는 초급·중급·고급, 중급 단계 강좌는 중급·고급, 고급 단계 강좌는 고급·심화입니다. 강좌를 누르면 단계 고르는 화면이 먼저 나오고, 어느 단계든 바로 들어갈 수 있습니다.

- 각 강좌의 단계 순서는 `js/lesson-tiers.js`의 `LESSON_TIERS["강좌id"].tiers`에 있습니다. 첫 단계 내용은 `js/lessons-data.js`의 `steps`/`quiz` 그대로이고, 나머지 단계는 `LESSON_TIERS["강좌id"]["단계id"]`에 있습니다. 단계 이름·색은 `TIER_DEFS`에 있습니다.
- 각 걸음에 `scene`을 적으면 그 휴대폰 그림을 씁니다. 단계마다 연습 문제 3개씩입니다.
- 진도는 첫 단계는 `강좌id`, 나머지는 `강좌id:단계id` 열쇠로 따로 저장됩니다. 첫 화면 강좌 카드에 단계 칩이 보입니다.
- 단계를 더 넣으려면 `tiers` 배열에 단계 id를 추가하고 같은 이름의 `{ steps, quiz }`를 적으면 됩니다.
