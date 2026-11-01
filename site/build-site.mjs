// content 폴더의 내용 파일을 읽어 site/index.html 을 만듭니다.
// 실행: 프로젝트 맨 위 폴더에서  node site/build-site.mjs
// (어느 폴더에서 실행해도 이 파일 위치를 기준으로 동작합니다.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage } from "../code/src/render.mjs";

const SITE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SITE, "..");
const CONTENT = path.join(ROOT, "content");
const SRC = path.join(ROOT, "code", "src");

const args = process.argv.slice(2);
const argVal = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
// 시험용: --content <폴더> 로 다른 내용 폴더, --out <폴더> 로 다른 출력 폴더, --artifact 로 미리보기용 출력
const contentDir = argVal("--content") ? path.resolve(argVal("--content")) : CONTENT;
const outDir = argVal("--out") ? path.resolve(argVal("--out")) : SITE;
const artifact = args.includes("--artifact");

function fail(msg) {
  console.error("\n[빌드 중단] " + msg + "\n");
  process.exit(1);
}

function readJson(rel) {
  const file = path.join(contentDir, rel);
  if (!fs.existsSync(file)) fail(`${rel} 파일이 없습니다.`);
  const text = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  try {
    return JSON.parse(text);
  } catch (e) {
    let line = "?";
    const m = /position (\d+)/.exec(e.message);
    const lm = /line (\d+)/.exec(e.message);
    if (lm) line = lm[1];
    else if (m) line = text.slice(0, Number(m[1])).split("\n").length;
    fail(`${path.basename(rel)} 파일 형식 오류: ${line}번째 줄 근처를 확인하세요. (쉼표, 따옴표, 괄호가 빠지거나 남지 않았는지 봐 주세요)`);
  }
}

