document.addEventListener("DOMContentLoaded", () => {
  const chips = document.querySelectorAll(".chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      if (chip.classList.contains("active")) {
        chip.classList.remove("active");
      } else {
        chips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
      }
    });
  });

  initAvatarCanvases();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".section").forEach((section) => {
    observer.observe(section);
  });

  const scrollTopBtn = document.querySelector(".scroll-top");
  const updateScrollButton = () => {
    if (!scrollTopBtn) return;
    if (window.scrollY > 320) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  };

  updateScrollButton();
  window.addEventListener("scroll", updateScrollButton, { passive: true });
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  document.querySelectorAll(".project-card").forEach((card) => {
    const resetCard = () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    };

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 8;
      const rotateY = (x - 0.5) * 8;
      card.style.setProperty("--rx", `${rotateX}deg`);
      card.style.setProperty("--ry", `${rotateY}deg`);
    });
    card.addEventListener("mouseleave", resetCard);
  });

  const caseModal = document.querySelector(".case-modal");
  const caseFrame = document.querySelector(".case-modal-frame");
  const caseTitle = document.querySelector(".case-modal-title");
  const caseClose = document.querySelector(".case-modal-close");
  const caseBackdrop = document.querySelector(".case-modal-backdrop");
  const caseOpenFull = document.querySelector(".modal-open-full");

  if (caseModal && caseFrame && caseTitle) {
    const closeModal = () => {
      caseModal.classList.remove("active");
      caseModal.setAttribute("aria-hidden", "true");
      caseFrame.src = "";
    };

    const openModal = (title, url) => {
      caseTitle.textContent = title;
      caseFrame.src = url;
      if (caseOpenFull) caseOpenFull.href = url;
      caseModal.classList.add("active");
      caseModal.setAttribute("aria-hidden", "false");
    };

    document.querySelectorAll("[data-case-file]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        const file = trigger.dataset.caseFile;
        const title = trigger.dataset.caseTitle || "Кейс проекта";
        if (file) {
          openModal(title, file);
        }
      });
    });

    if (caseClose) {
      caseClose.addEventListener("click", closeModal);
    }
    if (caseBackdrop) {
      caseBackdrop.addEventListener("click", closeModal);
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && caseModal.classList.contains("active")) {
        closeModal();
      }
    });
  }
});

function initAvatarCanvases() {
  const canvases = Array.from(document.querySelectorAll("[data-avatar-canvas]"));
  if (!canvases.length) return;

  canvases.forEach((canvas) => {
    createDotAvatar(canvas);
  });
}

