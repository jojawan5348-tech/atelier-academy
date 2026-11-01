// 페이지 틀. build-site.mjs 가 내용 파일과 함께 불러 index.html 을 만듭니다.

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const s = (v) => (v === undefined || v === null ? "" : String(v)).trim();
const PH = "[운영자 입력 필요]";
// 글자 안의 [ ... ] 부분을 눈에 띄는 자리표시자로 감쌉니다.
const txt = (v) => esc(v).replace(/\[([^\]]*)\]/g, '<span class="ph">[$1]</span>');
const orPh = (v, ph = PH) => (s(v) ? txt(v) : txt(ph));

const ICON = {
  up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  menu: '<line x1="4" x2="20" y1="7" y2="7"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="17" y2="17"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  ext: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
};
const icon = (n, cls = "ico") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[n]}</svg>`;

const FONTS =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Nanum+Myeongjo:wght@700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,500&display=swap";

const DEFAULT_GRADES = ["중1", "중2", "중3", "고1", "고2", "고3", "졸업생(재수 이상)", "기타"];

function sectionHead({ eyebrow, title, desc, id, nav }) {
  return `
      <header class="sec-head" data-reveal>
        <p class="eyebrow" lang="en">${esc(eyebrow)}</p>
        <div class="sec-title-row">
          <h2 class="sec-title" id="${id}-title">${title}</h2>${nav || ""}
        </div>${desc ? `\n        <p class="sec-desc">${desc}</p>` : ""}
      </header>`;
}

const sliderNav = (label) => `
          <div class="slider-nav" data-slider-nav>
            <button type="button" class="round-btn" data-prev aria-label="${esc(label)} 이전">${icon("left")}</button>
            <button type="button" class="round-btn" data-next aria-label="${esc(label)} 다음">${icon("right")}</button>
          </div>`;

const emptyCard = (title, desc, tag) => `
        <div class="empty-card" data-reveal>
          ${tag ? `<span class="status-tag">${esc(tag)}</span>` : ""}
          <p class="empty-title">${esc(title)}</p>
          ${desc ? `<p class="empty-desc">${esc(desc)}</p>` : ""}
        </div>`;

function teacherCard(t, imgUrl, i) {
  const name = s(t["이름"]);
  const photo = s(t["사진"]);
  const career = Array.isArray(t["약력"]) ? t["약력"].map(s).filter(Boolean) : [];
  const ph = photo
    ? `<img src="${esc(imgUrl["t-" + photo])}" alt="${esc(name)} 선생님 사진" loading="lazy" decoding="async">`
    : `<span class="t-initial" aria-hidden="true">${esc([...name][0] || "")}</span>`;
  return `
          <article class="t-card" data-reveal style="--i:${i % 4}">
            <div class="t-top">
              <div class="t-photo${photo ? "" : " is-empty"}">${ph}</div>
              <div class="t-text">
                ${s(t["담당"]) ? `<p class="t-role">${txt(t["담당"])}</p>` : ""}
                <h3 class="t-name">${txt(name)}</h3>
                ${s(t["소개"]) ? `<p class="t-intro">${txt(t["소개"])}</p>` : ""}
              </div>
            </div>${
              career.length
                ? `
            <ul class="t-career">${career.map((c) => `<li>${txt(c)}</li>`).join("")}</ul>`
                : ""
            }
          </article>`;
}

function renderTeachers(teachers, imgUrl) {
  const n = teachers.length;
  const slider = n >= 4;
  const head = sectionHead({
    eyebrow: "Teachers",
    title: "함께 그리는 선생님",
    id: "teachers",
    nav: slider ? sliderNav("강사진") : "",
  });
  let body;
  if (!n) body = emptyCard("선생님 소개를 준비하고 있습니다", "");
  else if (slider)
    body = `
        <div class="slider" data-slider aria-roledescription="carousel" aria-label="강사진">
          <div class="slider-track" data-track tabindex="0" aria-label="강사진 카드 목록, 좌우로 넘겨 보세요">
            ${teachers.map((t, i) => teacherCard(t, imgUrl, i)).join("")}
          </div>
          <div class="slider-dots" data-dots aria-hidden="true"></div>
        </div>`;
  else
    body = `
        <div class="teachers teachers--${n}">
          ${teachers.map((t, i) => teacherCard(t, imgUrl, i)).join("")}
        </div>`;
  return `
    <section class="section" id="teachers" aria-labelledby="teachers-title">
      <div class="wrap">${head}${body}
      </div>
    </section>`;
}

function classItem(c, i) {
  const fee = s(c["수업료"]) || "수업료 문의";
  return `
              <div class="class-item" style="--k:${Math.min(i, 4)}">
                <div class="class-row">
                  <h4 class="class-title">${txt(c["수업명"])}</h4>
                  <span class="class-fee">${txt(fee)}</span>
                </div>${s(c["수업시간"]) ? `\n                <p class="class-time">${txt(c["수업시간"])}</p>` : ""}${
    s(c["설명"]) ? `\n                <p class="class-desc">${txt(c["설명"])}</p>` : ""
  }
              </div>`;
}

function groupClasses(classes) {
  const map = new Map();
  for (const c of classes) {
    const g = s(c["학년"]);
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(c);
  }
  return [...map.entries()];
}

function renderClasses(classes) {
  const groups = groupClasses(classes);
  const tabs = groups.length >= 2;
  const head = sectionHead({ eyebrow: "Curriculum", title: "학년별 수업 안내", id: "classes" });
  let body;
  if (!groups.length) body = emptyCard("수업 안내 준비 중", "학년별 수업과 수업료가 정리되면 이곳에 안내합니다.");
  else {
    const panels = groups
      .map(
        ([g, list], gi) => `
          <section class="grade-card" id="grade-${gi}" ${tabs ? `role="tabpanel" aria-labelledby="tab-${gi}" tabindex="0"` : ""} data-panel>
            <h3 class="grade-name">${txt(g)}</h3>
            <div class="class-list">${list.map(classItem).join("")}
            </div>
          </section>`
      )
      .join("");
    body = tabs
      ? `
        <div class="grade-tabs" data-tabs>
          <div class="tab-list" role="tablist" aria-label="학년 선택" data-reveal>
            ${groups
              .map(
                ([g], gi) =>
                  `<button type="button" class="tab" role="tab" id="tab-${gi}" aria-controls="grade-${gi}" aria-selected="${gi === 0}" tabindex="${gi === 0 ? 0 : -1}">${esc(g)}</button>`
              )
              .join("")}
          </div>
          <div class="tab-panels" data-panels data-reveal>${panels}
          </div>
        </div>`
      : `
        <div class="single-grade" data-reveal>${panels}
        </div>`;
  }
  return `
    <section class="section band${tabs ? " has-tabs" : ""}" id="classes" aria-labelledby="classes-title">
      <div class="wrap">${head}${body}
      </div>
    </section>`;
}

function renderCases() {
  return `
    <section class="section" id="cases" aria-labelledby="cases-title">
      <div class="wrap">${sectionHead({ eyebrow: "Portfolio", title: "학생 작품과 합격 사례", id: "cases" })}${emptyCard(
    "확인된 실제 사례가 준비되면 공개합니다",
    "학생 작품과 합격 사례는 보호자 동의와 사실 확인을 거친 뒤 이곳에 올립니다.",
    "준비 중"
  )}
      </div>
    </section>`;
}

function renderVisit(info) {
  const addr = s(info["주소"]);
  const phone = s(info["대표전화"]);
  const hours = (info["운영시간"] || []).filter((h) => s(h["요일"]) || s(h["시간"]));
  const mapId = s(info["네이버지도_ClientID"]);
  const lat = s(info["위도"]);
  const lng = s(info["경도"]);
  const mapLink = addr ? `https://map.naver.com/p/search/${encodeURIComponent(addr)}` : "";
  const isPhv = (v) => !s(v) || /^\[[^\]]*\]$/.test(s(v));
  const hoursHtml = hours.some((h) => !isPhv(h["요일"]) || !isPhv(h["시간"]))
    ? `<dl class="hours">${hours.map((h) => `<dt>${orPh(h["요일"])}</dt><dd>${orPh(h["시간"])}</dd>`).join("")}</dl>`
    : `<p class="info-value">${txt(PH)}</p>`;
  const fallback = `
            <div class="map-fallback" data-map-fallback>
              <span class="map-pin">${icon("pin")}</span>
              <p class="map-addr">${addr ? txt(addr) : "주소가 입력되면 지도 버튼이 표시됩니다."}</p>
              ${
                mapLink
                  ? `<a class="btn btn-outline" href="${esc(mapLink)}" target="_blank" rel="noopener">네이버 지도에서 보기 ${icon("ext")}</a>`
                  : ""
              }
            </div>`;
  const useMap = mapId && lat && lng;
  return `
    <section class="section band" id="visit" aria-labelledby="visit-title">
      <div class="wrap">${sectionHead({ eyebrow: "Visit", title: "오시는 길과 운영 시간", id: "visit" })}
        <div class="visit-grid">
          <div class="info-card" data-reveal>
            <div class="info-item">
              <span class="info-ico">${icon("pin")}</span>
              <div class="info-body"><p class="info-label">주소</p><p class="info-value">${orPh(addr)}</p></div>
            </div>
            <div class="info-item">
              <span class="info-ico">${icon("clock")}</span>
              <div class="info-body"><p class="info-label">운영 시간</p>${hoursHtml}</div>
            </div>
            <div class="info-item">
              <span class="info-ico">${icon("phone")}</span>
              <div class="info-body"><p class="info-label">전화</p><p class="info-value">${
                phone ? `<a class="mono" href="tel:${esc(phone.replace(/-/g, ""))}">${esc(phone)}</a>` : txt(PH)
              }</p></div>
            </div>
          </div>
          <div class="map-card" data-reveal style="--i:1"${
            useMap ? ` data-map-id="${esc(mapId)}" data-lat="${esc(lat)}" data-lng="${esc(lng)}" data-name="${esc(s(info["학원이름"]))}"` : ""
          }>
            <div class="map-canvas" data-map-canvas hidden role="img" aria-label="${esc(s(info["학원이름"]))} 위치 지도"></div>${fallback}
          </div>
        </div>
      </div>
    </section>`;
}