const str = (v) => (v === undefined || v === null ? "" : String(v)).trim();
const isPh = (v) => !str(v) || /^\[[^\]]*\]$/.test(str(v));
const IMG_RE = /^[A-Za-z0-9_-]+\.(jpe?g|png|webp|gif)$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------- 학원 정보 ----------
const info = readJson("site_info/site_info.json");
const phone = str(info["대표전화"]);
if (phone && !/^[0-9-]{8,15}$/.test(phone)) fail(`site_info.json 대표전화 "${phone}" — 숫자와 - 만 써 주세요. 예: 02-000-0000`);
const kakao = str(info["카카오톡_주소"]);
if (kakao && !/^https:\/\/[^\s"'<>]+$/.test(kakao)) fail(`site_info.json 카카오톡_주소는 https:// 로 시작해야 합니다.`);
const endpoint = str(info["상담접수주소"]);
if (endpoint && !/^(\/[A-Za-z0-9/_-]*|https:\/\/[^\s"'<>]+)$/.test(endpoint)) fail(`site_info.json 상담접수주소 형식이 올바르지 않습니다. 이 값은 바꾸지 말아 주세요.`);
const lat = str(info["위도"]), lng = str(info["경도"]);
for (const [k, v] of [["위도", lat], ["경도", lng]]) {
  if (v && !/^-?\d{1,3}(\.\d+)?$/.test(v)) fail(`site_info.json ${k} "${v}" — 숫자로 적어 주세요. 예: 37.5665`);
}
const mapId = str(info["네이버지도_ClientID"]);
if (mapId && !/^[A-Za-z0-9_-]+$/.test(mapId)) fail(`site_info.json 네이버지도_ClientID 형식이 올바르지 않습니다.`);
if (!Array.isArray(info["운영시간"])) fail(`site_info.json 운영시간은 [ ] 목록이어야 합니다.`);

// ---------- 수업 ----------
const classesFile = readJson("classes/classes.json");
const classes = Array.isArray(classesFile["입력"]) ? classesFile["입력"] : fail("classes.json 의 입력은 [ ] 목록이어야 합니다.");
classes.forEach((c, i) => {
  if (!str(c["학년"]) || !str(c["수업명"])) fail(`classes.json 입력의 ${i + 1}번째 수업에 학년과 수업명이 필요합니다.`);
});

// ---------- 강사 ----------
const teachersFile = readJson("teachers/teachers.json");
const teachers = Array.isArray(teachersFile["입력"]) ? teachersFile["입력"] : fail("teachers.json 의 입력은 [ ] 목록이어야 합니다.");
const images = []; // [src, destName]
teachers.forEach((t, i) => {
  if (!str(t["이름"])) fail(`teachers.json 입력의 ${i + 1}번째 선생님 이름이 비어 있습니다.`);
  if (t["약력"] !== undefined && !Array.isArray(t["약력"])) fail(`teachers.json ${str(t["이름"])} 선생님의 약력은 [ ] 목록이어야 합니다.`);
  const p = str(t["사진"]);
  if (p) {
    if (!IMG_RE.test(p)) fail(`teachers.json 사진 "${p}" — 파일 이름은 영어·숫자·-·_ 만, jpg·png·webp·gif 만 됩니다.`);
    const src = path.join(contentDir, "teachers", p);
    if (!fs.existsSync(src)) fail(`teachers.json 에 적은 사진 "${p}" 이 teachers 폴더에 없습니다. 파일 이름(대소문자 포함)을 확인해 주세요.`);
    images.push([src, "t-" + p]);
  }
});

// ---------- 공지 팝업 ----------
const popupFile = readJson("popup/popup.json");
const popupOn = popupFile["사용여부"] === true;
const popupsRaw = Array.isArray(popupFile["입력"]) ? popupFile["입력"] : fail("popup.json 의 입력은 [ ] 목록이어야 합니다.");
const popups = [];
if (popupOn) {
  popupsRaw.forEach((p, i) => {
    const img = str(p["이미지"]);
    const n = i + 1;
    if (!IMG_RE.test(img)) fail(`popup.json ${n}번째 공지 이미지 "${img}" — 파일 이름은 영어·숫자·-·_ 만, jpg·png·webp·gif 만 됩니다.`);
    const src = path.join(contentDir, "popup", img);
    if (!fs.existsSync(src)) fail(`popup.json 에 적은 이미지 "${img}" 이 popup 폴더에 없습니다.`);
    const link = str(p["링크"]);
    if (link && !/^(https:\/\/[^\s"'<>]+|#[A-Za-z][A-Za-z0-9_-]*)$/.test(link)) fail(`popup.json ${n}번째 공지 링크는 https:// 주소 또는 #consult 같은 형식이어야 합니다.`);
    for (const k of ["시작일", "종료일"]) {
      const d = str(p[k]);
      if (d && !DATE_RE.test(d)) fail(`popup.json ${n}번째 공지 ${k} "${d}" — 2026-11-01 형식으로 적어 주세요.`);
    }
    if (!str(p["설명"])) console.warn(`[경고] popup.json ${n}번째 공지의 설명이 비어 있습니다. 이미지 내용을 짧게 적어 주세요.`);
    images.push([src, "p-" + img]);
    popups.push({ id: img, src: "p-" + img, alt: str(p["설명"]), link, start: str(p["시작일"]), end: str(p["종료일"]) });
  });
}

// ---------- 페이지 만들기 ----------
const css = fs.readFileSync(path.join(SRC, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(SRC, "app.js"), "utf8");

// 미리보기용(--artifact)은 사진을 페이지 안에 넣고, 일반 빌드는 images 폴더로 복사합니다.
const imgUrl = {};
const mime = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
for (const [src, dest] of images) {
  if (artifact) {
    const ext = path.extname(src).slice(1).toLowerCase();
    imgUrl[dest] = `data:${mime[ext]};base64,` + fs.readFileSync(src).toString("base64");
  } else {
    imgUrl[dest] = "images/" + dest;
  }
}

const html = renderPage({ info, classes, teachers, popups, css, js, imgUrl, artifact, isPh });

fs.mkdirSync(outDir, { recursive: true });
if (!artifact) {
  const imgDir = path.join(outDir, "images");
  fs.rmSync(imgDir, { recursive: true, force: true }); // 예전 사진 정리
  fs.mkdirSync(imgDir, { recursive: true });
  for (const [src, dest] of images) fs.copyFileSync(src, path.join(imgDir, dest));
}
const outFile = path.join(outDir, artifact ? "preview.html" : "index.html");
fs.writeFileSync(outFile, html);
console.log(`완료: ${path.relative(process.cwd(), outFile) || outFile} (수업 ${classes.length}개, 선생님 ${teachers.length}명, 공지 ${popups.length}장)`);
