(function () {
  "use strict";
  var root = document.documentElement;
  var cfg = {};
  try { cfg = JSON.parse(document.getElementById("site-config").textContent) || {}; } catch (e) { cfg = {}; }
  var rmQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function rm() { return !!(rmQuery && rmQuery.matches); }
  var hoverQuery = window.matchMedia ? window.matchMedia("(hover: hover) and (pointer: fine)") : null;
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- 화면 높이 고정 ----------
     휴대폰은 스크롤할 때 주소창이 접히며 화면 높이가 바뀝니다. 페이지를 열 때 한 번 재서 픽셀로 고정하고,
     가로 폭이 바뀔 때(화면 회전 등)만 다시 잽니다. */
  (function fixHeight() {
    var probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:0;top:0;width:1px;visibility:hidden;pointer-events:none;height:100vh;height:100lvh;";
    var lastW = 0;
    function measure() {
      document.body.appendChild(probe);
      var h = Math.max(probe.getBoundingClientRect().height, window.innerHeight);
      document.body.removeChild(probe);
      root.style.setProperty("--fixed-h", Math.round(h) + "px");
      lastW = window.innerWidth;
    }
    measure();
    window.addEventListener("resize", function () { if (window.innerWidth !== lastW) measure(); });
  })();

  /* ---------- 토스트 ---------- */
  var toastEl = $("[data-toast]");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  /* ---------- 헤더·메뉴 ---------- */
  var header = $("[data-header]");
  var menuBtn = $("[data-menu-btn]");
  var heroTitle = $("#hero-title");
  function setMenu(open) {
    if (!header || !menuBtn) return;
    header.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () { setMenu(!header.classList.contains("is-open")); });
  }
  $$("[data-nav] a").forEach(function (a) {
    a.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header && header.classList.contains("is-open") && !popupActive) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  document.addEventListener("click", function (e) {
    if (header && header.classList.contains("is-open") && !header.contains(e.target)) setMenu(false);
  });

  function goHome(e) {
    if (e) e.preventDefault();
    setMenu(false);
    try { history.replaceState(null, "", location.pathname + location.search); } catch (err) { /* 무시 */ }
    window.scrollTo({ top: 0, left: 0, behavior: rm() ? "auto" : "smooth" });
    if (heroTitle) heroTitle.focus({ preventScroll: true });
  }
  var home = $("[data-home]");
  if (home) home.addEventListener("click", goHome);

  /* ---------- 첫 화면: 화면 밖이면 움직임 멈춤 ---------- */
  var hero = $("[data-hero]");
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      hero.classList.toggle("is-paused", !entries[0].isIntersecting);
    }).observe(hero);
  }

  /* ---------- 스크롤 등장 ---------- */
  if (!rm() && "IntersectionObserver" in window) {
    var vh = window.innerHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("rv-in");
        el.classList.remove("rv-wait");
        io.unobserve(el);
        setTimeout(function () { el.classList.remove("rv-in"); el.style.removeProperty("--i"); }, 1200);
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (el) {
      if (el.getBoundingClientRect().top > vh) {
        el.classList.add("rv-wait");
        io.observe(el);
      }
    });
  }

  /* ---------- 학년 탭 ---------- */
  $$("[data-tabs]").forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    var wrap = $("[data-panels]", box);
    var panels = $$("[data-panel]", box);
    var current = 0;
    panels.forEach(function (p, i) { p.hidden = i !== 0; });
    function select(idx, focus) {
      if (idx === current) { if (focus) tabs[idx].focus(); return; }
      var animate = !rm();
      var from = wrap.offsetHeight;
      tabs.forEach(function (t, i) {
        t.setAttribute("aria-selected", i === idx ? "true" : "false");
        t.tabIndex = i === idx ? 0 : -1;
      });
      panels[current].hidden = true;
      panels[current].classList.remove("anim-in");
      panels[idx].hidden = false;
      current = idx;
      if (focus) tabs[idx].focus();
      tabs[idx].scrollIntoView({ block: "nearest", inline: "nearest", behavior: animate ? "smooth" : "auto" });
      if (!animate) return;
      var p = panels[idx];
      p.classList.remove("anim-in");
      void p.offsetWidth;
      p.classList.add("anim-in");
      var to = wrap.offsetHeight;
      if (from === to) return;
      wrap.style.height = from + "px";
      wrap.classList.add("is-sizing");
      void wrap.offsetWidth;
      wrap.style.height = to + "px";
      var done = function () {
        wrap.style.height = "";
        wrap.classList.remove("is-sizing");
        wrap.removeEventListener("transitionend", onEnd);
      };
      var onEnd = function (e) { if (e.target === wrap) done(); };
      wrap.addEventListener("transitionend", onEnd);
      setTimeout(done, 520);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (e) {
        var n = tabs.length, k = e.key, to = null;
        if (k === "ArrowRight") to = (i + 1) % n;
        else if (k === "ArrowLeft") to = (i - 1 + n) % n;
        else if (k === "Home") to = 0;
        else if (k === "End") to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });
  });

  /* ---------- 옆으로 넘기기 (강사진 4명 이상 · 사례 공용) ---------- */
  $$("[data-slider]").forEach(function (slider) {
    var section = slider.closest("section") || document;
    var track = $("[data-track]", slider);
    var nav = $("[data-slider-nav]", section);
    var prev = nav && $("[data-prev]", nav);
    var next = nav && $("[data-next]", nav);
    var dotsBox = $("[data-dots]", slider);
    var items = Array.prototype.slice.call(track.children);
    var INTERVAL = 4500, PAUSE = 8000;
    var pauseUntil = 0, hovering = false, focusInside = false, visibleEnough = false;
    var pages = [];

    function offsetOf(el) {
      return el.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    }
    function maxScroll() { return Math.max(0, track.scrollWidth - track.clientWidth); }
    function perView() {
      if (!items.length) return 1;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return Math.max(1, Math.floor((track.clientWidth + gap + 2) / (items[0].getBoundingClientRect().width + gap)));
    }
    function build() {
      var per = perView();
      var max = maxScroll();
      pages = [];
      for (var i = 0; i < items.length; i += per) {
        var x = Math.min(offsetOf(items[i]) - offsetOf(items[0]), max);
        if (!pages.length || x > pages[pages.length - 1] + 2) pages.push(x);
      }
      if (max > 2 && pages[pages.length - 1] < max - 2) pages.push(max);
      if (!pages.length) pages = [0];
      if (dotsBox) {
        if (pages.length <= 1) dotsBox.innerHTML = "";
        else if (pages.length > 12) dotsBox.innerHTML = '<span class="count" data-count></span>';
        else dotsBox.innerHTML = pages.map(function () { return '<span class="dot"></span>'; }).join("");
      }
      update();
    }
    function currentPage() {
      var x = track.scrollLeft, best = 0;
      if (x >= maxScroll() - 2) return pages.length - 1;
      for (var i = 0; i < pages.length; i++) { if (Math.abs(pages[i] - x) < Math.abs(pages[best] - x)) best = i; }
      return best;
    }
    function update() {
      var x = track.scrollLeft, max = maxScroll();
      if (prev) prev.disabled = x <= 2;
      if (next) next.disabled = x >= max - 2;
      if (!dotsBox) return;
      var cur = currentPage();
      var count = $("[data-count]", dotsBox);
      if (count) count.textContent = cur + 1 + " / " + pages.length;
      $$(".dot", dotsBox).forEach(function (d, i) { d.classList.toggle("on", i === cur); });
    }
    function go(idx) {
      idx = Math.max(0, Math.min(pages.length - 1, idx));
      track.scrollTo({ left: pages[idx], behavior: rm() ? "auto" : "smooth" });
    }
    function userPause() { pauseUntil = Date.now() + PAUSE; }
    if (prev) prev.addEventListener("click", function () { userPause(); go(currentPage() - 1); });
    if (next) next.addEventListener("click", function () { userPause(); go(currentPage() + 1); });
    ["pointerdown", "wheel", "touchstart", "keydown"].forEach(function (ev) {
      track.addEventListener(ev, userPause, { passive: true });
    });
    slider.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hovering = true; });
    slider.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") hovering = false; });
    track.addEventListener("focusin", function () { focusInside = true; });
    track.addEventListener("focusout", function (e) { if (!track.contains(e.relatedTarget)) focusInside = false; });
    var raf = 0;
    track.addEventListener("scroll", function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; update(); });
    }, { passive: true });
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(build, 150); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visibleEnough = en[0].intersectionRatio >= 0.6; }, { threshold: [0, 0.6, 1] }).observe(track);
    } else visibleEnough = true;
    setInterval(function () {
      if (rm() || pages.length <= 1 || hovering || focusInside || !visibleEnough || document.hidden) return;
      if (Date.now() < pauseUntil) return;
      var cur = currentPage();
      go(cur >= pages.length - 1 ? 0 : cur + 1);
    }, INTERVAL);
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  });

  /* ---------- 네이버 지도 ---------- */
  var mapCard = $(".map-card[data-map-id]");
  if (mapCard) {
    var canvas = $("[data-map-canvas]", mapCard);
    var fallback = $("[data-map-fallback]", mapCard);
    var settled = false;
    var showFallback = function () { if (settled) return; settled = true; canvas.hidden = true; fallback.hidden = false; };
    window.navermap_authFailure = showFallback;
    var timer = setTimeout(showFallback, 10000);
    var sc = document.createElement("script");
    sc.src = "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=" + encodeURIComponent(mapCard.getAttribute("data-map-id"));
    sc.async = true;
    sc.onerror = function () { clearTimeout(timer); showFallback(); };
    sc.onload = function () {
      clearTimeout(timer);
      try {
        var nm = window.naver && window.naver.maps;
        if (!nm) return showFallback();
        var pos = new nm.LatLng(parseFloat(mapCard.getAttribute("data-lat")), parseFloat(mapCard.getAttribute("data-lng")));
        canvas.hidden = false;
        fallback.hidden = true;
        var map = new nm.Map(canvas, { center: pos, zoom: 16 });
        new nm.Marker({ position: pos, map: map, title: mapCard.getAttribute("data-name") || "" });
        settled = true;
      } catch (err) { showFallback(); }
    };
    document.head.appendChild(sc);
  }

  /* ---------- 상담 폼 ---------- */
  var form = $("#consult-form");
  if (form) {
    var done = $("[data-done]");
    var msgBox = $("[data-form-msg]", form);
    var submitBtn = $("[data-submit]", form);
    var endpoint = form.getAttribute("data-endpoint") || "";
    var openedAt = Date.now();
    var submitted = false, busy = false;
    var F = {
      name: { el: $("#f-name"), err: $("#e-name"), dirty: false },
      phone: { el: $("#f-phone"), err: $("#e-phone"), dirty: false },
      grade: { el: $("#f-grade"), err: $("#e-grade") },
      agree: { el: $("#f-agree"), err: $("#e-agree") },
    };
    var msg = $("#f-msg");
    var count = $("[data-count]", form);
    var rules = {
      name: function (v) { v = v.trim(); if (!v) return "이름을 입력해 주세요."; if (v.length > 30) return "이름은 30자 이내로 입력해 주세요."; return ""; },
      phone: function (v) {
        v = v.trim();
        if (!v) return "연락처를 입력해 주세요.";
        if (/[^0-9\-\s()]/.test(v) || !/^0\d{8,10}$/.test(v.replace(/\D/g, ""))) return "연락처 형식이 올바르지 않습니다. 예: 010-0000-0000";
        return "";
      },
      grade: function (v) { return v ? "" : "학년을 선택해 주세요."; },
      agree: function (_, el) { return el.checked ? "" : "개인정보 수집·이용에 동의해 주세요."; },
    };
    function show(key, text) {
      var f = F[key];
      f.err.textContent = text;
      f.err.hidden = !text;
      f.el.setAttribute("aria-invalid", text ? "true" : "false");
    }
    function check(key) { var f = F[key]; var t = rules[key](f.el.value || "", f.el); show(key, t); return !t; }
    ["name", "phone"].forEach(function (k) {
      var f = F[k];
      f.el.addEventListener("input", function () {
        f.dirty = true;
        if (!f.err.hidden) check(k);
      });
      f.el.addEventListener("blur", function () { if (f.dirty || submitted) check(k); });
    });
    F.grade.el.addEventListener("change", function () { if (submitted) check("grade"); });
    F.agree.el.addEventListener("change", function () { if (submitted) check("agree"); });
    if (msg && count) msg.addEventListener("input", function () { count.textContent = String(msg.value.length); });

    function contactHtml() {
      var parts = [];
      if (cfg.phone) parts.push('전화 <a href="tel:' + esc(cfg.phone.replace(/-/g, "")) + '">' + esc(cfg.phone) + "</a>");
      else parts.push("전화");
      if (cfg.kakao) parts.push('<a href="' + esc(cfg.kakao) + '" target="_blank" rel="noopener">카카오톡 상담</a>');
      else parts.push("카카오톡(추후 연결 예정)");
      return parts.join(" 또는 ");
    }
    function showMsg(kind, title, text) {
      msgBox.className = "form-msg is-" + kind;
      msgBox.innerHTML = '<p class="form-msg-title">' + esc(title) + "</p><p>" + text + "</p>";
      msgBox.hidden = false;
    }
    function setBusy(b) {
      busy = b;
      submitBtn.disabled = b;
      submitBtn.textContent = b ? "전송 중..." : "상담 신청하기";
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      submitted = true;
      msgBox.hidden = true;
      var order = ["name", "phone", "grade", "agree"];
      var firstBad = null;
      order.forEach(function (k) { if (!check(k) && !firstBad) firstBad = k; });
      if (firstBad) { F[firstBad].el.focus(); return; }
      if ($("#f-website").value) return; // 스팸 방지 칸이 채워지면 조용히 종료
      if (!endpoint) {
        showMsg("info", "화면 확인용 시안입니다.", "신청 내용은 실제로 전달되지 않았습니다. 상담은 " + contactHtml() + "으로 문의해 주세요.");
        return;
      }
      var payload = {
        name: F.name.el.value.trim(),
        phone: F.phone.el.value.trim(),
        grade: F.grade.el.value,
        message: msg ? msg.value.trim() : "",
        agree: F.agree.el.checked,
        website: $("#f-website").value,
        elapsed: Date.now() - openedAt,
      };
      setBusy(true);
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined,
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) { return { res: res, data: data }; });
        })
        .then(function (r) {
          clearTimeout(t);
          setBusy(false);
          if (r.res.ok && r.data && r.data.ok === true) {
            form.hidden = true;
            done.hidden = false;
            done.focus();
            return;
          }
          var code = r.data && r.data.code;
          if (code === "too_fast") showMsg("error", "조금 뒤에 다시 신청해 주세요.", "페이지를 연 직후에는 신청할 수 없습니다. 잠시 뒤 다시 눌러 주세요. 급하시면 " + contactHtml() + "으로 문의해 주세요.");
          else if (r.res.status === 429) showMsg("error", "신청이 잠시 제한되었습니다.", "짧은 시간에 신청이 여러 번 들어왔습니다. 10분 뒤 다시 시도하시거나 " + contactHtml() + "으로 문의해 주세요.");
          else if (r.res.status === 400) showMsg("error", "입력 내용을 다시 확인해 주세요.", "이름, 연락처, 학년을 확인한 뒤 다시 신청해 주세요. 계속 안 되면 " + contactHtml() + "으로 문의해 주세요.");
          else showMsg("error", "신청을 접수하지 못했습니다.", "일시적인 문제로 전달되지 않았습니다. 잠시 뒤 다시 시도하시거나 " + contactHtml() + "으로 문의해 주세요.");
        })
        .catch(function () {
          clearTimeout(t);
          setBusy(false);
          showMsg("error", "신청을 접수하지 못했습니다.", "연결이 원활하지 않아 전달되지 않았습니다. 잠시 뒤 다시 시도하시거나 " + contactHtml() + "으로 문의해 주세요.");
        });
    });
    var resetBtn = $("[data-reset]");
    if (resetBtn) resetBtn.addEventListener("click", function () {
      form.reset();
      submitted = false;
      Object.keys(F).forEach(function (k) { show(k, ""); if ("dirty" in F[k]) F[k].dirty = false; });
      if (count) count.textContent = "0";
      msgBox.hidden = true;
      done.hidden = true;
      form.hidden = false;
      openedAt = Date.now();
      F.name.el.focus();
    });
  }

  /* ---------- 빠른 문의 버튼 ---------- */
  var quick = $("[data-quick]");
  var toTop = $("[data-to-top]");
  function onScroll() {
    if (toTop && hero) toTop.hidden = window.scrollY < hero.offsetHeight * 0.6;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { goHome(); });
  var soon = $("[data-kakao-soon]");
  if (soon) soon.addEventListener("click", function () { toast("카카오톡 상담은 추후 연결 예정입니다."); });
  var phoneSoon = $("[data-phone-soon]");
  if (phoneSoon) phoneSoon.addEventListener("click", function () { toast("전화번호는 등록 예정입니다."); });
  if (quick && form && "IntersectionObserver" in window) {
    var formVisible = false;
    var applyDim = function () { quick.classList.toggle("is-dim", formVisible && window.innerWidth <= 768); };
    new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; applyDim(); }, { rootMargin: "0px 0px -10% 0px" }).observe($("#consult .consult-col"));
    window.addEventListener("resize", applyDim);
  }

  /* ---------- 공지 팝업 ---------- */
  var popupActive = false;
  (function popups() {
    var layer = $("[data-popup-layer]");
    var all = Array.isArray(cfg.popups) ? cfg.popups : [];
    if (!layer || !all.length) return;
    var d = new Date();
    var today = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    var KEY = "atelier-popup-hide:";
    function hiddenUntil(id) { try { return Number(localStorage.getItem(KEY + id)) || 0; } catch (e) { return 0; } }
    var list = all.filter(function (p) {
      if (p.start && today < p.start) return false;
      if (p.end && today > p.end) return false;
      return hiddenUntil(p.id) <= Date.now();
    });
    if (!list.length) return;
    var idx = 0, returnFocus = null, card = null;
    var SCROLL_KEYS = { ArrowUp: 1, ArrowDown: 1, PageUp: 1, PageDown: 1, Home: 1, End: 1, " ": 1 };
    function block(e) { if (popupActive) e.preventDefault(); }
    function keys(e) {
      if (!popupActive) return;
      if (e.key === "Escape") { e.preventDefault(); close(true, false); return; }
      if (e.key === "Tab") {
        var f = $$("a[href], button", card);
        if (!f.length) { e.preventDefault(); return; }
        var a = document.activeElement, i = f.indexOf(a);
        e.preventDefault();
        if (e.shiftKey) f[i <= 0 ? f.length - 1 : i - 1].focus();
        else f[i < 0 || i >= f.length - 1 ? 0 : i + 1].focus();
        return;
      }
      if (SCROLL_KEYS[e.key]) {
        var tag = e.target && e.target.tagName;
        if (e.key === " " && (tag === "BUTTON" || tag === "A")) return;
        e.preventDefault();
      }
    }
    function lock() {
      popupActive = true;
      document.addEventListener("wheel", block, { passive: false });
      document.addEventListener("touchmove", block, { passive: false });
      document.addEventListener("keydown", keys, true);
    }
    function unlock() {
      popupActive = false;
      document.removeEventListener("wheel", block, { passive: false });
      document.removeEventListener("touchmove", block, { passive: false });
      document.removeEventListener("keydown", keys, true);
    }
    function render(keyboard) {
      var p = list[idx];
      var img = '<img class="popup-img" src="' + esc(p.src) + '" alt="' + esc(p.alt) + '">';
      var media = img;
      if (p.link) {
        media = p.link.charAt(0) === "#"
          ? '<a class="popup-img-link" href="' + esc(p.link) + '" data-inner>' + img + "</a>"
          : '<a class="popup-img-link" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + img + "</a>";
      }
      var label = "공지 " + (idx + 1) + " / " + list.length;
      layer.innerHTML =
        '<div class="popup-card" role="dialog" aria-modal="true" aria-label="' + label + '" tabindex="-1">' +
        '<p class="popup-count">' + label + "</p>" + media +
        '<div class="popup-actions"><button type="button" data-hide-day>하루 동안 열지 않기</button><button type="button" data-close>닫기</button></div></div>';
      card = $(".popup-card", layer);
      if (!rm()) card.classList.add("anim");
      $("[data-close]", card).addEventListener("click", function (e) { close(e.detail === 0, false); });
      $("[data-hide-day]", card).addEventListener("click", function (e) { close(e.detail === 0, true); });
      var inner = $("[data-inner]", card);
      if (inner) inner.addEventListener("click", function (e) {
        e.preventDefault();
        var target = document.querySelector(p.link);
        finish(false);
        if (target) target.scrollIntoView({ behavior: rm() ? "auto" : "smooth", block: "start" });
      });
      if (keyboard) $("[data-close]", card).focus({ preventScroll: true });
      else card.focus({ preventScroll: true });
    }
    function finish(restore) {
      layer.hidden = true;
      layer.innerHTML = "";
      layer.classList.remove("anim");
      unlock();
      if (restore && returnFocus && returnFocus !== document.body && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    }
    function close(keyboard, hideDay) {
      if (hideDay) { try { localStorage.setItem(KEY + list[idx].id, String(Date.now() + 24 * 60 * 60 * 1000)); } catch (e) { /* 저장이 막혀 있어도 계속 */ } }
      idx++;
      if (idx < list.length) render(keyboard);
      else finish(true);
    }
    returnFocus = document.activeElement;
    layer.hidden = false;
    if (!rm()) layer.classList.add("anim");
    lock();
    render(false);
  })();
})();