// 개인정보 안내 한 줄: "항목 이름: 값". 값은 의미 단위 조각으로 나눠, 줄이 넘어가도 조각 사이에서만 넘어가게 합니다.
const pv = (label, parts, isHtml) =>
  `<li class="pv-item"><span class="pv-k">${label}:</span> ${parts
    .map((p) => `<span class="nw">${isHtml ? p : esc(p)}</span>`)
    .join(" ")}</li>`;
// 값이 여러 개인 항목: "이름:" 아래에 한 줄씩
const pvList = (label, lines, head) =>
  `<li class="pv-item">${label}:${head ? ` ${head}` : ""}<ul class="pv-sub">${lines.map((l) => `<li>${l}</li>`).join("")}</ul></li>`;

function privacyBlock(info) {
  const rep = s(info["대표자"]);
  const receiver = rep && !/^\[.*\]$/.test(rep) ? txt(rep) : txt("[대표자(수신자) 입력 필요]");
  return `
            <details class="privacy" id="privacy">
              <summary>
                <span class="privacy-title">개인정보 수집·이용 안내</span>
                <span class="privacy-more">자세히 보기 ${icon("down", "ico chev")}</span>
              </summary>
              <div class="privacy-body">
                <p class="pv-h">1. 개인정보 수집·이용</p>
                <ul>
                  ${pv("수집 항목", ["이름, 연락처, 학년, 문의 내용"])}
                  ${pv("이용 목적", ["상담 신청 확인·연락,", "일정 안내"])}
                  ${pv("수신자", [receiver], true)}
                  ${pv("보유 및 이용 기간", ["상담 종료 후 파기", "(접수일로부터 30일 이내)"])}
                </ul>
                <p class="pv-h">2. 개인정보 국외 이전 안내</p>
                <ul>
                  ${pvList("이전받는 자", ["Netlify(사이트·서버 운영)", "Resend(이메일 발송)"])}
                  ${pvList("연락처", [
                    'Netlify: <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener">개인정보처리방침</a>',
                    'Resend: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">개인정보처리방침</a>',
                  ], "각 사 개인정보처리방침의 문의처")}
                  ${pv("이전 국가", ["미국"])}
                  ${pv("시기·방법", ["상담 신청 시", "인터넷망으로 전송"])}
                  ${pv("이전 항목", ["위 수집 항목 전체"])}
                  ${pvList("이용 목적·기간", ["목적: 상담 내용 이메일 전달(처리 위탁)", "기간: 위 보유 기간과 같음"])}
                </ul>
                <p class="pv-h">3. 동의 거부 안내</p>
                <p>개인정보 수집·이용 및 위 국외 이전에 동의하지 않을 수 있습니다. 동의하지 않을 시 온라인 상담 신청이 제한되며, 전화 또는 카카오톡으로 상담할 수 있습니다. 입력한 내용은 별도 데이터베이스에 저장하지 않습니다.</p>
              </div>
            </details>`;
}

