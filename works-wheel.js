/**
 * WorksWheel - 3D Vertical Drum & Ring Portfolio Index Component
 * Vanilla JavaScript Implementation of the WorksWheel React Component
 */

const CARD_H = 0.38; // front card height, of the stage
const CARD_MAX_W = 0.34; // ... but never wider than this much of the stage
const CARD_RATIO = 1.45; // card width / height
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius, in card heights - and everything below likewise
const LENS = 2.7; // perspective distance
const RING_R = 1.14; // ring radius
const BOW = 1.82;
const TITLE = 0.115; // ring label and front-card title
const INDEX = 0.038; // the index down the right-hand side
const CULL = 1.6;

const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
const SETTLE = 140;
const EASE = 0.12;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rad = (deg) => (deg * Math.PI) / 180;
const bowAt = (drumDeg, bow) => -bow * (1 - Math.cos(rad(drumDeg)));

function place(ringDeg, drumDeg, ringR, drumR, bow, m) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export const DEFAULT_WORKS = [
  {
    title: "ViT vs CNN on OCT",
    subtitle: "Publication • IEEE Xplore",
    description: "A Comparative Study between Vision Transformers and CNN Models on Optical Computed Tomography Scans. I co-authored this paper comparing newer transformer models with convolutional networks for detecting retinal disease.",
    sections: [
      { heading: "Why it matters", text: "OCT scans are central to diagnosing retinal disease, and even experienced ophthalmologists can miss small details. CNNs have long been the default for medical imaging, so we tested whether Vision Transformers are a real alternative." },
      { heading: "What we did", text: "We fine-tuned transformer architectures including ViT, DeiT and BEiT on the OCT MNIST dataset, targeting CNV, DME and Drusen, and compared them against convolutional models including YOLOv11." },
      { heading: "What we found", points: ["ViT reached competitive performance, so transformers are a viable alternative for medical imaging.", "Starting from pre-trained weights cut training time and improved generalisation.", "DeiT and BEiT trained in even less time while staying competitive.", "YOLOv11 led on the test set, but took significantly longer to train."] }
    ],
    image: "assets/projects/oct.jpg",
    src: "assets/projects/oct.jpg",
    href: "https://ieeexplore.ieee.org/document/11135526",
    link: "https://ieeexplore.ieee.org/document/11135526",
    linkLabel: "Read on IEEE Xplore",
    tools: ["Vision Transformers", "DeiT", "BEiT", "YOLOv11", "OCT"]
  },
  {
    title: "Explaining FER Models",
    subtitle: "B.Tech Capstone • 2026",
    description: "Understanding Facial Expression Recognition Models through Attribution-Driven Concept and Causal Analysis. FER models can score well by relying on backgrounds, lighting or identity instead of real expressions. Our five-person team built a framework to test what they actually use, and I built the working application around it.",
    stats: "Best model: EfficientNetV2 at 85.76% test accuracy on RAF-DB, about 15,300 real-world facial images across 7 emotions.",
    sections: [
      { heading: "My role", text: "I was responsible for the complete functional application, MyFER. I architected and built the full-stack product, turning the team's paper and notebook experiments into working software: model loading, image preprocessing, inference and attribution visualisation in one end-to-end experience." },
      { heading: "The application", points: ["A FastAPI backend serving PyTorch models, with a React and Vite frontend.", "Automatic face detection and cropping with OpenCV before inference.", "Models selectable from the UI, with a registry that makes adding one a small wrapper.", "Confidence dashboards with attribution heatmaps and bounding boxes."] },
      { heading: "The framework", points: ["Fine-tuned five CNNs: ResNet-18, ResNet-50, VGG-16, EfficientNetV2 and ResNet-18 with CBAM.", "Kept only the pixels ranked highly by both Integrated Gradients and LRP, a Top-K intersection that filters out method-specific noise.", "Grouped those pixels into facial concepts using agglomerative clustering and bounding boxes.", "Measured causal importance by ablating or blurring each concept and recording the drop in the model's output.", "Benchmarked the discovered concepts against TCAV."] },
      { heading: "Results", points: ["EfficientNetV2 85.76%, ResNet-50 84.88%, ResNet-18 84.45%, VGG-16 83.80%, ResNet-18 with CBAM 83.64%.", "Eye, mouth and nasal bridge regions came through as the main concepts.", "Removing the eye region hurt Surprise and Fear predictions most, while removing the mouth region hurt Happiness most.", "Fear and Disgust stayed hardest for every model, reflecting real visual overlap between those expressions."] }
    ],
    image: "assets/projects/fer.jpg",
    src: "assets/projects/fer.jpg",
    href: "https://github.com/Dhrishit04/MyFER",
    link: "https://github.com/Dhrishit04/MyFER",
    linkLabel: "View MyFER on GitHub",
    tools: ["PyTorch", "FastAPI", "React", "XAI"]
  },
  {
    title: "Valve Stiction",
    subtitle: "Industrial Report • Reliance, 2025",
    description: "Detecting and visualising valve stiction in plant control loops. Dynamic Slow Feature Analysis extracts slow features from OP and PV signals, and the Hurst exponent of the slowest feature indicates stiction. The full story is in the Reliance section under Experience.",
    sections: [
      { heading: "Method", points: ["Standardise OP and PV, then split them into daily segments.", "Use cross-correlation to find the daily lag and build a lagged data matrix.", "Take the slowest feature from covariance and eigenvalue analysis.", "Compute a daily Hurst exponent, where values above 0.5 indicate stiction."] },
      { heading: "Outcome", text: "The method was more robust to noise and disturbances than autocorrelation-based checks, and caught both periodic and irregular oscillations." }
    ],
    image: "assets/projects/stiction.jpg",
    src: "assets/projects/stiction.jpg",
    href: "#experience",
    stats: "18 months of OP/PV logs, about 390K samples at 2-minute intervals.",
    tools: ["Python", "DSFA", "Hurst Exponent"]
  }
];

