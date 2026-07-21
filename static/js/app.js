// ARA_downloader frontend logic
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  },
  { threshold: 0.15 }
);
$$(".reveal").forEach((el) => io.observe(el));

const header = $(".site-header");
window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 30));

(function makeParticles() {
  const wrap = $(".particles");
  const colors = ["#00e5ff", "#7c5cff", "#ff4d8d"];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 10 + Math.random() * 14 + "s";
    p.style.animationDelay = -Math.random() * 20 + "s";
    p.style.transform = `scale(${0.5 + Math.random()})`;
    wrap.appendChild(p);
  }
})();

const urlInput = $("#url");
const fetchBtn = $("#fetch-btn");
const result = $("#result");
const statusEl = $("#status");
const vtitle = $("#v-title");
const vsub = $("#v-sub");
const qualityWrap = $("#quality-wrap");
const downloadBtn = $("#download-btn");
const resetBtn = $("#reset-btn");
const videoWrap = $("#video-wrap");
const videoEl = $("#video-player");

let currentInfo = null;
let selectedUrl = null;
let isFetching = false;

function setStatus(kind, msg) {
  statusEl.className = "status show " + kind;
  if (kind === "loading") statusEl.innerHTML = `<span class="spinner"></span><span>${msg}</span>`;
  else statusEl.innerHTML = `<span>${msg}</span>`;
}
function clearStatus() { statusEl.className = "status"; statusEl.innerHTML = ""; }

function lockSearch() {
  isFetching = true;
  fetchBtn.disabled = true;
  urlInput.classList.add("locked");
}
function unlockSearch() {
  isFetching = false;
  fetchBtn.disabled = false;
  urlInput.classList.remove("locked");
}

function isFacebookUrl(url) { return /facebook\.com|fb\.watch|fb\.me/i.test(url); }

fetchBtn.addEventListener("click", async () => {
  if (isFetching) return;
  const url = urlInput.value.trim();
  if (!url) { setStatus("error", "من فضلك أدخل رابط الفيديو."); return; }
  if (!isFacebookUrl(url)) { setStatus("error", "الرابط يجب أن يكون من فيسبوك."); return; }

  result.classList.remove("show");
  clearStatus();
  lockSearch();
  setStatus("loading", "جارٍ جلب بيانات الفيديو...");

  try {
    const res = await fetch("/api/info/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "تعذّر جلب البيانات.");

    currentInfo = data;
    renderResult(data);
  } catch (e) {
    setStatus("error", e.message || "حدث خطأ غير متوقع.");
  } finally {
    unlockSearch();
  }
});

function renderResult(data) {
  clearStatus();
  vtitle.textContent = data.title || "فيديو فيسبوك";
  const dur = data.duration
    ? `${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, "0")}`
    : "";
  vsub.textContent = [data.uploader, dur ? "⏱ " + dur : null].filter(Boolean).join("  •  ");

  qualityWrap.innerHTML = '<span class="label">اختر الجودة:</span>';
  selectedUrl = data.qualities[0].url;
  data.qualities.forEach((q, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "quality-btn" + (i === 0 ? " active" : "");
    b.textContent = q.label;
    b.addEventListener("click", () => {
      $$(".quality-btn", qualityWrap).forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      selectedUrl = q.url;
      videoEl.src = q.url;
      videoEl.load();
      videoEl.play().catch(() => {});
      updateDownloadLink();
    });
    qualityWrap.appendChild(b);
  });

  videoEl.src = selectedUrl;
  videoEl.load();
  videoWrap.style.display = "block";

  updateDownloadLink();
  result.classList.add("show");
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function updateDownloadLink() {
  downloadBtn.href = selectedUrl;
  downloadBtn.setAttribute("download", `ARA_${(currentInfo && currentInfo.title || "video").slice(0, 50)}.mp4`);
  downloadBtn.setAttribute("target", "_blank");
  downloadBtn.setAttribute("rel", "noopener");
}

resetBtn.addEventListener("click", () => {
  if (isFetching) return;
  urlInput.value = "";
  result.classList.remove("show");
  clearStatus();
  videoEl.pause();
  videoEl.removeAttribute("src");
  videoEl.load();
  videoWrap.style.display = "none";
  currentInfo = null;
  selectedUrl = null;
});

urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); if (!isFetching) fetchBtn.click(); }
});