function renderConsult(info, grades) {
  const phone = s(info["대표전화"]);
  const endpoint = s(info["상담접수주소"]);
  const second = phone ? `바로 상담은 ${esc(phone)} 또는 카카오톡 상담으로 문의해 주세요.` : "바로 상담은 전화 또는 카카오톡 상담으로 문의해 주세요.";
  const opts = (grades.length ? grades : DEFAULT_GRADES).map((g) => `<option value="${esc(g)}">${esc(g)}</option>`).join("");
  return `
    <section class="section" id="consult" aria-labelledby="consult-title">
      <div class="wrap">
        <div class="consult-col">${sectionHead({
          eyebrow: "Contact",
          title: "상담 신청",
          id: "consult",
          desc: `아래 내용을 작성해 주시면 확인 후 연락드리겠습니다. ${second}`,
        })}
          <form class="form" id="consult-form" novalidate data-endpoint="${esc(endpoint)}" data-reveal>
            <div class="hp" aria-hidden="true">
              <label for="f-website">웹사이트</label>
              <input type="text" id="f-website" name="website" tabindex="-1" autocomplete="off">
            </div>
            <div class="field">
              <label for="f-name">이름 <span class="req">(필수)</span></label>
              <input id="f-name" name="name" type="text" autocomplete="name" maxlength="30" required aria-describedby="e-name" aria-invalid="false">
              <p class="err" id="e-name" hidden></p>
            </div>
            <div class="field">
              <label for="f-phone">연락처 <span class="req">(필수)</span></label>
              <input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="010-0000-0000" required aria-describedby="e-phone" aria-invalid="false">
              <p class="err" id="e-phone" hidden></p>
            </div>
            <div class="field">
              <label for="f-grade">대상 학년 <span class="req">(필수)</span></label>
              <div class="select-wrap">
                <select id="f-grade" name="grade" required aria-describedby="e-grade" aria-invalid="false">
                  <option value="">선택해 주세요</option>${opts}
                </select>
                ${icon("down", "ico select-chev")}
              </div>
              <p class="err" id="e-grade" hidden></p>
            </div>
            <div class="field">
              <label for="f-msg">문의 내용 <span class="opt">(선택)</span></label>
              <textarea id="f-msg" name="message" rows="4" maxlength="500" aria-describedby="c-msg"></textarea>
              <p class="count" id="c-msg"><span data-count>0</span> / 500자</p>
            </div>
            <div class="field consent">
              <div class="check">
                <input id="f-agree" name="agree" type="checkbox" required aria-describedby="e-agree" aria-invalid="false">
                <label for="f-agree">개인정보 수집·이용에 동의합니다. <span class="req">(필수)</span></label>
              </div>
              <p class="err" id="e-agree" hidden></p>${privacyBlock(info)}
            </div>${
              endpoint
                ? ""
                : `
            <p class="draft-note">지금은 화면 확인용 시안이라 신청 내용이 실제로 전달되지 않습니다.</p>`
            }
            <button type="submit" class="btn btn-accent btn-block" data-submit>상담 신청하기</button>
            <div class="form-msg" data-form-msg role="alert" hidden></div>
          </form>
          <div class="done-card" data-done hidden tabindex="-1">
            <p class="done-title">상담 신청이 접수되었습니다.</p>
            <p class="done-desc">입력해 주신 연락처로 확인 후 연락드리겠습니다. 감사합니다.</p>
            <button type="button" class="btn btn-outline" data-reset>새로 작성하기</button>
          </div>
        </div>
      </div>
    </section>`;
}

