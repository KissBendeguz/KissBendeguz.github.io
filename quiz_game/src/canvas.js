let ctx;
let canvas;
let getStateFn;
let callbacks = {};
let animationFrameId;

let currentZones = null;

let bgImg = null;
let bgUrl = null;
let bgLoaded = false;

const DEFAULT_BG = "./assets/images/all.jpg";

export function initCanvas(canvasElement, getState, cb = {}) {
  canvas = canvasElement;
  ctx = canvas.getContext("2d");
  getStateFn = getState;
  callbacks = cb;

  resizeForHiDPI();
  window.addEventListener("resize", resizeForHiDPI);
  canvas.addEventListener("click", handleCanvasClick);

  loop();
}

function resizeForHiDPI() {
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  if (ctx) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

function loop() {
  draw();
  animationFrameId = requestAnimationFrame(loop);
}

function handleCanvasClick(e) {
  if (!currentZones || !getStateFn) return;
  const state = getStateFn();
  if (state.screen !== "game") return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (state.status === "question") {
    for (const [key, zone] of Object.entries(currentZones.answers || {})) {
      if (pointInRect(x, y, zone)) {
        if (!state.disabledAnswers.includes(key) && callbacks.onAnswer) {
          callbacks.onAnswer(key);
        }
        return;
      }
    }
    for (const [type, zone] of Object.entries(currentZones.lifelines || {})) {
      if (pointInRect(x, y, zone)) {
        callbacks.onLifeline && callbacks.onLifeline(type);
        return;
      }
    }
  }

  if (
    state.status === "feedback" &&
    currentZones.next &&
    pointInRect(x, y, currentZones.next)
  ) {
    callbacks.onNextQuestion && callbacks.onNextQuestion();
  }
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function draw() {
  if (!ctx || !canvas || !getStateFn) return;

  const state = getStateFn();
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (state.screen === "game") {
    const desiredUrl = state.categoryBg && state.categoryBg.trim()
      ? state.categoryBg
      : DEFAULT_BG;

    if (desiredUrl !== bgUrl) {
      bgUrl = desiredUrl;
      bgLoaded = false;
      bgImg = null;

      if (bgUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          bgImg = img;
          bgLoaded = true;
        };
        img.onerror = () => {
          if (bgUrl !== DEFAULT_BG) {
            const fallback = new Image();
            fallback.onload = () => {
              bgImg = fallback;
              bgLoaded = true;
              bgUrl = DEFAULT_BG;
            };
            fallback.onerror = () => {
              bgImg = null;
              bgLoaded = false;
            };
            fallback.src = DEFAULT_BG;
          } else {
            bgImg = null;
            bgLoaded = false;
          }
        };
        img.src = bgUrl;
      }
    }
  } else {
    bgUrl = null;
    bgImg = null;
    bgLoaded = false;
  }

  ctx.clearRect(0, 0, width, height);

  if (state.screen !== "game") {
    currentZones = null;
    return;
  }

  drawBackground(width, height);
  currentZones = drawGameScreen(width, height, state);
}

function drawBackground(width, height) {
  if (bgLoaded && bgImg) {
    const iw = bgImg.naturalWidth;
    const ih = bgImg.naturalHeight;
    if (iw && ih) {
      const scale = Math.max(width / iw, height / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (width - dw) / 2;
      const dy = (height - dh) / 2;
      ctx.save();
      ctx.drawImage(bgImg, dx, dy, dw, dh);
      ctx.restore();
    }
  }
}

function drawGameScreen(width, height, state) {
  const zones = { answers: {}, lifelines: {}, next: null };

  const marginX = Math.max(18, width * 0.04);
  const marginTop = Math.max(16, height * 0.03);
  const marginBottom = Math.max(16, height * 0.04);

  const hudH = 70;
  const hudX = marginX;
  const hudY = marginTop;
  const hudW = width - marginX * 2;

  drawGlassPanel(hudX, hudY, hudW, hudH, 22, 10, "rgba(255,255,255,0.10)", "rgba(255,255,255,0.18)");

  drawStrokedText(ctx, `Pont: ${state.score}`, hudX + 16, hudY + hudH / 3, {
    font: "bold 16px system-ui",
    align: "left",
    baseline: "middle",
    fill: "#ffffff",
    stroke: "black",
    lineWidthRatio: 0.08
  });

  drawStrokedText(ctx, `Kérdés: ${state.currentIndex + 1} / ${state.questions.length}`, hudX + hudW - 16, hudY + hudH / 3, {
    font: "bold 14px system-ui",
    align: "right",
    baseline: "middle",
    fill: "#ffffff",
    stroke: "black",
    lineWidthRatio: 0.08
  });

  drawStrokedText(ctx, `${state.remainingTime} mp`, width / 2, hudY + hudH / 3, {
    font: "bold 16px system-ui",
    align: "center",
    baseline: "middle",
    fill: "#ffe28b",
    stroke: "black",
    lineWidthRatio: 0.10
  });

  const barMargin = 40;
  const barX = hudX + barMargin;
  const barW = hudW - barMargin * 2;
  const barH = 13;
  const barY = hudY + hudH - hudH / 3;

  drawGlassPanel(barX, barY, barW, barH, 5, 10, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.25)");

  let ratio = 0;
  if (state.timePerQuestion > 0) {
    ratio = Math.max(0, Math.min(1, state.remainingTime / state.timePerQuestion));
  }
  const activeW = barW * ratio;
  if (activeW > 0) {
    drawRoundedFill(barX, barY, activeW, barH, 5, "rgba(255,190,11,0.85)");
  }

  const qCardW = Math.min(hudW, width - marginX * 2);
  const qCardH = Math.min(170, height * 0.26);
  const qCardX = width / 2 - qCardW / 2;
  const qCardY = hudY + hudH + 18;

  drawGlassPanel(qCardX, qCardY, qCardW, qCardH, 22, 10, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.20)");

  const question = state.questions[state.currentIndex]?.question ?? "";
  drawStrokedWrappedText(ctx, question, qCardX + qCardW / 2, qCardY + qCardH / 2, qCardW - 36, 22, "center", {
    font: "21px system-ui",
    fill: "#ffffff",
    stroke: "black",
    lineWidthRatio: 0.09
  });

  const answerAreaTop = qCardY + qCardH + 18;
  const answerAreaBottom = height - marginBottom - 72;
  const answerAreaHeight = Math.max(130, answerAreaBottom - answerAreaTop);
  const rows = 2;
  const cols = 2;
  const rowGap = 12;
  const colGap = 14;

  const btnH = (answerAreaHeight - rowGap * (rows - 1)) / rows;
  const btnW = (qCardW - colGap) / cols;
  const gridX = qCardX;
  const gridY = answerAreaTop;

  const q = state.questions[state.currentIndex] || {};
  const answers = q.answers || {};
  const answerKeys = ["A", "B", "C", "D"];

  answerKeys.forEach((key) => {
    const index = answerKeys.indexOf(key);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = gridX + col * (btnW + colGap);
    const y = gridY + row * (btnH + rowGap);

    const disabledByFifty = state.disabledAnswers.includes(key);
    const isCorrect = state.status === "feedback" && key === q.correct;
    const isSelected = state.status === "feedback" && state.lastAnswer === key;

    drawGlassPanel(x, y, btnW, btnH, 18, 10, "rgba(255,255,255,0.10)", "rgba(255,255,255,0.18)");

    if (disabledByFifty) drawRoundedFill(x, y, btnW, btnH, 18, "rgba(0,0,0,0.25)");
    if (isCorrect) drawRoundedFill(x, y, btnW, btnH, 18, "rgba(46,125,50,0.75)");
    if (isSelected && !state.lastAnswerCorrect) drawRoundedFill(x, y, btnW, btnH, 18, "rgba(255,75,92,0.75)");

    drawStrokedText(ctx, `${key}:`, x + 10, y + 10, {
      font: "bold 19px system-ui",
      align: "left",
      baseline: "top",
      fill: "rgba(230,225,255,0.95)",
      stroke: "black",
      lineWidthRatio: 0.10
    });

    const text = answers[key] ?? "";
    drawStrokedWrappedText(ctx, text, x + btnW / 2, y + btnH / 2, btnW - 24, 28, "center", {
      font: "21px system-ui",
      fill: "#ffffff",
      stroke: "black",
      lineWidthRatio: 0.09
    });

    zones.answers[key] = { x, y, w: btnW, h: btnH };
  });

  const lifelineAreaTop = answerAreaBottom + 60;
  const lifelineH = 36;
  const lifelineMarginX = qCardX;
  const lifelineGap = 10;
  const lifelineW = (qCardW - lifelineGap * 2) / 3;

  const lifelines = [
    { type: "fifty", label: "50-50", used: state.lifelines.fiftyFiftyUsed },
    { type: "skip", label: "Kihagyás", used: state.lifelines.skipUsed },
    { type: "extraTime", label: "+5 mp", used: state.lifelines.extraTimeUsed }
  ];

  lifelines.forEach((lf, i) => {
    const x = lifelineMarginX + i * (lifelineW + lifelineGap);
    const y = lifelineAreaTop;

    drawGlassPanel(
      x,
      y,
      lifelineW,
      lifelineH,
      18,
      10,
      lf.used ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.12)",
      lf.used ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.22)"
    );

    drawStrokedText(ctx, lf.label, x + lifelineW / 2, y + lifelineH / 2, {
      font: "13px system-ui",
      align: "center",
      baseline: "middle",
      fill: "#ffffff",
      stroke: "black",
      lineWidthRatio: 0.12
    });

    zones.lifelines[lf.type] = { x, y, w: lifelineW, h: lifelineH };
  });

  if (state.status === "feedback") {
    const nextW = 190;
    const nextH = 40;
    const nextX = width / 2 - nextW / 2;
    const nextY = lifelineAreaTop - nextH - 10;

    drawGlassPanel(nextX, nextY, nextW, nextH, 22, 10, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.22)");
    drawRoundedFill(nextX, nextY, nextW, nextH, 22, "rgba(255,190,11,0.85)");

    drawStrokedText(ctx, "Következő kérdés", nextX + nextW / 2, nextY + nextH / 2, {
      font: "15px system-ui",
      align: "center",
      baseline: "middle",
      fill: "#000",
      stroke: "rgba(0,0,0,0)",
      lineWidthRatio: 0.10
    });

    zones.next = { x: nextX, y: nextY, w: nextW, h: nextH };
  }

  return zones;
}

