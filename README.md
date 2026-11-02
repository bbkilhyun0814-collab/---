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