function renderFooter(info) {
  const name = s(info["학원이름"]);
  const v = (k) => orPh(info[k]);
  const phone = s(info["대표전화"]);
  const tel = phone ? `<a href="tel:${esc(phone.replace(/-/g, ""))}">${esc(phone)}</a>` : txt(PH);
  const row = (items) => `<p class="f-row">${items.map(([k, val]) => `<span class="f-item">${k}: ${val}</span>`).join("")}</p>`;
  return `
  <footer class="footer">
    <div class="wrap">
      <p class="f-name">${esc(name)}</p>
      <div class="f-info">
        ${row([["대표전화", tel], ["상담 운영시간", v("상담운영시간")]])}
        ${row([["대표자", v("대표자")], ["사업자등록번호", v("사업자등록번호")]])}
        ${row([["주소", v("주소")], ["개인정보보호책임자", v("개인정보보호책임자")]])}
        ${row([["학원등록번호", v("학원등록번호")]])}
      </div>
      <p class="f-copy">© ${new Date().getFullYear()} ${esc(name)}. All rights reserved.</p>
    </div>
  </footer>`;
}

// ---- 붓 획 만들기: 중심선(M/C/S/L 경로)을 따라 굵기가 줄어드는 면을 계산한다 ----
function parsePath(d) {
  const tok = d.match(/[MCSL]|-?\d+(\.\d+)?/g);
  const segs = [];
  let i = 0, cur = [0, 0], prevC2 = null, cmd = null;
  const num = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[MCSL]/.test(tok[i])) cmd = tok[i++];
    if (cmd === "M") { cur = [num(), num()]; prevC2 = null; }
    else if (cmd === "L") { const p = [num(), num()]; segs.push([cur, cur, p, p]); cur = p; prevC2 = null; }
    else if (cmd === "C") { const c1 = [num(), num()], c2 = [num(), num()], p = [num(), num()]; segs.push([cur, c1, c2, p]); prevC2 = c2; cur = p; }
    else if (cmd === "S") { const c1 = prevC2 ? [2 * cur[0] - prevC2[0], 2 * cur[1] - prevC2[1]] : cur; const c2 = [num(), num()], p = [num(), num()]; segs.push([cur, c1, c2, p]); prevC2 = c2; cur = p; }
  }
  const pts = [];
  segs.forEach(([p0, p1, p2, p3], si) => {
    for (let k = si ? 1 : 0; k <= 28; k++) {
      const t = k / 28, u = 1 - t;
      pts.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
  });
  return pts;
}
function rng(seed) { let x = seed * 9301 + 49297; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); }
function brush(d, w0, seed, end = 0.22) {
  const pts = parsePath(d), r = rng(seed), n = pts.length;
  let len = [0];
  for (let i = 1; i < n; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = len[n - 1];
  const L1 = [], R1 = [];
  let wob = 1;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
    const nx = -dy / m, ny = dx / m, t = len[i] / L;
    wob = wob * 0.8 + (0.75 + r() * 0.5) * 0.2;            // 붓 압력의 흔들림
    const press = Math.min(1, t * 10) * 0.35 + 0.65;          // 붓을 대는 시작
    const w = (w0 * (1 - (1 - end) * Math.pow(t, 0.9)) * press * wob) / 2;
    L1.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    R1.push([pts[i][0] - nx * w * (0.8 + r() * 0.3), pts[i][1] - ny * w * (0.8 + r() * 0.3)]);
  }
  const f = (p) => p[0].toFixed(1) + " " + p[1].toFixed(1);
  const body = "M" + L1.map(f).join(" L") + " L" + R1.reverse().map(f).join(" L") + " Z";
  // 비백(마른 붓 자국): 줄기 안쪽에 바탕색의 가는 틈
  const dry = [];
  if (w0 > 8) for (const off of [-0.18, 0.22]) {
    const q = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; const t = len[i] / L; const w = w0 * (1 - (1 - end) * t); return [p[0] - (dy / m) * w * off, p[1] + (dx / m) * w * off]; });
    dry.push("M" + q.map(f).join(" L"));
  }
  return { body, dry, center: d, w0, pts };
}

