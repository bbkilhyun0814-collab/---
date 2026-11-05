/* ===== 공통 기능: 진도 저장, 읽어주기, 글자 크기 =====
   나중에 백엔드(로그인)가 생기면 Progress 객체의 내부만 API 호출로 바꾸면 됩니다. */

// ----- 로그인 상태 (이름 + 숫자 4자리, 서버 토큰) -----
const Auth = {
  KEY: "silver-ai-auth",
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || null; } catch (e) { return null; }
  },
  set(info) { try { localStorage.setItem(this.KEY, JSON.stringify(info)); } catch (e) {} },
  clear() { try { localStorage.removeItem(this.KEY); } catch (e) {} },
  isLoggedIn() { return !!(this.get() && this.get().token); },
  headers() {
    const a = this.get();
    return a && a.token ? { Authorization: "Bearer " + a.token } : {};
  },
  async login(name, pin) {
    const res = await fetch("/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "로그인에 실패했어요.");
    this.set({ token: data.token, name: data.name });
    // 서버 진도와 이 기기 진도를 합쳐서 양쪽에 반영
    Progress.mergeFromServer(data.progress || {});
    await Progress.pushToServer();
    return data;
  },
  async logout() {
    try { await fetch("/api/logout", { method: "POST", headers: this.headers() }); } catch (e) {}
    this.clear();
  }
};

// ----- 진도 저장: 브라우저(localStorage)에 항상 저장하고, 로그인 상태면 서버에도 저장 -----
const Progress = {
  KEY: "silver-ai-progress",
  _read() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; }
    catch (e) { return {}; }
  },
  _write(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) {}
    this._schedulePush();
  },
  _pushTimer: null,
  _schedulePush() {
    if (!Auth.isLoggedIn()) return;
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => this.pushToServer(), 800);
  },
  async pushToServer() {
    if (!Auth.isLoggedIn()) return;
    try {
      const res = await fetch("/api/progress", {
        method: "PUT",
        headers: Object.assign({ "Content-Type": "application/json" }, Auth.headers()),
        body: JSON.stringify({ progress: this._read() })
      });
      if (res.status === 401) Auth.clear(); // 토큰 만료 → 로그아웃 상태로
    } catch (e) { /* 오프라인이면 다음에 다시 */ }
  },
  async pullFromServer() {
    if (!Auth.isLoggedIn()) return;
    try {
      const res = await fetch("/api/progress", { headers: Auth.headers() });
      if (res.status === 401) { Auth.clear(); return; }
      if (!res.ok) return;
      const data = await res.json();
      this.mergeFromServer(data.progress || {});
    } catch (e) {}
  },
  // 서버 기록과 이 기기 기록 중 더 많이 진행한 쪽을 남김
  mergeFromServer(server) {
    const local = this._read();
    const merged = Object.assign({}, local);
    for (const [id, s] of Object.entries(server)) {
      const l = local[id];
      if (!l) { merged[id] = s; continue; }
      merged[id] = {
        step: Math.max(l.step || 0, s.step || 0),
        done: !!(l.done || s.done),
        quizScore: (l.quizScore && (!s.quizScore || l.quizScore.score >= s.quizScore.score)) ? l.quizScore : (s.quizScore || null)
      };
    }
    try { localStorage.setItem(this.KEY, JSON.stringify(merged)); } catch (e) {}
  },
  get(lessonId) {
    return this._read()[lessonId] || { step: 0, done: false, quizScore: null };
  },
  setStep(lessonId, step) {
    const d = this._read();
    d[lessonId] = Object.assign(this.get(lessonId), { step });
    this._write(d);
  },
  markDone(lessonId) {
    const d = this._read();
    d[lessonId] = Object.assign(this.get(lessonId), { done: true });
    this._write(d);
  },
  setQuizScore(lessonId, score, total) {
    const d = this._read();
    d[lessonId] = Object.assign(this.get(lessonId), { quizScore: { score, total } });
    this._write(d);
  },
  reset() { this._write({}); }
};

