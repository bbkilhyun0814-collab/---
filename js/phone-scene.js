/* ===== 휴대폰 화면 그림 생성기 =====
   실제 앱 캡처 대신, 휴대폰 모양 안에 '어디를 눌러야 하는지'를 주황색 테두리와
   손가락(👆)으로 크게 보여주는 그림(SVG)을 만듭니다.
   사용: PhoneScene.render({ type: "camera", highlight: "shutter" })  → SVG 문자열 */

const PhoneScene = (() => {
  const W = 320, H = 640;           // 전체 그림 크기
  const SX = 14, SY = 44, SW = 292, SH = 560; // 화면 영역
  const C = {
    frame: "#2b2520", screen: "#ffffff", bar: "#f1ebe3", text: "#2b2520", sub: "#8a7d72",
    hl: "#e8742c", green: "#34c759", red: "#ff3b30", kakao: "#fee500", blue: "#3b82f6", gray: "#d9d2c8"
  };

  // ---------- 작은 도우미 ----------
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const txt = (x, y, s, size = 16, opt = {}) =>
    `<text x="${x}" y="${y}" font-size="${size}" font-family="Noto Sans KR, sans-serif" fill="${opt.fill || C.text}" font-weight="${opt.bold ? 700 : 400}" text-anchor="${opt.anchor || "start"}" dominant-baseline="middle">${esc(s)}</text>`;
  const rect = (x, y, w, h, fill, r = 10, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
  const circ = (cx, cy, r, fill, extra = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
  const emoji = (x, y, s, size = 28) => txt(x, y, s, size, { anchor: "middle" });

  // 강조: 주황 테두리 + 손가락
  function hl(x, y, w, h, shape = "rect") {
    const ring = shape === "circle"
      ? `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.max(w, h) / 2 + 8}" fill="none" stroke="${C.hl}" stroke-width="6"/>`
      : `<rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="16" fill="none" stroke="${C.hl}" stroke-width="6"/>`;
    const fx = Math.min(x + w + 6, W - 40), fy = Math.min(y + h + 10, H - 50);
    return ring + `<text x="${fx}" y="${fy}" font-size="44" dominant-baseline="hanging" text-anchor="middle">👆</text>`;
  }

  // 휴대폰 틀 + 상태바
  function frame(inner, opts = {}) {
    const bg = opts.bg || C.screen;
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(opts.label || "휴대폰 화면 그림")}">
      ${rect(0, 0, W, H, C.frame, 40)}
      ${rect(SX, SY - 30, SW, SH + 42, bg, 26)}
      ${rect(SX, SY - 30, SW, 30, bg, 26)}
      ${txt(SX + 14, SY - 15, "12:30", 13, { fill: opts.dark ? "#fff" : C.sub })}
      ${txt(SX + SW - 14, SY - 15, "📶 🔋", 13, { fill: opts.dark ? "#fff" : C.sub, anchor: "end" })}
      ${inner}
    </svg>`;
  }

  // 아래 글 쓰는 칸 (채팅/문자 공용)
  function inputBar(y, opts = {}) {
    let s = rect(SX, y, SW, 64, C.bar, 0);
    s += circ(SX + 32, y + 32, 18, "#fff") + emoji(SX + 32, y + 33, "+", 28);
    s += rect(SX + 60, y + 14, SW - 150, 36, "#fff", 18);
    s += emoji(SX + SW - 70, y + 33, "😊", 22);
    s += circ(SX + SW - 32, y + 32, 20, opts.sendColor || C.hl) + emoji(SX + SW - 32, y + 33, "➤", 20);
    return s;
  }

  // ---------- 화면 종류별 그리기 ----------
  const scenes = {
    // 홈 화면: apps = [{icon,label}], highlight = label
    home(o) {
      const apps = o.apps || [["📞", "전화"], ["💬", "메시지"], ["🌐", "인터넷"], ["📷", "카메라"], ["🖼️", "갤러리"], ["💛", "카카오톡"], ["▶️", "유튜브"], ["⚙️", "설정"], ["🤖", "ChatGPT"]];
      let s = rect(SX, SY, SW, SH, "#e8f1fb", 0);
      let hlSvg = "";
      apps.forEach(([ic, lb], i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = SX + 28 + col * 92, y = SY + 60 + row * 110;
        s += rect(x, y, 64, 64, "#fff", 16) + emoji(x + 32, y + 34, ic, 34) + txt(x + 32, y + 82, lb, 13, { anchor: "middle" });
        if (lb === o.highlight) hlSvg = hl(x, y, 64, 64);
      });
      // 하단 고정 줄
      s += rect(SX, SY + SH - 90, SW, 90, "rgba(255,255,255,0.6)", 0);
      [["📞", "전화"], ["💬", "메시지"], ["🌐", "인터넷"], ["📷", "카메라"]].forEach(([ic, lb], i) => {
        const x = SX + 22 + i * 68, y = SY + SH - 76;
        s += rect(x, y, 56, 56, "#fff", 14) + emoji(x + 28, y + 30, ic, 30);
        if (o.highlight === "dock:" + lb) hlSvg = hl(x, y, 56, 56);
      });
      return frame(s + hlSvg, { label: o.label });
    },

    // 카메라: highlight = shutter | thumb | focus
    camera(o) {
      let s = rect(SX, SY, SW, SH, "#1c1c1e", 0);
      s += rect(SX, SY + 50, SW, 380, "#9fc5e8", 0);
      s += circ(SX + 220, SY + 120, 40, "#ffe08a") + rect(SX, SY + 300, SW, 130, "#7cb87c", 0);
      s += emoji(SX + 110, SY + 290, "🧑‍🦳", 90);
      const by = SY + SH - 80;
      s += circ(SX + SW / 2, by, 36, "#fff") + circ(SX + SW / 2, by, 30, "#fff", `stroke="#000" stroke-width="3"`);
      s += rect(SX + 36, by - 24, 48, 48, "#fff", 8) + emoji(SX + 60, by + 1, "🖼️", 26);
      s += emoji(SX + SW - 60, by, "🔄", 30);
      let h = "";
      if (o.highlight === "shutter") h = hl(SX + SW / 2 - 36, by - 36, 72, 72, "circle");
      if (o.highlight === "thumb") h = hl(SX + 36, by - 24, 48, 48);
      if (o.highlight === "focus") h = `<rect x="${SX + 70}" y="${SY + 220}" width="80" height="80" fill="none" stroke="${C.hl}" stroke-width="5"/>` + hl(SX + 70, SY + 220, 80, 80);
      return frame(s + h, { dark: true, label: o.label });
    },

    // 갤러리 격자: highlight = tile | app
    gallery(o) {
      let s = rect(SX, SY, SW, SH, "#fff", 0) + txt(SX + 16, SY + 28, "갤러리", 20, { bold: true });
      const colors = ["#9fc5e8", "#f6c7a0", "#b8e0b8", "#e8b8d8", "#ffe08a", "#c8c8f0", "#f0b8b8", "#b8e8e8", "#d8d8b8"];
      const icons = ["🏞️", "👨‍👩‍👧", "🌸", "🐶", "🍲", "🏠", "👵", "🌅", "🎂"];
      let h = "";
      colors.forEach((c, i) => {
        const x = SX + 10 + (i % 3) * 92, y = SY + 60 + Math.floor(i / 3) * 92;
        s += rect(x, y, 84, 84, c, 6) + emoji(x + 42, y + 44, icons[i], 40);
        if (i === 1 && o.highlight === "tile") h = hl(x, y, 84, 84);
      });
      return frame(s + h, { label: o.label });
    },

    // 사진 한 장 크게: highlight = trash | pinch | swipe | copy
    photo(o) {
      let s = rect(SX, SY, SW, SH, "#000", 0) + rect(SX, SY + 120, SW, 300, "#f6c7a0", 0) + emoji(SX + SW / 2, SY + 270, "👨‍👩‍👧", 120);
      const by = SY + SH - 50;
      ["↗️", "❤️", "✏️", "🗑️"].forEach((ic, i) => s += emoji(SX + 50 + i * 65, by, ic, 28));
      let h = "";
      if (o.highlight === "trash") h = hl(SX + 50 + 3 * 65 - 20, by - 20, 40, 40, "circle");
      if (o.highlight === "pinch") h = `<text x="${SX + 80}" y="${SY + 230}" font-size="50">👆</text><text x="${SX + 180}" y="${SY + 330}" font-size="50">👆</text><path d="M${SX + 110} ${SY + 250} L${SX + 190} ${SY + 330}" stroke="${C.hl}" stroke-width="6" stroke-dasharray="10 8" fill="none"/>`;
      if (o.highlight === "swipe") h = `<text x="${SX + 200}" y="${SY + 290}" font-size="50">👆</text><path d="M${SX + 230} ${SY + 270} L${SX + 80} ${SY + 270}" stroke="${C.hl}" stroke-width="8" fill="none" marker-end="url(#arr)"/><defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="${C.hl}"/></marker></defs>`;
      return frame(s + h, { dark: true, label: o.label });
    },

    // 채팅방(카톡/문자): highlight = plus | emoji | send | input | album | camera | menu
    chat(o) {
      const theme = o.theme === "sms" ? { bg: "#fff", me: "#3b82f6", meText: "#fff" } : { bg: "#b2c7da", me: C.kakao, meText: "#000" };
      let s = rect(SX, SY, SW, SH, theme.bg, 0) + rect(SX, SY, SW, 50, "rgba(255,255,255,0.7)", 0) + txt(SX + SW / 2, SY + 25, o.name || "우리 딸", 18, { bold: true, anchor: "middle" });
      s += circ(SX + 30, SY + 90, 18, "#ddd") + emoji(SX + 30, SY + 91, "👩", 22);
      s += rect(SX + 56, SY + 70, 150, 40, "#fff", 14) + txt(SX + 68, SY + 90, "엄마 잘 지내요?", 14);
      s += rect(SX + SW - 180, SY + 130, 168, 40, theme.me, 14) + txt(SX + SW - 168, SY + 150, o.myText || "그럼~ 밥은 먹었니?", 14, { fill: theme.meText });
      if (o.unread) s += txt(SX + SW - 190, SY + 150, "1", 13, { fill: C.hl, anchor: "end", bold: true });
      if (o.photo) s += rect(SX + SW - 160, SY + 185, 148, 100, "#f6c7a0", 12) + emoji(SX + SW - 86, SY + 237, "🌸", 50);
      const iy = SY + SH - 64;
      s += inputBar(iy, { sendColor: o.theme === "sms" ? C.blue : C.kakao });
      let h = "";
      if (o.highlight === "plus") h = hl(SX + 14, iy + 14, 36, 36, "circle");
      if (o.highlight === "emoji") h = hl(SX + SW - 86, iy + 16, 34, 34, "circle");
      if (o.highlight === "send") h = hl(SX + SW - 52, iy + 12, 40, 40, "circle");
      if (o.highlight === "input") h = hl(SX + 60, iy + 14, SW - 150, 36);
      if (o.highlight === "paste") h = rect(SX + 70, iy - 50, 110, 40, "#333", 10) + txt(SX + 125, iy - 30, "붙여넣기", 15, { fill: "#fff", anchor: "middle" }) + hl(SX + 70, iy - 50, 110, 40);
      if (o.highlight === "album" || o.highlight === "camera") {
        // + 메뉴 열린 상태
        const my = iy - 150;
        s += rect(SX, my, SW, 150, "#fff", 0);
        [["🖼️", "앨범"], ["📷", "카메라"], ["🎁", "선물"], ["📞", "통화"]].forEach(([ic, lb], i) => {
          const x = SX + 22 + i * 68;
          s += rect(x, my + 25, 56, 56, "#f1ebe3", 14) + emoji(x + 28, my + 55, ic, 28) + txt(x + 28, my + 105, lb, 13, { anchor: "middle" });
          if ((o.highlight === "album" && i === 0) || (o.highlight === "camera" && i === 1)) h = hl(x, my + 25, 56, 56);
        });
      }
      return frame(s + h, { label: o.label });
    },

    // 사진 고르기(전송 버튼): highlight = select | send
    picker(o) {
      let s = rect(SX, SY, SW, SH, "#fff", 0) + txt(SX + 16, SY + 28, "앨범", 18, { bold: true });
      s += rect(SX + SW - 80, SY + 12, 68, 34, C.kakao, 10) + txt(SX + SW - 46, SY + 29, "전송 2", 14, { bold: true, anchor: "middle" });
      const icons = ["🏞️", "👨‍👩‍👧", "🌸", "🐶", "🍲", "🏠"];
      icons.forEach((ic, i) => {
        const x = SX + 10 + (i % 3) * 92, y = SY + 60 + Math.floor(i / 3) * 92;
        s += rect(x, y, 84, 84, "#f1ebe3", 6) + emoji(x + 42, y + 44, ic, 40);
        s += circ(x + 70, y + 14, 11, i < 2 ? C.kakao : "#fff", `stroke="#999" stroke-width="2"`);
        if (i < 2) s += txt(x + 70, y + 15, String(i + 1), 12, { bold: true, anchor: "middle" });
      });
      let h = "";
      if (o.highlight === "select") h = hl(SX + 10 + 92, SY + 60, 84, 84);
      if (o.highlight === "send") h = hl(SX + SW - 80, SY + 12, 68, 34);
      return frame(s + h, { label: o.label });
    },

    // 친구 목록 / 연락처: highlight = search | name | tab | chat1on1 | newmsg
    list(o) {
      let s = rect(SX, SY, SW, SH, "#fff", 0) + txt(SX + 16, SY + 28, o.title || "연락처", 20, { bold: true });
      s += rect(SX + 14, SY + 52, SW - 28, 36, C.bar, 18) + txt(SX + 30, SY + 70, "🔍 이름 검색", 14, { fill: C.sub });
      const names = o.names || ["김영희", "박철수", "우리 딸", "우리 아들", "이순자", "최민수"];
      let h = "";
      names.forEach((n, i) => {
        const y = SY + 110 + i * 60;
        s += circ(SX + 36, y + 20, 20, "#e8f1fb") + emoji(SX + 36, y + 21, i === 2 ? "👩" : "🙂", 22) + txt(SX + 70, y + 20, n, 17);
        if (o.highlight === "name" && i === 2) h = hl(SX + 14, y - 4, SW - 28, 48);
      });
      if (o.highlight === "search") h = hl(SX + 14, SY + 52, SW - 28, 36);
      if (o.highlight === "chat1on1") {
        s += rect(SX, SY, SW, SH, "rgba(0,0,0,0.4)", 0) + rect(SX + 30, SY + 150, SW - 60, 260, "#fff", 20);
        s += emoji(SX + SW / 2, SY + 220, "👩", 60) + txt(SX + SW / 2, SY + 290, "우리 딸", 20, { bold: true, anchor: "middle" });
        s += rect(SX + 50, SY + 330, 100, 56, C.bar, 14) + txt(SX + 100, SY + 358, "📞 통화", 14, { anchor: "middle" });
        s += rect(SX + 170, SY + 330, 100, 56, C.kakao, 14) + txt(SX + 220, SY + 358, "1:1 채팅", 14, { bold: true, anchor: "middle" });
        h = hl(SX + 170, SY + 330, 100, 56);
      }
      if (o.highlight === "newmsg") {
        s += circ(SX + SW - 50, SY + SH - 100, 30, C.blue) + emoji(SX + SW - 50, SY + SH - 99, "✏️", 26);
        h = hl(SX + SW - 80, SY + SH - 130, 60, 60, "circle");
      }
      if (o.highlight === "call") {
        s += rect(SX, SY + 110 + 2 * 60 - 4, SW, 48, "#fff8ef", 0) + txt(SX + 70, SY + 110 + 2 * 60 + 20, "우리 딸  010-1234-5678", 15);
        s += circ(SX + SW - 40, SY + 110 + 2 * 60 + 20, 20, C.green) + emoji(SX + SW - 40, SY + 110 + 2 * 60 + 21, "📞", 20);
        h = hl(SX + SW - 60, SY + 110 + 2 * 60, 40, 40, "circle");
      }
      // 하단 탭(카톡)
      if (o.tabs) {
        s += rect(SX, SY + SH - 60, SW, 60, C.bar, 0);
        [["👤", "친구"], ["💬", "채팅"], ["🔍", "오픈채팅"], ["⋯", "더보기"]].forEach(([ic, lb], i) => {
          const x = SX + 36 + i * 74;
          s += emoji(x, SY + SH - 36, ic, 22) + txt(x, SY + SH - 14, lb, 11, { anchor: "middle" });
          if (o.highlight === "tab" && i === 0) h = hl(x - 26, SY + SH - 56, 52, 52);
        });
      }
      return frame(s + h, { label: o.label });
    },

    // 전화 수신/통화: highlight = answer | end
    call(o) {
      let s = rect(SX, SY, SW, SH, "#1c2a3a", 0) + emoji(SX + SW / 2, SY + 140, "👩", 90);
      s += txt(SX + SW / 2, SY + 220, "우리 딸", 26, { fill: "#fff", bold: true, anchor: "middle" }) + txt(SX + SW / 2, SY + 256, o.status || "전화가 왔어요…", 16, { fill: "#ccc", anchor: "middle" });
      let h = "";
      if (o.highlight === "end") {
        s += circ(SX + SW / 2, SY + SH - 90, 40, C.red) + emoji(SX + SW / 2, SY + SH - 88, "📞", 34);
        h = hl(SX + SW / 2 - 40, SY + SH - 130, 80, 80, "circle");
      } else {
        s += circ(SX + 80, SY + SH - 90, 40, C.green) + emoji(SX + 80, SY + SH - 88, "📞", 34);
        s += circ(SX + SW - 80, SY + SH - 90, 40, C.red) + emoji(SX + SW - 80, SY + SH - 88, "📞", 34);
        if (o.highlight === "answer") {
          h = hl(SX + 40, SY + SH - 130, 80, 80, "circle") + `<path d="M${SX + 80} ${SY + SH - 140} L${SX + 80} ${SY + SH - 230}" stroke="${C.hl}" stroke-width="8" marker-end="url(#arr2)"/><defs><marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="${C.hl}"/></marker></defs>` + txt(SX + 80, SY + SH - 250, "위로 쓸어 올리기", 14, { fill: "#fff", anchor: "middle", bold: true });
        }
      }
      return frame(s + h, { dark: true, label: o.label });
    },

    // 검색 화면(유튜브/AI): highlight = search | mic | result | allow
    search(o) {
      let s = rect(SX, SY, SW, SH, "#fff", 0);
      s += rect(SX, SY, SW, 50, "#fff", 0) + txt(SX + 16, SY + 25, o.title || "▶️ YouTube", 18, { bold: true, fill: o.title ? C.text : "#e00" });
      s += emoji(SX + SW - 30, SY + 25, "🔍", 24);
      const results = o.results || ["🎵 나훈아 노래 모음", "🎵 트로트 메들리 100곡", "🎵 7080 가요 베스트"];
      let h = "";
      if (o.highlight === "search") h = hl(SX + SW - 52, SY + 4, 44, 44, "circle");
      if (o.highlight === "mic" || o.highlight === "typing" || o.highlight === "allow") {
        s += rect(SX + 14, SY + 60, SW - 28, 44, C.bar, 22) + txt(SX + 30, SY + 82, o.query || "나훈아 노래", 16);
        s += circ(SX + SW - 40, SY + 82, 18, "#fff") + emoji(SX + SW - 40, SY + 83, "🎤", 20);
        if (o.highlight === "mic") h = hl(SX + SW - 58, SY + 64, 36, 36, "circle");
        if (o.highlight === "typing") {
          s += rect(SX, SY + SH - 200, SW, 200, "#d1d5db", 0);
          for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) s += rect(SX + 8 + c * 36, SY + SH - 188 + r * 48, 30, 40, "#fff", 6);
          s += rect(SX + SW - 70, SY + SH - 44, 62, 36, C.blue, 8) + txt(SX + SW - 39, SY + SH - 26, "검색", 14, { fill: "#fff", bold: true, anchor: "middle" });
          h = hl(SX + SW - 70, SY + SH - 44, 62, 36);
        }
        if (o.highlight === "allow") {
          s += rect(SX, SY, SW, SH, "rgba(0,0,0,0.4)", 0) + rect(SX + 30, SY + 200, SW - 60, 160, "#fff", 20);
          s += txt(SX + SW / 2, SY + 240, "마이크 사용을", 16, { anchor: "middle" }) + txt(SX + SW / 2, SY + 265, "허용하시겠습니까?", 16, { anchor: "middle" });
          s += rect(SX + 50, SY + 300, 90, 40, C.bar, 10) + txt(SX + 95, SY + 320, "거부", 15, { anchor: "middle" });
          s += rect(SX + 180, SY + 300, 90, 40, C.blue, 10) + txt(SX + 225, SY + 320, "허용", 15, { fill: "#fff", bold: true, anchor: "middle" });
          h = hl(SX + 180, SY + 300, 90, 40);
        }
      } else {
        results.forEach((r, i) => {
          const y = SY + 70 + i * 150;
          s += rect(SX + 14, y, SW - 28, 100, ["#f6c7a0", "#9fc5e8", "#b8e0b8"][i], 10) + emoji(SX + SW / 2, y + 52, "▶️", 40);
          s += txt(SX + 14, y + 120, r, 14);
          if (o.highlight === "result" && i === 0) h = hl(SX + 14, y, SW - 28, 100);
        });
      }
      return frame(s + h, { label: o.label });
    },

    // 영상 재생: highlight = pause | full | like | subscribe | skip | subtab | volume
    video(o) {
      let s = rect(SX, SY, SW, SH, "#fff", 0) + rect(SX, SY, SW, 180, "#000", 0) + emoji(SX + SW / 2, SY + 80, "🎤👴", 60);
      let h = "";
      if (o.highlight === "pause") { s += circ(SX + SW / 2, SY + 90, 30, "rgba(255,255,255,0.8)") + emoji(SX + SW / 2, SY + 91, "⏸", 30); h = hl(SX + SW / 2 - 30, SY + 60, 60, 60, "circle"); }
      s += emoji(SX + SW - 24, SY + 160, "⛶", 20);
      if (o.highlight === "full") h = hl(SX + SW - 42, SY + 142, 36, 36);
      if (o.highlight === "skip") { s += rect(SX + SW - 130, SY + 130, 120, 36, "rgba(255,255,255,0.9)", 4) + txt(SX + SW - 70, SY + 148, "광고 건너뛰기 ▶", 13, { bold: true, anchor: "middle" }); h = hl(SX + SW - 130, SY + 130, 120, 36); }
      s += txt(SX + 14, SY + 205, "나훈아 노래 모음 베스트", 16, { bold: true }) + txt(SX + 14, SY + 230, "조회수 120만회 · 3년 전", 12, { fill: C.sub });
      s += rect(SX + 14, SY + 250, 80, 34, C.bar, 17) + txt(SX + 54, SY + 267, "👍 2.1만", 13, { anchor: "middle" });
      s += rect(SX + 104, SY + 250, 70, 34, C.bar, 17) + txt(SX + 139, SY + 267, "↗️ 공유", 13, { anchor: "middle" });
      s += circ(SX + 36, SY + 320, 20, "#f6c7a0") + txt(SX + 66, SY + 320, "트로트 채널", 15, { bold: true });
      s += rect(SX + SW - 90, SY + 302, 76, 36, "#000", 18) + txt(SX + SW - 52, SY + 320, "구독", 14, { fill: "#fff", bold: true, anchor: "middle" });
      if (o.highlight === "like") h = hl(SX + 14, SY + 250, 80, 34);
      if (o.highlight === "subscribe") h = hl(SX + SW - 90, SY + 302, 76, 36);
      if (o.highlight === "volume") h = `<rect x="2" y="150" width="10" height="60" rx="4" fill="#555"/>` + hl(0, 150, 12, 60) + txt(60, 150, "옆면 소리 버튼", 14, { bold: true, fill: C.hl });
      s += rect(SX, SY + SH - 60, SW, 60, "#fff", 0) + `<line x1="${SX}" y1="${SY + SH - 60}" x2="${SX + SW}" y2="${SY + SH - 60}" stroke="${C.gray}"/>`;
      [["🏠", "홈"], ["🎬", "Shorts"], ["➕", ""], ["📺", "구독"], ["📂", "보관함"]].forEach(([ic, lb], i) => {
        const x = SX + 30 + i * 58;
        s += emoji(x, SY + SH - 36, ic, 22) + txt(x, SY + SH - 14, lb, 11, { anchor: "middle" });
        if (o.highlight === "subtab" && i === 3) h = hl(x - 24, SY + SH - 56, 48, 52);
      });
      return frame(s + h, { label: o.label });
    },

    // AI 대화 화면: highlight = mic | speaker | copy | retry
    ai(o) {
      let s = rect(SX, SY, SW, SH, "#fff", 0) + txt(SX + SW / 2, SY + 25, "🤖 ChatGPT", 18, { bold: true, anchor: "middle" });
      s += rect(SX + 80, SY + 60, SW - 94, 40, C.bar, 16) + txt(SX + 94, SY + 80, o.q || "오늘 서울 날씨 어때?", 14);
      const ay = SY + 120;
      s += rect(SX + 14, ay, SW - 60, 150, "#f7f7f8", 16);
      (o.a || ["오늘 서울은 맑고", "낮 최고 18도예요.", "가벼운 겉옷을", "챙기시면 좋아요. 😊"]).forEach((l, i) => s += txt(SX + 28, ay + 25 + i * 26, l, 14));
      s += emoji(SX + 34, ay + 170, "🔊", 20) + emoji(SX + 70, ay + 170, "📋", 20) + emoji(SX + 106, ay + 170, "🔄", 20);
      let h = "";
      if (o.highlight === "speaker") h = hl(SX + 18, ay + 154, 32, 32, "circle");
      if (o.highlight === "copy") h = hl(SX + 54, ay + 154, 32, 32, "circle");
      if (o.highlight === "copy2") { s += rect(SX + 60, ay - 46, 160, 40, "#333", 10) + txt(SX + 140, ay - 26, "복사  |  공유", 15, { fill: "#fff", anchor: "middle" }); h = hl(SX + 60, ay - 46, 160, 40); }
      if (o.highlight === "retry") h = hl(SX + 90, ay + 154, 32, 32, "circle");
      const iy = SY + SH - 70;
      s += rect(SX + 14, iy, SW - 28, 56, C.bar, 28) + txt(SX + 34, iy + 28, "무엇이든 물어보세요", 14, { fill: C.sub });
      s += circ(SX + SW - 44, iy + 28, 22, "#000") + emoji(SX + SW - 44, iy + 29, "🎤", 22);
      if (o.highlight === "mic") h = hl(SX + SW - 66, iy + 6, 44, 44, "circle");
      return frame(s + h, { label: o.label });
    },

    // 설정 화면: highlight = display | fontsize
    settings(o) {
      let s = rect(SX, SY, SW, SH, "#f2f2f7", 0) + txt(SX + 16, SY + 28, "⚙️ 설정", 20, { bold: true });
      const items = ["📶 연결", "🔔 알림", "🔆 디스플레이", "🔒 잠금화면", "🔋 배터리", "♿ 접근성"];
      let h = "";
      items.forEach((it, i) => {
        const y = SY + 60 + i * 56;
        s += rect(SX + 14, y, SW - 28, 48, "#fff", 12) + txt(SX + 30, y + 24, it, 15);
        if (o.highlight === "display" && i === 2) h = hl(SX + 14, y, SW - 28, 48);
      });
      if (o.highlight === "fontsize") {
        s = rect(SX, SY, SW, SH, "#f2f2f7", 0) + txt(SX + 16, SY + 28, "◀ 글자 크기", 20, { bold: true });
        s += rect(SX + 14, SY + 70, SW - 28, 120, "#fff", 12) + txt(SX + SW / 2, SY + 110, "가나다", 30, { anchor: "middle" });
        s += `<line x1="${SX + 40}" y1="${SY + 160}" x2="${SX + SW - 40}" y2="${SY + 160}" stroke="${C.gray}" stroke-width="6" stroke-linecap="round"/>`;
        s += circ(SX + 180, SY + 160, 14, C.blue);
        h = hl(SX + 166, SY + 146, 28, 28, "circle") + `<path d="M${SX + 200} ${SY + 160} L${SX + SW - 50} ${SY + 160}" stroke="${C.hl}" stroke-width="6" marker-end="url(#arr3)"/><defs><marker id="arr3" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="${C.hl}"/></marker></defs>`;
      }
      return frame(s + h, { label: o.label });
    },

    // 사기 문자: highlight = link(누르지 마세요 X) | delete
    scam(o) {
      let s = rect(SX, SY, SW, SH, "#fff", 0) + rect(SX, SY, SW, 50, C.bar, 0) + txt(SX + SW / 2, SY + 25, o.from || "010-XXXX-1234", 16, { bold: true, anchor: "middle" });
      s += rect(SX + 14, SY + 80, SW - 60, 150, "#eee", 16);
      const lines = o.lines || ["[CJ택배] 주소 불일치로", "배송이 보류되었습니다.", "주소 확인:", "http://bit.ly/xk2a9"];
      lines.forEach((l, i) => s += txt(SX + 28, SY + 105 + i * 30, l, 14, { fill: i === 3 ? C.blue : C.text }));
      let h = "";
      if (o.highlight === "link") {
        h = `<rect x="${SX + 20}" y="${SY + 180}" width="170" height="34" fill="none" stroke="${C.red}" stroke-width="5" rx="8"/>` +
          `<text x="${SX + 105}" y="${SY + 197}" font-size="60" text-anchor="middle" dominant-baseline="middle" fill="${C.red}" font-weight="700">✕</text>` +
          txt(SX + SW / 2, SY + 270, "절대 누르지 마세요!", 20, { fill: C.red, bold: true, anchor: "middle" });
      }
      if (o.highlight === "delete") {
        s += rect(SX + 40, SY + 260, SW - 80, 50, "#333", 12) + txt(SX + SW / 2, SY + 285, "🗑️ 삭제", 16, { fill: "#fff", bold: true, anchor: "middle" });
        h = hl(SX + 40, SY + 260, SW - 80, 50);
      }
      return frame(s + h, { label: o.label });
    },

    // 영상통화: highlight = end | self | menu(보이스톡/페이스톡 선택)
    videocall(o) {
      let s = rect(SX, SY, SW, SH, "#1c2a3a", 0);
      let h = "";
      if (o.highlight === "menu") {
        // 대화방 위에 통화 메뉴가 뜬 상태
        s = rect(SX, SY, SW, SH, "#b2c7da", 0) + rect(SX, SY, SW, 50, "rgba(255,255,255,0.7)", 0) + txt(SX + 16, SY + 25, "우리 손주", 18, { bold: true });
        s += emoji(SX + SW - 60, SY + 25, "📞", 22) + emoji(SX + SW - 24, SY + 25, "☰", 22);
        s += rect(SX + 40, SY + 70, 200, 110, "#fff", 16);
        s += txt(SX + 64, SY + 100, "🎧 보이스톡", 16) + txt(SX + 64, SY + 150, "📹 페이스톡", 16, { bold: true });
        h = hl(SX + 50, SY + 130, 180, 40);
        if (o.highlight === "menu") return frame(s + h, { label: o.label });
      }
      s += rect(SX, SY + 40, SW, 400, "#f6c7a0", 0) + emoji(SX + SW / 2, SY + 240, "👦", 150);
      s += rect(SX + SW - 100, SY + 60, 86, 120, "#9fc5e8", 12) + emoji(SX + SW - 57, SY + 125, "👵", 50);
      s += txt(SX + SW / 2, SY + 465, "우리 손주  05:12", 16, { fill: "#fff", anchor: "middle" });
      const by = SY + SH - 60;
      s += circ(SX + 70, by, 28, "#444") + emoji(SX + 70, by + 1, "🔇", 24);
      s += circ(SX + SW / 2, by, 34, C.red) + emoji(SX + SW / 2, by + 1, "📞", 30);
      s += circ(SX + SW - 70, by, 28, "#444") + emoji(SX + SW - 70, by + 1, "🔄", 24);
      if (o.highlight === "end") h = hl(SX + SW / 2 - 34, by - 34, 68, 68, "circle");
      if (o.highlight === "self") h = hl(SX + SW - 100, SY + 60, 86, 120);
      return frame(s + h, { dark: true, label: o.label });
    },

    // 큰 그림 하나 + 글 (설명용)
    poster(o) {
      let s = rect(SX, SY, SW, SH, o.bg || "#fff8ef", 0) + emoji(SX + SW / 2, SY + 180, o.icon || "💡", 110);
      (o.lines || []).forEach((l, i) => s += txt(SX + SW / 2, SY + 300 + i * 40, l, 18, { anchor: "middle", bold: i === 0, fill: o.color || C.text }));
      return frame(s, { label: o.label });
    }
  };

  function render(scene) {
    if (!scene || !scenes[scene.type]) return null;
    try { return scenes[scene.type](scene); } catch (e) { console.warn("그림 생성 실패", scene, e); return null; }
  }

  return { render };
})();