// 동양화 매화 가지 (놋쇠색 한 가지 색, 음영 없음). 좌표는 400×500 화폭 기준, 밑동은 오른쪽 아래(404, 500).
// 각 획은 밑동→가지 끝 방향으로 적는다. 먹은 밑동에서 시작해 일정한 속도로 가지를 따라 흐르고,
// 꽃은 먹이 그 자리에 닿는 순간 핀다(가지와 꽃이 한 흐름).
const PLUM_STROKES = [
  // [경로, 밑동 굵기, 끝 굵기 비율]
  ["M404 500 C 370 476, 338 446, 322 414 C 302 374, 258 334, 234 294 C 222 266, 238 240, 242 204 C 246 164, 252 128, 270 94 C 284 64, 294 36, 304 8", 32, 0.06],
  ["M404 500 C 370 476, 338 446, 322 414 C 298 374, 262 342, 222 320 C 180 298, 138 284, 84 270", 32, 0.06],
  ["M336 436 C 304 422, 272 410, 240 402 C 190 392, 130 396, 70 414", 13, 0.1],
  ["M250 176 C 272 166, 300 146, 332 126", 6, 0.2],
  ["M236 252 C 208 238, 180 224, 150 212", 6, 0.2],
  ["M150 212 C 144 190, 148 168, 162 148", 3.5, 0.3],
  ["M190 306 C 178 286, 164 270, 146 258", 4.5, 0.25],
  ["M324 408 C 334 388, 330 372, 320 352", 7, 0.25],
  ["M302 416 C 296 436, 300 458, 312 474", 5, 0.25],
  ["M170 394 C 160 378, 150 368, 134 360", 3.5, 0.3],
  ["M262 112 C 250 98, 238 90, 224 86", 3, 0.3],
  ["M120 280 C 112 266, 100 258, 86 256", 3, 0.3],
];
// 꽃송이 무리: [x, y, 꽃 수, 크기]
const PLUM_CLUSTERS = [
  [302, 18, 3, 0.95], [292, 44, 3, 1], [278, 74, 2, 0.9], [268, 104, 3, 1], [258, 136, 2, 0.9], [250, 166, 3, 1.05], [244, 212, 2, 0.95],
  [326, 128, 3, 1], [306, 142, 2, 0.9], [226, 86, 2, 0.85],
  [88, 270, 3, 1], [112, 276, 2, 0.9], [138, 286, 3, 1.05], [168, 298, 2, 0.95], [196, 310, 2, 0.9], [146, 258, 2, 0.85],
  [152, 212, 3, 1], [160, 160, 3, 1], [180, 222, 2, 0.9],
  [74, 412, 3, 1], [104, 402, 3, 1.05], [136, 396, 2, 0.95], [134, 360, 2, 0.9], [168, 392, 3, 1], [204, 396, 2, 0.95], [236, 402, 3, 1.05], [268, 410, 2, 0.95],
  [316, 470, 3, 1], [322, 356, 2, 0.9],
];
const PLUM_INK_TIME = 1.6;  // 먹이 가장 먼 가지 끝에 닿는 시간(초)
const PLUM_BLOOM = 0.35;    // 꽃 한 송이가 피는 시간(초) → 그림 전체 약 2초