function createDotAvatar(canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const state = {
    points: [],
    raf: 0,
    lastTs: 0,
    glitchUntil: 0,
    glitchBand: { y0: 0, y1: 0, dx: 0 },
  };

  const seed = (n) => seedPortraitPoints(n);
  state.points = seed((canvas.width + canvas.height + 1337) | 0);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };

  const render = (ts) => {
    resize();
    const w = canvas.width;
    const h = canvas.height;
    const t = ts * 0.001;
    const dt = state.lastTs ? Math.min(0.05, (ts - state.lastTs) / 1000) : 0;
    state.lastTs = ts;

    // Rare glitch bursts (very subtle for the black/white style)
    if (state.glitchUntil < ts && Math.random() < 0.01) {
      state.glitchUntil = ts + 70 + Math.random() * 90;
      const bandH = h * (0.08 + Math.random() * 0.12);
      const y0 = Math.random() * (h - bandH);
      state.glitchBand = {
        y0,
        y1: y0 + bandH,
        dx: (Math.random() - 0.5) * w * 0.03,
      };
    }

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Soft white bloom (like the reference)
    const aura = ctx.createRadialGradient(
      w * 0.52,
      h * 0.44,
      0,
      w * 0.52,
      h * 0.44,
      w * 0.62
    );
    aura.addColorStop(0, "rgba(255,255,255,0.08)");
    aura.addColorStop(0.55, "rgba(255,255,255,0.04)");
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);

    const rotY = t * 0.42;
    const rotX = Math.sin(t * 0.55) * 0.04;
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    // Projection params
    const scale = Math.min(w, h) * 0.46;
    const cx = w * 0.5;
    const cy = h * 0.58;
    const depth = 2.35;

    for (let i = 0; i < state.points.length; i++) {
      const pt = state.points[i];

      // Rotate (Y then X)
      let x = pt.x;
      let y = pt.y;
      let z = pt.z;

      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      x = x1;
      z = z1;

      const y2 = y * cosX - z * sinX;
      const z2 = y * sinX + z * cosX;
      y = y2;
      z = z2;

      // Perspective
      const pz = depth + z;
      const px = cx + (x / pz) * scale;
      const py = cy + (y / pz) * scale;

      // Micro-jitter (like vibrating points)
      const j = 0.012;
      const jx = (Math.sin(t * 3.4 + pt.tw * 17.0) + Math.sin(t * 6.2 + pt.tw * 9.0)) * j;
      const jy = (Math.cos(t * 3.1 + pt.tw * 15.0) + Math.sin(t * 5.6 + pt.tw * 11.0)) * j;

      // Twinkle: subtle, slow
      const tw = 0.88 + 0.12 * Math.sin(t * 2.2 + pt.tw * 10.0);

      // Depth fade and brightness focus on silhouette edge
      const depthFade = clamp(1.3 - (pz - 1.55), 0, 1);
      const edgeBoost = 0.65 + 0.55 * pt.edge;
      const alpha = (0.18 + 0.42 * depthFade) * tw * edgeBoost;

      const size =
        (0.55 + pt.w * 0.55) * (0.9 + depthFade * 0.75) * (w / 92);

      const pxJ = cx + ((x + jx) / pz) * scale;
      const pyJ = cy + ((y + jy) / pz) * scale;

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(pxJ, pyJ, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glitch band shift
    if (ts < state.glitchUntil) {
      const { y0, y1, dx } = state.glitchBand;
      const iy0 = Math.max(0, Math.floor(y0));
      const ih = Math.max(1, Math.floor(y1 - y0));
      const img = ctx.getImageData(0, iy0, w, ih);
      ctx.clearRect(0, iy0, w, ih);
      ctx.putImageData(img, Math.round(dx), iy0);
    }

    // A subtle scan highlight
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    const scanY = ((t * 0.18) % 1) * h;
    ctx.fillRect(0, scanY, w, Math.max(1, h * 0.028));

    ctx.restore();
    state.raf = requestAnimationFrame(render);
  };

  state.raf = requestAnimationFrame(render);

  const onVis = () => {
    if (document.hidden) {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
    } else if (!state.raf) {
      state.lastTs = 0;
      state.raf = requestAnimationFrame(render);
    }
  };

  document.addEventListener("visibilitychange", onVis, { passive: true });
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function seedPortraitPoints(seed) {
  const rand = mulberry32(seed);
  const points = [];

  // We sample near the surface of a simple bust SDF (head + neck + shoulders).
  const targetCount = 2600;
  const maxIters = 220000;
  const eps = 0.018;

  for (let i = 0; i < maxIters && points.length < targetCount; i++) {
    // Bounding box around the bust
    const x = (rand() * 2 - 1) * 1.05;
    const y = (rand() * 2 - 1) * 1.25;
    const z = (rand() * 2 - 1) * 0.9;

    const d = bustSdf(x, y, z);
    if (Math.abs(d) > eps) continue;

    // Edge factor for brighter rim (approx from gradient magnitude)
    const g = sdfGradApprox(bustSdf, x, y, z);
    const edge = clamp(g / 1.25, 0, 1);

    // Weight acceptance: keep more points on the visible "front"
    // (helps read as portrait)
    const frontBias = 0.55 + 0.45 * clamp((z + 0.35) / 0.9, 0, 1);
    if (rand() > frontBias) continue;

    points.push({
      x,
      y,
      z,
      w: 0.6 + rand() * 0.9,
      tw: rand(),
      edge,
    });
  }

  // If we undershoot (rare), pad with a softer sampling
  while (points.length < targetCount) {
    const x = (rand() * 2 - 1) * 1.02;
    const y = (rand() * 2 - 1) * 1.15;
    const z = (rand() * 2 - 1) * 0.85;
    const d = bustSdf(x, y, z);
    if (Math.abs(d) > eps * 1.9) continue;
    points.push({
      x,
      y,
      z,
      w: 0.55 + rand() * 0.85,
      tw: rand(),
      edge: 0.55,
    });
  }

  return points;
}

function bustSdf(x, y, z) {
  // Head: slightly flattened sphere
  const head = sdfEllipsoid(x * 1.02, y - 0.28, z * 0.92, 0.58, 0.72, 0.56);

  // Neck: capsule
  const neck = sdfCapsule(x, y + 0.24, z * 0.92, 0.0, 0.2, 0.18);

  // Shoulders / torso: ellipsoid, clipped at the top to avoid "double chin"
  const torsoBase = sdfEllipsoid(x * 0.95, y + 0.92, z, 1.05, 0.62, 0.72);
  const clipTop = y + 0.25; // positive above this plane
  const torso = opIntersect(torsoBase, clipTop);

  // Blend unions for a softer silhouette
  const headNeck = opSmoothUnion(head, neck, 0.12);
  const bust = opSmoothUnion(headNeck, torso, 0.16);

  // Slight cut on the back to look more like a portrait volume
  const backCut = -(z + 0.65); // keep z > -0.65
  return opIntersect(bust, backCut);
}

function sdfEllipsoid(x, y, z, a, b, c) {
  // Approx SDF for ellipsoid via scaled sphere
  const k0 = Math.hypot(x / a, y / b, z / c);
  const k1 = Math.hypot(x / (a * a), y / (b * b), z / (c * c));
  return k0 * (k0 - 1.0) / (k1 || 1e-6);
}

function sdfCapsule(x, y, z, y0, y1, r) {
  // Capsule aligned along Y, from y0 to y1
  const yy = clamp(y, y0, y1);
  const dx = x;
  const dy = y - yy;
  const dz = z;
  return Math.hypot(dx, dy, dz) - r;
}

function opSmoothUnion(d1, d2, k) {
  const h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0, 1);
  return lerp(d2, d1, h) - k * h * (1 - h);
}

function opIntersect(d1, d2) {
  return Math.max(d1, d2);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sdfGradApprox(fn, x, y, z) {
  const e = 0.004;
  const dx = fn(x + e, y, z) - fn(x - e, y, z);
  const dy = fn(x, y + e, z) - fn(x, y - e, z);
  const dz = fn(x, y, z + e) - fn(x, y, z - e);
  return Math.hypot(dx, dy, dz) / (2 * e);
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