// ----- 읽어주기 (브라우저 내장 음성 합성) -----
const Speaker = {
  speak(text) {
    if (!("speechSynthesis" in window)) {
      alert("이 기기에서는 읽어주기를 지원하지 않습니다.");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.85; // 조금 천천히
    window.speechSynthesis.speak(u);
  },
  stop() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
};

// ----- 글자 크기 -----
const FontSize = {
  KEY: "silver-ai-fontsize",
  apply() {
    let size = "normal";
    try { size = localStorage.getItem(this.KEY) || "normal"; } catch (e) {}
    document.documentElement.setAttribute("data-size", size);
    document.querySelectorAll(".size-controls button").forEach(b => {
      b.classList.toggle("active", b.dataset.size === size);
    });
  },
  set(size) {
    try { localStorage.setItem(this.KEY, size); } catch (e) {}
    this.apply();
  }
};

// ----- 날짜·요일·시간 -----
const Clock = {
  DAYS: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
  now() {
    const d = new Date();
    const h = d.getHours(), m = d.getMinutes();
    const period = h < 12 ? "오전" : "오후";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    let greet;
    if (h < 6) greet = "늦은 밤이에요. 편히 쉬세요 🌙";
    else if (h < 12) greet = "좋은 아침이에요 ☀️";
    else if (h < 18) greet = "좋은 오후예요 🌤️";
    else greet = "좋은 저녁이에요 🌆";
    return {
      date: `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`,
      day: this.DAYS[d.getDay()],
      time: `${period} ${h12}시 ${String(m).padStart(2, "0")}분`,
      greet,
      speech: `오늘은 ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${this.DAYS[d.getDay()]}, 지금 시각은 ${period} ${h12}시 ${m}분입니다.`
    };
  },
  // el 안에 시계를 그리고 1분마다 갱신
  mount(el) {
    if (!el) return;
    const draw = () => {
      const n = this.now();
      el.innerHTML = `
        <div class="clock-date">📅 ${n.date} <strong>${n.day}</strong></div>
        <div class="clock-time">🕒 ${n.time}</div>
        <div class="clock-greet">${n.greet}</div>
      `;
    };
    draw();
    // 다음 분이 시작될 때 맞춰서 갱신
    const tick = () => { draw(); setTimeout(tick, 60000 - (Date.now() % 60000) + 50); };
    setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
  }
};

// ----- URL 매개변수 -----
function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

// ----- 공통 상단바 렌더링 -----
function renderTopbar(title, { back = true, speakText = null, qr = false, menu = true } = {}) {
  const bar = document.querySelector(".topbar");
  if (!bar) return;
  bar.innerHTML = `
    ${back ? `<button class="back" onclick="history.length > 1 ? history.back() : location.href='index.html'">◀ 뒤로</button>` : ""}
    <h1>${title}${qr ? ` <button class="qr-btn" id="topbarQr" title="QR 코드 보기" aria-label="QR 코드 보기">▦ QR</button>` : ""}</h1>
    ${menu ? `<button class="menu-btn" id="topbarMenu" aria-label="메뉴 열기">☰ 메뉴</button>` : ""}
    ${speakText !== null ? `<button class="speak-btn" id="topbarSpeak">🔊 읽어주기</button>` : ""}
  `;
  if (speakText !== null) {
    document.getElementById("topbarSpeak").onclick = () => {
      const t = typeof speakText === "function" ? speakText() : speakText;
      Speaker.speak(t);
    };
  }
  if (qr) document.getElementById("topbarQr").onclick = showQrModal;
  if (menu) document.getElementById("topbarMenu").onclick = showMenuModal;
}

// ----- 바로가기 메뉴 (어느 화면에서든 단계·놀이·도우미로 한 번에 이동) -----
const MENU_ITEMS = [
  { icon: "🏠", text: "처음 화면", href: "index.html" },
  { icon: "🌱", text: "기초 단계", href: "index.html#level-basic", color: "#4a9d6c" },
  { icon: "🌿", text: "중급 단계", href: "index.html#level-middle", color: "#e8742c" },
  { icon: "🌳", text: "고급 단계", href: "index.html#level-advanced", color: "#7a5cc9" },
  { icon: "🎲", text: "놀이하기", href: "games.html" },
  { icon: "🤖", text: "AI 도우미", href: "chat.html" },
];

function showMenuModal() {
  let m = document.getElementById("menuModal");
  if (!m) {
    m = document.createElement("div");
    m.id = "menuModal";
    m.className = "qr-modal menu-modal";
    m.innerHTML = `
      <div class="qr-box menu-box" role="dialog" aria-label="바로가기 메뉴">
        <p class="qr-title">☰ 어디로 갈까요?</p>
        ${MENU_ITEMS.map(i => `<a class="menu-link" href="${i.href}" ${i.color ? `style="--menu-color:${i.color}"` : ""}><span class="menu-link-icon">${i.icon}</span>${i.text}</a>`).join("")}
        <button class="btn btn-outline" style="margin-top:12px" id="menuClose">닫기</button>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener("click", e => {
      if (e.target === m || e.target.id === "menuClose") m.classList.remove("open");
      const a = e.target.closest(".menu-link");
      if (a) {
        m.classList.remove("open");
        // 같은 화면 안의 단계로 가는 경우: 주소만 바뀌므로 직접 스크롤
        const [page, hash] = a.getAttribute("href").split("#");
        const here = location.pathname.split("/").pop() || "index.html";
        if (hash && here === page) {
          e.preventDefault();
          history.replaceState(null, "", "#" + hash);
          scrollToHash();
        }
      }
    });
  }
  m.classList.add("open");
}

// 주소 뒤 #level-basic 같은 표시가 있으면 그 자리로 스크롤 (상단바에 가리지 않게)
function scrollToHash() {
  const id = location.hash.slice(1);
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  const bar = document.querySelector(".topbar");
  const offset = (bar ? bar.offsetHeight : 0) + 12;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
}

// ----- QR 코드 팝업 (사이트 주소를 휴대폰 카메라로 비추면 바로 열림) -----
function showQrModal() {
  let m = document.getElementById("qrModal");
  if (!m) {
    m = document.createElement("div");
    m.id = "qrModal";
    m.className = "qr-modal";
    m.innerHTML = `
      <div class="qr-box" role="dialog" aria-label="QR 코드">
        <p class="qr-title">📱 휴대폰 카메라로 비춰보세요</p>
        <img src="images/qr.svg" alt="사이트 QR 코드" class="qr-img">
        <p class="qr-url">${location.origin.replace(/^https?:\/\//, "")}</p>
        <p class="sub">카메라 앱을 열고 이 네모를 비추면<br>화면에 뜨는 노란 글씨를 누르세요.</p>
        <a class="btn btn-outline" href="qr.html" style="margin-top:12px">🖨️ 인쇄용 크게 보기</a>
        <button class="btn btn-primary" style="margin-top:12px" id="qrClose">닫기</button>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener("click", e => { if (e.target === m || e.target.id === "qrClose") m.classList.remove("open"); });
  }
  m.classList.add("open");
}

document.addEventListener("DOMContentLoaded", () => FontSize.apply());