function heroPlum(id, keep) {
  // keep: 이 그림에 쓸 획 번호 목록
  const strokes = PLUM_STROKES.map(([d, w, end], i) => ({ i, w, b: brush(d, w, i + 7, end) })).filter((x) => keep.includes(x.i));
  // 각 획의 점마다 "밑동에서 먹이 닿는 거리"를 계산
  const nearest = (p, list) => {
    let best = null;
    for (const st of list) st.arc.forEach((a, k) => { const q = st.b.pts[k]; const dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (!best || dd < best.dd) best = { dd, arc: a, st }; });
    return best;
  };
  const done = [];
  for (const st of strokes) {
    const pts = st.b.pts;
    const own = [0];
    for (let k = 1; k < pts.length; k++) own.push(own[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const start = done.length ? nearest(pts[0], done) : null;
    st.start = start && start.dd < 30 ? start.arc : 0;
    st.len = own[own.length - 1];
    st.arc = own.map((a) => a + st.start);
    done.push(st);
  }
  const maxArc = Math.max(...done.map((st) => st.arc[st.arc.length - 1]));
  const v = maxArc / PLUM_INK_TIME;
  const marks = done.map((st) => `
          <mask id="${id}-m${st.i}" maskUnits="userSpaceOnUse" x="-40" y="-40" width="480" height="580"><path class="pl-reveal" d="${st.b.center}" stroke-width="${(st.w * 2).toFixed(0)}" pathLength="1" style="--dl:${(st.start / v).toFixed(2)}s;--du:${(st.len / v).toFixed(2)}s"/></mask>
          <path class="pl-ink" d="${st.b.body}" mask="url(#${id}-m${st.i})"/>`);
  const r = rng(42);
  const flowers = [];
  PLUM_CLUSTERS.forEach(([cx, cy, n, k], ci) => {
    const near = nearest([cx, cy], done);
    const items = [];
    for (let j = 0; j < n; j++) {
      const x = cx + (r() - 0.5) * 16 * k, y = cy + (r() - 0.5) * 12 * k, kk = k * (0.75 + r() * 0.4);
      const rot = r() * 72, pr = 3.1 * kk, pd = 3.3 * kk;
      const pet = [0, 72, 144, 216, 288].map((deg) => { const t = ((deg + rot) * Math.PI) / 180; return `<circle cx="${(x + Math.cos(t) * pd).toFixed(1)}" cy="${(y + Math.sin(t) * pd).toFixed(1)}" r="${pr.toFixed(1)}"/>`; }).join("");
      items.push([x, y, `${pet}<circle class="pl-hole" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.1 * kk).toFixed(1)}"/>`]);
    }
    if (!near || near.dd > 26) return; // 이 그림에 없는 가지의 꽃은 뺀다
    const t = (near.arc / v).toFixed(2);
    items.forEach(([x, y, inner]) => flowers.push(`<g class="pl-flower" style="--t:${t}s;transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px">${inner}</g>`));
    if (ci % 2 === 0) { const x = cx + 9 * k, y = cy - 7 * k; flowers.push(`<circle class="pl-bud" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2.2 * k).toFixed(1)}" style="--t:${t}s;transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px"/>`); }
  });
  return `
      <svg class="plum ${id}" viewBox="0 0 400 500" focusable="false">
        <g class="pl-sway"><g class="pl-all">${marks.join("")}
          ${flowers.join("")}
        </g></g>
      </svg>`;
}

function heroPlums() {
  // 두 가지: 오른쪽 아래에서 올라오는 큰 가지, 왼쪽 위에서 늘어지는 작은 가지(같은 붓질을 180° 돌리고 일부만 사용)
  return `
    <div class="plum-wrap" aria-hidden="true">${heroPlum("plum-a", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])}${heroPlum("plum-b", [1, 2, 6, 7, 9, 11])}
    </div>`;
}

export function renderPage({ info, classes, teachers, popups, css, js, imgUrl, artifact, isPh }) {
  const name = s(info["학원이름"]) || "학원";
  const lead = s(info["첫화면_소개"]);
  const about = info["학원소개"] || {};
  const helps = Array.isArray(about["도움"]) ? about["도움"] : [];
  const grades = groupClasses(classes).map(([g]) => g);
  const kakao = s(info["카카오톡_주소"]);
  const phone = s(info["대표전화"]);

  const popupData = popups.map((p) => ({ ...p, src: imgUrl[p.src] }));
  const config = { popups: popupData, phone, kakao };

  const nav = [
    ["about", "학원 소개"],
    ["teachers", "강사진"],
    ["classes", "수업 안내"],
    ["cases", "사례"],
    ["visit", "위치·운영"],
  ];
  const navLinks = nav.map(([id, label], i) => `<li style="--n:${i}"><a href="#${id}">${label}</a></li>`).join("");

  const head = `<title>${esc(name)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${esc(lead || name)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>document.documentElement.classList.add("js");document.documentElement.lang="ko";</script>
<style>
${css}
</style>`;

  const body = `
<a class="skip" href="#main">본문으로 바로가기</a>
<header class="site-header" data-header>
  <div class="wrap header-inner">
    <a class="logo" href="#top" data-home>${esc(name)}</a>
    <nav class="nav" aria-label="주 메뉴">
      <button type="button" class="menu-btn" data-menu-btn aria-expanded="false" aria-controls="nav-list" aria-label="메뉴 열기">${icon("menu", "ico i-menu")}${icon("x", "ico i-close")}</button>
      <ul class="nav-list" id="nav-list" data-nav>${navLinks}</ul>
    </nav>
  </div>
</header>

<main id="main">
  <section class="hero" id="top" aria-labelledby="hero-title" data-hero>
    ${heroPlums()}
    <div class="wrap hero-inner">
      <h1 class="hero-name" id="hero-title" tabindex="-1">${esc(name)}</h1>
      ${lead ? `<p class="hero-lead">${txt(lead)}</p>` : ""}
      <a class="btn btn-accent btn-hero" href="#consult">상담 신청하기</a>
    </div>
  </section>

  <section class="section band" id="about" aria-labelledby="about-title">
    <div class="wrap about-grid">${sectionHead({ eyebrow: "About", title: txt(s(about["제목"]) || "학원 소개"), id: "about", desc: orPh(about["소개"]) })}
      <ul class="help-list">${helps
        .map(
          (h, i) => `
        <li class="help-item" data-reveal style="--i:${i}">
          <p class="help-q">${orPh(h["어려움"])}</p>
          <p class="help-a">${orPh(h["설명"])}</p>
        </li>`
        )
        .join("")}
      </ul>
    </div>
  </section>
${renderTeachers(teachers, imgUrl)}
${renderClasses(classes)}
${renderCases()}
${renderVisit(info)}
${renderConsult(info, grades)}
</main>
${renderFooter(info)}

<div class="quick" data-quick>
  <button type="button" class="quick-btn" data-to-top aria-label="맨 위로 이동" hidden>${icon("up")}</button>
  ${
    phone
      ? `<a class="quick-btn" href="tel:${esc(phone.replace(/-/g, ""))}" aria-label="전화 상담 ${esc(phone)}">${icon("phone")}</a>`
      : `<button type="button" class="quick-btn" data-phone-soon aria-label="전화 상담 (번호 등록 예정)">${icon("phone")}</button>`
  }
  ${
    kakao
      ? `<a class="quick-btn" href="${esc(kakao)}" target="_blank" rel="noopener" aria-label="카카오톡 상담 (새 창)">${icon("chat")}</a>`
      : `<button type="button" class="quick-btn" data-kakao-soon aria-label="카카오톡 상담 (추후 연결 예정)">${icon("chat")}</button>`
  }
</div>
<div class="toast" data-toast role="status" aria-live="polite" hidden></div>
<div class="popup-layer" data-popup-layer hidden></div>

<script type="application/json" id="site-config">${JSON.stringify(config).replace(/</g, "\\u003c")}</script>
<script>
${js}
</script>`;

  if (artifact) return head + "\n" + body + "\n";
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body>${body}
</body>
</html>
`;
}