function drawGlassPanel(x, y, w, h, r, blurPx = 10, overlayFill = "rgba(255,255,255,0.12)", strokeColor = "rgba(255,255,255,0.22)") {
  const path = makeRoundRectPath(x, y, w, h, r);

  ctx.save();
  ctx.clip(path);

  if (bgLoaded && bgImg) {
    ctx.filter = `blur(${blurPx}px)`;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const iw = bgImg.naturalWidth;
    const ih = bgImg.naturalHeight;
    const scale = Math.max(width / iw, height / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;
    ctx.drawImage(bgImg, dx, dy, dw, dh);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fill(path);
  }

  ctx.fillStyle = overlayFill;
  ctx.fill(path);

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.stroke(path);

  ctx.restore();
}

function drawRoundedFill(x, y, w, h, r, fillStyle) {
  const path = makeRoundRectPath(x, y, w, h, r);
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.fill(path);
  ctx.restore();
}

function makeRoundRectPath(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  const p = new Path2D();
  const right = x + w;
  const bottom = y + h;
  p.moveTo(x + radius, y);
  p.lineTo(right - radius, y);
  p.quadraticCurveTo(right, y, right, y + radius);
  p.lineTo(right, bottom - radius);
  p.quadraticCurveTo(right, bottom, right - radius, bottom);
  p.lineTo(x + radius, bottom);
  p.quadraticCurveTo(x, bottom, x, bottom - radius);
  p.lineTo(x, y + radius);
  p.quadraticCurveTo(x, y, x + radius, y);
  return p;
}

function parseFontPx(fontStr) {
  const m = /(\d+(?:\.\d+)?)px/i.exec(fontStr || "");
  return m ? parseFloat(m[1]) : 16;
}

function drawStrokedText(context, text, x, y, opts = {}) {
  const {
    font,
    align = "left",
    baseline = "alphabetic",
    fill = "#fff",
    stroke = "#000",
    lineWidthRatio = 0.08
  } = opts;

  if (font) context.font = font;
  context.textAlign = align;
  context.textBaseline = baseline;

  const px = parseFontPx(context.font);
  const lw = Math.max(1, px * lineWidthRatio);

  context.lineWidth = lw;
  context.lineJoin = "round";
  context.strokeStyle = stroke;
  context.strokeText(String(text), x, y);

  context.fillStyle = fill;
  context.fillText(String(text), x, y);
}

function drawStrokedWrappedText(context, text, x, y, maxWidth, lineHeight, align = "left", opts = {}) {
  if (!text) return;

  const { font, fill = "#fff", stroke = "#000", lineWidthRatio = 0.08 } = opts;
  if (font) context.font = font;

  const words = String(text).split(" ");
  let line = "";
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  context.textAlign = align;
  context.textBaseline = "top";

  const px = parseFontPx(context.font);
  const lw = Math.max(1, px * lineWidthRatio);
  context.lineWidth = lw;
  context.lineJoin = "round";
  context.strokeStyle = stroke;
  context.fillStyle = fill;

  for (let i = 0; i < lines.length; i++) {
    const ly = y - (lines.length * (lineHeight / 2)) + i * lineHeight;
    const t = lines[i].trim();
    context.strokeText(t, x, ly);
    context.fillText(t, x, ly);
  }
}

export function destroyCanvas() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener("resize", resizeForHiDPI);
  canvas && canvas.removeEventListener("click", handleCanvasClick);
}