export function initWorksWheel(container, options = {}) {
  if (!container) return null;

  const items = options.items || DEFAULT_WORKS;
  const label = options.label || "Research";
  const action = options.action !== undefined ? options.action : "View";
  const onSelect = options.onSelect || null;

  const count = items.length;
  const last = Math.max(count - 1, 0);

  let turn = 0;
  let target = 0;
  let active = 0;
  let stage = { w: container.clientWidth || 800, h: container.clientHeight || 600 };
  let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Build DOM Structure
  container.innerHTML = "";
  container.classList.add("relative", "w-full", "h-full", "overflow-hidden", "select-none");

  const section = document.createElement("section");
  section.setAttribute("aria-label", label);
  section.className = "relative w-full h-full min-h-[24rem] overflow-hidden select-none bg-transparent text-neutral-900";

  // Stage (perspective container)
  const stageEl = document.createElement("div");
  stageEl.tabIndex = 0;
  stageEl.role = "listbox";
  stageEl.setAttribute("aria-label", label);
  stageEl.className = "absolute inset-0 cursor-grab touch-pan-x outline-none focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:-outline-offset-4 active:cursor-grabbing";

  // Wheel (preserve-3d anchor)
  const wheelEl = document.createElement("div");
  wheelEl.className = "absolute top-1/2 left-1/2 pointer-events-none";
  wheelEl.style.transformStyle = "preserve-3d";

  // Cards
  const cardRefs = [];
  items.forEach((item, i) => {
    const card = document.createElement("div");
    card.id = `works-wheel-${i}`;
    card.role = "option";
    card.setAttribute("aria-selected", i === 0 ? "true" : "false");
    card.className = "group absolute cursor-pointer pointer-events-auto [backface-visibility:hidden]";
    card.style.transformStyle = "preserve-3d";
    card.style.willChange = "transform, opacity";

    const face = document.createElement("div");
    face.className = "relative block w-full h-full overflow-hidden rounded-2xl bg-white border border-neutral-300/80 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_28px_50px_-10px_rgba(0,0,0,0.22)] hover:border-neutral-500";
    face.style.willChange = "transform";
    face.style.transformOrigin = "center center";

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title;
    img.draggable = false;
    img.className = "w-full h-full object-cover select-none pointer-events-none";
    img.loading = "eager";

    face.appendChild(img);

    // Subtle gradient overlay for card readability
    const gradientOverlay = document.createElement("div");
    gradientOverlay.className = "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent";
    face.appendChild(gradientOverlay);

    // Bottom subtle info badge on card
    const cardInfo = document.createElement("div");
    cardInfo.className = "pointer-events-none absolute left-3.5 bottom-3.5 right-3.5 flex items-center justify-between";
    cardInfo.innerHTML = `
      <span class="text-[11px] font-mono tracking-wider text-white drop-shadow-sm font-semibold truncate max-w-[70%]">
        ${item.title}
      </span>
      <span class="bg-white/95 text-neutral-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 group-hover:scale-105 transition-transform">
        ${action} ↗
      </span>
    `;
    face.appendChild(cardInfo);

    card.appendChild(face);

    // Click on card
    card.addEventListener("click", (e) => {
      if (dragDelta > 6) return; // Ignore drag clicks
      // Every card shows a View button, so one click opens it and the drum turns to it behind the modal
      if (active !== i) to(i + 1);
      if (onSelect) {
        onSelect(i, item);
      } else if (window.openProjectModal) {
        window.openProjectModal(item);
      } else if (item.href && item.href.startsWith("http")) {
        window.open(item.href, "_blank");
      }
    });

    wheelEl.appendChild(card);
    cardRefs.push(card);
  });

  stageEl.appendChild(wheelEl);
  section.appendChild(stageEl);

  // Center ring label ("Research")
  const labelEl = document.createElement("div");
  labelEl.className = "pointer-events-none absolute inset-0 grid place-items-center tracking-tight font-black uppercase text-center text-neutral-900 select-none z-10 transition-opacity duration-300";
  labelEl.textContent = label;
  section.appendChild(labelEl);

  // Front-card title
  const titleEl = document.createElement("div");
  titleEl.className = "pointer-events-none absolute top-1/2 left-[5%] md:left-[7%] -translate-y-1/2 tracking-tight font-black uppercase text-neutral-900 opacity-0 select-none z-10 max-w-[42%] leading-[1.05]";
  titleEl.textContent = items[0] ? items[0].title : "";
  section.appendChild(titleEl);

  // Side Index List
  const indexList = document.createElement("ol");
  indexList.className = "text-neutral-500 absolute top-[7%] right-[3%] text-right leading-[1.75] z-20 space-y-0.5 select-none font-mono";
  const indexButtons = [];

  items.forEach((item, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = item.title;
    btn.className = "cursor-pointer transition-all duration-200 text-[11px] md:text-xs tracking-wider outline-none text-neutral-400 hover:text-neutral-900 block ml-auto";
    if (i === 0) {
      btn.className = "cursor-pointer transition-all duration-200 text-[11px] md:text-xs tracking-wider outline-none text-neutral-900 font-bold block ml-auto underline decoration-2 underline-offset-4";
    }
    btn.addEventListener("click", () => {
      to(i + 1);
    });
    li.appendChild(btn);
    indexList.appendChild(li);
    indexButtons.push(btn);
  });
  section.appendChild(indexList);

  // Bottom helper pill
  const hintPill = document.createElement("div");
  hintPill.className = "pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-neutral-200 shadow-sm backdrop-blur-md text-[10px] md:text-[11px] font-mono text-neutral-600 uppercase tracking-wider";
  hintPill.innerHTML = `
    <svg class="w-3 h-3 text-neutral-500 animate-bounce" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M19 14l-7 7m0 0l-7-7m7 7V3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>SCROLL OR DRAG DRUM TO CYCLE</span>
  `;
  section.appendChild(hintPill);

  container.appendChild(section);

  // Geometry computation
  let currentMetrics = calculateMetrics();

  function calculateMetrics() {
    const w = stage.w || 800;
    const h = stage.h || 600;
    const cardW = Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W);
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * DRUM;
    const ringR = cardH * RING_R;
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
      : 1;

    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: Math.max(22, cardH * TITLE),
      index: Math.max(10, cardH * INDEX),
    };
  }

  function applyMetrics() {
    currentMetrics = calculateMetrics();
    stageEl.style.perspective = `${currentMetrics.depth}px`;

    cardRefs.forEach((card) => {
      card.style.width = `${currentMetrics.cardW}px`;
      card.style.height = `${currentMetrics.cardH}px`;
      card.style.marginLeft = `${-currentMetrics.cardW / 2}px`;
      card.style.marginTop = `${-currentMetrics.cardH / 2}px`;
    });

    labelEl.style.fontSize = `${currentMetrics.title}px`;
    titleEl.style.fontSize = `${currentMetrics.title * 0.9}px`;
  }

  applyMetrics();

  // ResizeObserver
  const ro = new ResizeObserver(() => {
    stage = { w: stageEl.clientWidth, h: stageEl.clientHeight };
    applyMetrics();
  });
  ro.observe(stageEl);

  // Target steering
  function to(next) {
    target = clamp(next, 0, last + 1);
  }

  // Wheel interaction
  let settlingTimer = null;
  const onWheel = (event) => {
    const delta = event.deltaY;
    const next = target + delta / WHEEL_UNITS;
    // Native listener: cancellable only while inside wheel range so page scrolls on at edges
    if (next > 0 && next < last + 1) {
      event.preventDefault();
    }
    to(next);
    clearTimeout(settlingTimer);
    settlingTimer = setTimeout(() => {
      to(Math.round(target));
    }, SETTLE);
  };
  stageEl.addEventListener("wheel", onWheel, { passive: false });

  // Pointer drag interaction
  let isPointerDown = false;
  let dragStartY = 0;
  let dragDelta = 0;

  stageEl.addEventListener("pointerdown", (event) => {
    isPointerDown = true;
    dragStartY = event.clientY;
    dragDelta = 0;
  });

  stageEl.addEventListener("pointermove", (event) => {
    if (!isPointerDown) return;
    const diff = dragStartY - event.clientY;
    dragDelta += Math.abs(diff);
    // Capture only once this is a real drag: capturing on press retargets the click away from the card
    if (dragDelta > 6 && !stageEl.hasPointerCapture(event.pointerId)) {
      try {
        stageEl.setPointerCapture(event.pointerId);
      } catch (_) {}
    }
    to(target + diff / DRAG_UNITS);
    dragStartY = event.clientY;
  });

  const endDrag = (event) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    try {
      stageEl.releasePointerCapture(event.pointerId);
    } catch (_) {}
    if (target > 1) {
      to(Math.round(target));
    }
  };

  stageEl.addEventListener("pointerup", endDrag);
  stageEl.addEventListener("pointercancel", endDrag);

  // Keyboard navigation
  stageEl.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      to(Math.round(target) + 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      to(Math.round(target) - 1);
    }
  });

  // UI Active State Update
  function updateActiveUI(near) {
    stageEl.setAttribute("aria-activedescendant", `works-wheel-${near}`);
    cardRefs.forEach((card, idx) => {
      card.setAttribute("aria-selected", idx === near ? "true" : "false");
    });

    indexButtons.forEach((btn, idx) => {
      if (idx === near) {
        btn.className = "cursor-pointer transition-all duration-200 text-[11px] md:text-xs tracking-wider outline-none text-neutral-900 font-bold block ml-auto scale-105 underline decoration-2 underline-offset-4";
      } else {
        btn.className = "cursor-pointer transition-all duration-200 text-[11px] md:text-xs tracking-wider outline-none text-neutral-400 hover:text-neutral-900 block ml-auto";
      }
    });

    const counter = document.getElementById("works-wheel-counter");
    if (counter) {
      counter.textContent = `${String(near + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
    }

    if (items[near]) {
      titleEl.textContent = items[near].title;
    }
  }

  // Animation Loop (Single rAF pass writing direct DOM transforms)
  let frameId = 0;
  let isRunning = true;

  const draw = () => {
    if (!isRunning) return;
    frameId = requestAnimationFrame(draw);

    const gap = target - turn;
    if (Math.abs(gap) < 0.0005) {
      turn = target;
    } else {
      turn += gap * (reduced ? 1 : EASE);
    }

    const t = turn;
    const m = clamp(t, 0, 1);
    const pos = Math.max(0, t - 1);

    const { ringR, ringScale, drumR, bow } = currentMetrics;

    if (wheelEl) {
      wheelEl.style.transform = `translateZ(${-m * drumR}px)`;
    }

    for (let i = 0; i < count; i++) {
      const d = i - pos;
      const drumDeg = d * STEP;
      const card = cardRefs[i];
      if (card) {
        card.style.transform = place(
          d * (360 / count),
          drumDeg,
          ringR,
          drumR,
          bow,
          m
        );
        card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
        card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
      }
      const face = card ? card.firstElementChild : null;
      if (face) {
        face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }
    }

    if (labelEl) labelEl.style.opacity = String(1 - m);
    if (titleEl) titleEl.style.opacity = String(m);

    const near = clamp(Math.round(pos), 0, last);
    if (near !== active) {
      active = near;
      updateActiveUI(near);
    }
  };

  frameId = requestAnimationFrame(draw);

  return {
    to,
    next: () => to(Math.min(last + 1, Math.round(target) + 1)),
    prev: () => to(Math.max(0, Math.round(target) - 1)),
    getActive: () => active,
    destroy: () => {
      isRunning = false;
      cancelAnimationFrame(frameId);
      ro.disconnect();
      stageEl.removeEventListener("wheel", onWheel);
      clearTimeout(settlingTimer);
    }
  };
}
