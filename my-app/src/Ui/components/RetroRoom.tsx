// Retro theme: the whole page is one evening in a 70s listening room, drawn in 3D behind the content.
// A walnut console under a warm lamp holds the turntable; a crate of records stands in front of it, a
// speaker and a gig poster sit on the left. Scrolling moves the camera between a few set shots, one per
// section: close on the record's label at the very top, the whole room once you're in, the crate for
// About (its sleeve is pulled up), the record from above for the Journey (the tonearm follows the page,
// see RetroSideB), the poster for Skills, the turntable for Work, the lamp for Contact. The record spins
// while the music plays. Everything is built from simple shapes and textures drawn on canvases: no assets.
// three.js is loaded only when this mounts, so the other themes never download it.
import { useEffect, useRef, useState } from "react";
import { isBgmOn } from "../bgm";
import { NAV_SECTIONS } from "../data/sections";
import { profile } from "../data/profile";
import { roomBus, setRecordScreen } from "../retroRoomBus";

type V3 = [number, number, number];
interface Shot {
  pos: V3;
  look: V3;
  /** how far right the picture is shifted on wide screens (fraction of the width), to leave room for text */
  shift: number;
  /** how far the picture is moved up (fraction of the height): framing without tilting the camera */
  lift?: number;
}

// Room layout (1 unit ≈ 10 cm). The console stands against the back wall; the turntable sits on it.
const CONSOLE = { w: 9, h: 2.6, d: 2.2, z: -4.4, legs: 0.4 };
const TOP_Y = CONSOLE.legs + CONSOLE.h; // 3.0
// The turntable, at a real one's size next to the console (TT: its scale; the arm's radii are in record units)
const TT = 0.72;
const PLINTH = { w: 3.4 * TT, h: 0.3, d: 2.3 * TT, x: 0.85 + 0.25 * TT };
const DECK_Y = TOP_Y + PLINTH.h; // 3.3
const REC = { x: 0.85, z: -4.3, r: TT, y: DECK_Y + 0.1 }; // record centre, top surface height
const ARM = { x: 0.85 + 1.5 * TT, z: -4.3 - 0.8 * TT, len: 1.9 * TT }; // tonearm pivot and length
// the back wall stands clear of everything on the console (nothing pokes through it)
const WALL_Z = CONSOLE.z - CONSOLE.d / 2 - 0.25;
const CRATE = { x: -3.5, z: -2.3 };

// The shots, in page order: the opening close-up, then one per section
const OPEN: Shot = { pos: [REC.x, REC.y + 2.15, REC.z + 0.55], look: [REC.x, REC.y, REC.z], shift: 0 };
const SHOTS: Shot[] = [
  { pos: [-3.2, 5.6, 11.5], look: [0.6, 3.4, -4.6], shift: 0.08 }, // home: the room, nearly centred
  { pos: [-1.6, 2.6, 1.0], look: [CRATE.x, 1.2, CRATE.z], shift: 0.22 }, // about: the crate, close
  { pos: [REC.x + 0.5, REC.y + 1.25, REC.z + 1.7], look: [REC.x, REC.y, REC.z], shift: 0 }, // journey: follows the needle (set each frame)
  { pos: [-0.8, 4.9, 1.4], look: [-2.9, 5.0, WALL_Z], shift: 0.22 }, // skills: speaker and poster
  { pos: [3.6, 4.7, -1.0], look: [REC.x + 0.3, DECK_Y, REC.z], shift: 0.22 }, // work: the turntable
  { pos: [2.6, 3.8, 2.0], look: [4.4, 4.3, -3.6], shift: 0.22 }, // contact: the lamp
];

const SLEEVES = [
  { code: "A1", title: "About", colors: ["#9a4a2a", "#c97a3e", "#d4a03a"] },
  { code: "B1", title: "Journey", colors: ["#67703a", "#8c9448", "#d4a03a"] },
  { code: "A2", title: "Skills", colors: ["#2f5d7c", "#9bb7c4", "#efe1c5"] },
  { code: "A3", title: "Work", colors: ["#3a2314", "#9a4a2a", "#d4a03a"] },
  { code: "B2", title: "Contact", colors: ["#c97a3e", "#d4a03a", "#efe1c5"] },
];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Where the page is: 0–1 is the hero, 1–2 the first section, and so on (measured at the middle of the screen)
function pagePosition() {
  // the hero is pinned while the camera pulls back: there, go by how far through the pin you are
  const hero = document.getElementById("home");
  if (hero) {
    const pin = hero.offsetHeight - window.innerHeight;
    if (pin > 0 && window.scrollY < pin) return (window.scrollY / pin) * 0.72;
  }
  const ids = ["home", ...NAV_SECTIONS.map((s) => s.id)];
  const tops = ids.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? 0);
  const end = document.documentElement.scrollHeight - window.scrollY;
  const at = window.innerHeight * 0.5;
  for (let i = ids.length - 1; i >= 0; i--) {
    if (tops[i] <= at) {
      const next = i + 1 < ids.length ? tops[i + 1] : end;
      return i + Math.min(1, (at - tops[i]) / Math.max(1, next - tops[i]));
    }
  }
  return 0;
}

// The shot for a page position: the hero pulls back from the label to the room; each section holds its
// shot and blends into the next one over its last stretch.
function shotAt(p: number, shots: Shot[]): [Shot, Shot, number] {
  const i = Math.floor(p);
  const f = p - i;
  if (i === 0 && f < 0.6) return [OPEN, shots[0], smooth(clamp(f / 0.6))];
  const a = shots[Math.min(i, shots.length - 1)];
  const b = shots[Math.min(i + 1, shots.length - 1)];
  return [a, b, smooth(clamp((f - 0.72) / 0.28))];
}

// ── Canvas textures ──

function arcText(g: CanvasRenderingContext2D, text: string, cx: number, cy: number, r: number, top: boolean) {
  const widths = [...text].map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) / r;
  let a = top ? -Math.PI / 2 - total / 2 : Math.PI / 2 + total / 2;
  g.textAlign = "center";
  g.textBaseline = "middle";
  [...text].forEach((ch, i) => {
    const half = widths[i] / 2 / r;
    a += top ? half : -half;
    g.save();
    g.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    g.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2);
    g.fillText(ch, 0, 0);
    g.restore();
    a += top ? half : -half;
  });
}

/** The record's top face: grooves, and the label (name curved over the top, a line along the bottom). */
function drawRecord(g: CanvasRenderingContext2D, top: string, bottom: string, middle: string) {
  const S = g.canvas.width;
  const c = S / 2;
  g.clearRect(0, 0, S, S);
  g.fillStyle = "#14100e";
  g.fillRect(0, 0, S, S);
  // grooves, with a few wider gaps between "tracks"
  for (let r = c - 6; r > c * 0.36; r -= 3) {
    const gap = [0.86, 0.74, 0.62, 0.5].some((k) => Math.abs(r - c * k) < 4);
    g.strokeStyle = gap ? "rgba(0,0,0,0.9)" : r % 2 ? "rgba(255,240,220,0.05)" : "rgba(255,240,220,0.022)";
    g.lineWidth = gap ? 4 : 1.4;
    g.beginPath();
    g.arc(c, c, r, 0, Math.PI * 2);
    g.stroke();
  }
  const lr = c * 0.34;
  g.fillStyle = "#d4a03a";
  g.beginPath();
  g.arc(c, c, lr, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(154,74,42,0.75)";
  g.lineWidth = 3;
  [0.62, 0.56].forEach((k) => {
    g.beginPath();
    g.arc(c, c, lr * k, 0, Math.PI * 2);
    g.stroke();
  });
  g.fillStyle = "#9a4a2a";
  g.font = `${Math.round(lr * 0.27)}px Shrikhand, Georgia, serif`;
  arcText(g, top, c, c, lr * 0.78, true);
  g.fillStyle = "#3a2314";
  g.font = `${Math.round(lr * 0.2)}px "Bebas Neue", "Arial Narrow", sans-serif`;
  arcText(g, bottom, c, c, lr * 0.8, false);
  g.font = `${Math.round(lr * 0.1)}px "Bebas Neue", "Arial Narrow", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(middle, c, c - lr * 0.3);
  g.fillText("33⅓ RPM", c, c + lr * 0.3);
  g.fillStyle = "#14100e";
  g.beginPath();
  g.arc(c, c, lr * 0.05, 0, Math.PI * 2);
  g.fill();
}

function drawPlanks(g: CanvasRenderingContext2D) {
  const S = g.canvas.width;
  for (let x = 0; x < S; x += 64) {
    g.fillStyle = (x / 64) % 2 ? "#4b2e1d" : "#543423";
    g.fillRect(x, 0, 64, S);
    g.fillStyle = "rgba(0,0,0,0.45)";
    g.fillRect(x, 0, 3, S);
    g.strokeStyle = "rgba(255,220,180,0.035)";
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      g.moveTo(x + 10 + k * 9, 0);
      g.bezierCurveTo(x + 4 + k * 9, S * 0.3, x + 16 + k * 9, S * 0.7, x + 9 + k * 9, S);
      g.stroke();
    }
  }
}

// The view through the window: Phnom Penh at night. A moon, stars, the city's lit windows, a tiered Khmer
// tower on the skyline, and the river along the bottom with the lights in it.
// The receiver's face: brushed metal, an amber tuning dial, two VU meters and knobs. `glow` draws only the
// parts that light up (for the emissive map).
function drawReceiver(g: CanvasRenderingContext2D, glow = false) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  if (!glow) {
    const metal = g.createLinearGradient(0, 0, 0, H);
    metal.addColorStop(0, "#c9c2b4");
    metal.addColorStop(1, "#8f887c");
    g.fillStyle = metal;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,0.08)";
    for (let x = 0; x < W; x += 3) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }
    g.fillStyle = "#1a1410";
    g.fillRect(W * 0.04, H * 0.14, W * 0.56, H * 0.42);
  } else {
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
  }
  // the dial window, lit amber, with the band's numbers and a red pointer
  const dial = g.createLinearGradient(0, H * 0.16, 0, H * 0.54);
  dial.addColorStop(0, "#ffcc78");
  dial.addColorStop(1, "#e08a2c");
  g.fillStyle = dial;
  g.fillRect(W * 0.06, H * 0.17, W * 0.52, H * 0.36);
  g.fillStyle = "rgba(60,25,5,0.85)";
  g.font = `${Math.round(H * 0.07)}px sans-serif`;
  ["88", "92", "96", "100", "104", "108"].forEach((n, i) => g.fillText(n, W * (0.08 + i * 0.085), H * 0.3));
  for (let i = 0; i < 40; i++) g.fillRect(W * (0.08 + i * 0.0122), H * 0.4, 1.5, i % 5 ? H * 0.04 : H * 0.07);
  g.fillStyle = "#c0281a";
  g.fillRect(W * 0.36, H * 0.19, 3, H * 0.32);
  // two VU meters
  [0.66, 0.82].forEach((x) => {
    g.fillStyle = glow ? "#fff1c8" : "#f3e2b0";
    g.fillRect(W * x, H * 0.17, W * 0.13, H * 0.36);
    if (glow) return;
    g.strokeStyle = "#3a2314";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(W * (x + 0.065), H * 0.56, H * 0.28, Math.PI * 1.2, Math.PI * 1.8);
    g.stroke();
    g.beginPath();
    g.moveTo(W * (x + 0.065), H * 0.53);
    g.lineTo(W * (x + 0.035), H * 0.25);
    g.stroke();
  });
  if (glow) return;
  // knobs along the bottom
  for (let i = 0; i < 6; i++) {
    const cx = W * (0.09 + i * 0.165);
    const k = g.createRadialGradient(cx - 4, H * 0.75 - 4, 2, cx, H * 0.75, H * 0.11);
    k.addColorStop(0, "#f2eee6");
    k.addColorStop(1, "#5d574e");
    g.fillStyle = k;
    g.beginPath();
    g.arc(cx, H * 0.76, H * 0.1, 0, Math.PI * 2);
    g.fill();
  }
}

// A curtain: deep rust with soft vertical folds (the geometry is folded too, so the light catches them)
function drawCurtain(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  for (let x = 0; x < W; x++) {
    const f = 0.72 + 0.28 * Math.cos((x / W) * Math.PI * 2 * 5);
    g.fillStyle = `rgb(${Math.round(128 * f)},${Math.round(52 * f)},${Math.round(26 * f)})`;
    g.fillRect(x, 0, 1, H);
  }
  // a 70s band near the hem
  g.fillStyle = "rgba(212,160,58,0.55)";
  g.fillRect(0, H * 0.86, W, H * 0.025);
  g.fillStyle = "rgba(201,122,62,0.5)";
  g.fillRect(0, H * 0.895, W, H * 0.02);
}

// One leaf, for the plant on the sill (alpha-tested)
function drawLeaf(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = "#3d5a30";
  g.beginPath();
  g.moveTo(W / 2, H);
  g.bezierCurveTo(-W * 0.1, H * 0.6, W * 0.15, H * 0.05, W / 2, 0);
  g.bezierCurveTo(W * 0.85, H * 0.05, W * 1.1, H * 0.6, W / 2, H);
  g.fill();
  g.strokeStyle = "rgba(20,35,15,0.8)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(W / 2, H);
  g.lineTo(W / 2, H * 0.08);
  g.stroke();
}

// A 70s art print for the frames on the wall: a striped sunset, rainbow bars, or a sun over a hill
function drawArt(g: CanvasRenderingContext2D, kind: "sun" | "bars" | "hill") {
  const W = g.canvas.width;
  const H = g.canvas.height;
  const C = ["#9a4a2a", "#c97a3e", "#d4a03a", "#67703a"];
  g.fillStyle = "#efe1c5";
  g.fillRect(0, 0, W, H);
  if (kind === "sun") {
    C.forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath();
      g.arc(W / 2, H * 0.78, W * (0.46 - i * 0.1), Math.PI, 0);
      g.fill();
    });
    g.fillStyle = "#efe1c5";
    g.fillRect(0, H * 0.78, W, H);
    C.forEach((c, i) => {
      g.fillStyle = c;
      g.fillRect(0, H * (0.8 + i * 0.05), W, H * 0.035);
    });
  } else if (kind === "bars") {
    C.forEach((c, i) => {
      g.fillStyle = c;
      const x = W * (0.14 + i * 0.19);
      g.beginPath();
      g.roundRect(x, H * 0.12, W * 0.14, H * 0.76, W * 0.07);
      g.fill();
    });
  } else {
    g.fillStyle = "#d4a03a";
    g.beginPath();
    g.arc(W * 0.62, H * 0.42, W * 0.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#67703a";
    g.beginPath();
    g.ellipse(W * 0.35, H * 1.05, W * 0.75, H * 0.45, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#9a4a2a";
    g.beginPath();
    g.ellipse(W * 0.85, H * 1.1, W * 0.55, H * 0.35, 0, 0, Math.PI * 2);
    g.fill();
  }
}

function drawWindowView(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const horizon = H * 0.7;
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#0a1228");
  sky.addColorStop(0.55, "#1d2850");
  sky.addColorStop(1, "#5a3a4a");
  g.fillStyle = sky;
  g.fillRect(0, 0, W, horizon);
  // stars
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(255,245,220,${0.25 + rnd() * 0.6})`;
    const r = rnd() < 0.15 ? 1.6 : 0.9;
    g.beginPath();
    g.arc(rnd() * W, rnd() * horizon * 0.65, r, 0, Math.PI * 2);
    g.fill();
  }
  // the moon, with its glow
  const mx = W * 0.74;
  const my = H * 0.44; // low, just rising over the city
  const glow = g.createRadialGradient(mx, my, 0, mx, my, 110);
  glow.addColorStop(0, "rgba(255,236,190,0.45)");
  glow.addColorStop(1, "rgba(255,236,190,0)");
  g.fillStyle = glow;
  g.fillRect(mx - 110, my - 110, 220, 220);
  g.fillStyle = "#f6ead0";
  g.beginPath();
  g.arc(mx, my, 24, 0, Math.PI * 2);
  g.fill();
  // the far city: blocks with lit windows
  const city = (base: number, color: string, minH: number, maxH: number, lit: number) => {
    let x = -10;
    while (x < W) {
      const w = 18 + rnd() * 46;
      const h = minH + rnd() * (maxH - minH);
      g.fillStyle = color;
      g.fillRect(x, base - h, w, h + 2);
      for (let wy = base - h + 6; wy < base - 6; wy += 9) {
        for (let wx = x + 4; wx < x + w - 5; wx += 8) {
          if (rnd() < lit) {
            g.fillStyle = `rgba(255,${190 + Math.floor(rnd() * 40)},110,${0.55 + rnd() * 0.4})`;
            g.fillRect(wx, wy, 3.5, 4.5);
          }
        }
      }
      x += w + rnd() * 6;
    }
  };
  city(horizon, "#1c1a30", 20, 95, 0.22);
  // a tiered Khmer tower on the skyline, warm light on its face
  const tx = W * 0.34;
  g.fillStyle = "#2a2234";
  let ty = horizon;
  let tw = 78;
  for (let i = 0; i < 6; i++) {
    const th = 22 - i * 2;
    g.fillRect(tx - tw / 2, ty - th, tw, th);
    g.fillStyle = "rgba(255,170,90,0.35)";
    g.fillRect(tx - tw / 2, ty - th, tw, 2);
    g.fillStyle = "#2a2234";
    ty -= th;
    tw *= 0.78;
  }
  g.beginPath();
  g.moveTo(tx - tw / 2, ty);
  g.lineTo(tx, ty - 46);
  g.lineTo(tx + tw / 2, ty);
  g.fill();
  city(horizon, "#120f1e", 6, 40, 0.3);
  // the river, the city's lights trailing in it
  const river = g.createLinearGradient(0, horizon, 0, H);
  river.addColorStop(0, "#1a1c34");
  river.addColorStop(1, "#0b0c1a");
  g.fillStyle = river;
  g.fillRect(0, horizon, W, H - horizon);
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W;
    const y = horizon + 4 + rnd() * (H - horizon - 8);
    g.fillStyle = `rgba(255,200,120,${0.12 + rnd() * 0.3})`;
    g.fillRect(x, y, 6 + rnd() * 16, 1.5);
  }
  g.fillStyle = "rgba(255,236,190,0.35)";
  for (let y = horizon + 6; y < H; y += 5) g.fillRect(mx - 10 - rnd() * 8, y, 20 + rnd() * 16, 1.5);
}

function drawWalnut(g: CanvasRenderingContext2D, slats: boolean) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.fillStyle = "#6a3c22";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(40,18,8,0.25)";
  for (let y = 0; y < H; y += 7) {
    g.beginPath();
    g.moveTo(0, y);
    g.bezierCurveTo(W * 0.3, y + 5, W * 0.6, y - 5, W, y + 2);
    g.stroke();
  }
  if (!slats) return;
  // two sliding doors with vertical slats, and a brass pull on each
  const pad = W * 0.04;
  const doorW = (W - pad * 3) / 2;
  [0, 1].forEach((d) => {
    const x0 = pad + d * (doorW + pad);
    g.fillStyle = "rgba(20,8,2,0.35)";
    g.fillRect(x0, H * 0.12, doorW, H * 0.76);
    for (let x = x0 + 6; x < x0 + doorW - 6; x += 14) {
      g.fillStyle = "#7a4628";
      g.fillRect(x, H * 0.14, 9, H * 0.72);
    }
    g.fillStyle = "#d4a03a";
    g.fillRect(d ? x0 + 14 : x0 + doorW - 22, H * 0.45, 8, H * 0.1);
  });
}

function drawGrille(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.fillStyle = "#6a3c22";
  g.fillRect(0, 0, W, H);
  const p = W * 0.07;
  g.fillStyle = "#2a1c15";
  g.fillRect(p, p, W - p * 2, H - p * 2);
  g.strokeStyle = "rgba(212,160,58,0.08)";
  for (let y = p; y < H - p; y += 4) {
    g.beginPath();
    g.moveTo(p, y);
    g.lineTo(W - p, y);
    g.stroke();
  }
  // a 70s badge
  g.fillStyle = "#d4a03a";
  g.font = `${Math.round(W * 0.07)}px "Bebas Neue", sans-serif`;
  g.textAlign = "center";
  g.fillText("ROTANA · HI-FI", W / 2, H - p * 1.6);
}

function drawPoster(g: CanvasRenderingContext2D) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.fillStyle = "#efe1c5";
  g.fillRect(0, 0, W, H);
  // the 70s stripes and a striped sun: the one place they appear
  const sky = g.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, "#3a2314");
  sky.addColorStop(1, "#9a4a2a");
  g.fillStyle = sky;
  g.fillRect(W * 0.08, W * 0.08, W * 0.84, H * 0.56);
  g.save();
  g.beginPath();
  g.rect(W * 0.08, W * 0.08, W * 0.84, H * 0.56);
  g.clip();
  g.fillStyle = "#d4a03a";
  g.beginPath();
  g.arc(W / 2, H * 0.6, W * 0.3, Math.PI, 0);
  g.fill();
  g.fillStyle = "#9a4a2a";
  for (let k = 0; k < 4; k++) g.fillRect(W * 0.1, H * 0.6 - W * (0.05 + k * 0.06), W * 0.8, W * 0.022);
  g.restore();
  ["#9a4a2a", "#c97a3e", "#d4a03a", "#67703a"].forEach((col, k) => {
    g.fillStyle = col;
    g.fillRect(W * 0.08, H * 0.64 + k * W * 0.04, W * 0.84, W * 0.03);
  });
  g.fillStyle = "#3a2314";
  g.textAlign = "center";
  g.font = `${Math.round(W * 0.12)}px Shrikhand, Georgia, serif`;
  g.fillText(profile.name, W / 2, H * 0.86);
  g.font = `${Math.round(W * 0.06)}px "Bebas Neue", sans-serif`;
  g.fillText("LIVE IN PHNOM PENH · SIDE A & B", W / 2, H * 0.93);
}

function drawSleeve(g: CanvasRenderingContext2D, s: (typeof SLEEVES)[number]) {
  const S = g.canvas.width;
  g.fillStyle = "#efe1c5";
  g.fillRect(0, 0, S, S);
  s.colors.forEach((col, k) => {
    g.fillStyle = col;
    g.fillRect(0, S * (0.56 + k * 0.1), S, S * 0.1);
  });
  g.fillStyle = "#3a2314";
  g.font = `${Math.round(S * 0.07)}px "Bebas Neue", sans-serif`;
  g.textAlign = "left";
  g.fillText(`SIDE ${s.code[0]} · ${s.code}`, S * 0.08, S * 0.14);
  g.font = `${Math.round(S * 0.15)}px Shrikhand, Georgia, serif`;
  g.fillText(s.title, S * 0.08, S * 0.36);
  g.font = `${Math.round(S * 0.06)}px "Bebas Neue", sans-serif`;
  g.fillText(profile.name.toUpperCase(), S * 0.08, S * 0.48);
}

function drawRug(g: CanvasRenderingContext2D) {
  const S = g.canvas.width;
  const c = S / 2;
  const bands = ["#9a4a2a", "#c97a3e", "#d4a03a", "#67703a", "#3a2314"];
  for (let k = 0; k < 10; k++) {
    g.fillStyle = bands[k % bands.length];
    g.beginPath();
    g.arc(c, c, c - k * (c / 10), 0, Math.PI * 2);
    g.fill();
  }
}

// The hero-only view (inside the Retro opening): the room from the front, the record dead centre
// ...which starts close over the turntable, so the opening's big disc reads as this record up close
// ...which starts in the dark, low in front of the turntable: the record in the foreground, the night window
// glowing behind it
// (shifted right on wide screens: the title card sits on the left, like an album cover). The camera is
// level, so the window, the curtains and the boards stand straight; `lift` frames it instead of a tilt.
const HERO_START: Shot = { pos: [REC.x - 1.1, 5.05, REC.z + 6.2], look: [REC.x + 1.3, 5.05, REC.z - 1.2], shift: 0.16, lift: 0.27 };
// The needle drop, along the opening's progress t (0 → 1, roomBus.heroP): the arm swings over the record,
// lowers, touches down (the record starts turning), the floor lamp comes on, then the camera pulls back.
const DROP = { swing: [0, 0.3], lower: [0.28, 0.1], lights: [0.4, 0.3], pull: [0.42, 0.58] } as const;
const ARM_PARKED = 1.34 * TT;
const ARM_ON = 0.94 * TT;
const span = (t: number, [from, len]: readonly [number, number]) => clamp((t - from) / len);
export const NEEDLE_DOWN = DROP.lower[0] + DROP.lower[1];
// (level and square on to the middle of the scene, the window over the turntable, so the room sits
// centred between the name and the crate; `lift` frames it without tilting)
const HERO: Shot = { pos: [1.6, 4.9, REC.z + 7.6], look: [1.6, 4.9, REC.z], shift: 0, lift: 0.14 };

/** `heroOnly`: just the room behind the opening (RetroGateway), sized to its box, camera fixed on the
 *  record; the rest of the page stays 2D. Otherwise the whole-page room (opened with ?room). */
export function RetroRoom({ heroOnly = false }: { heroOnly?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    import("three").then(async (THREE) => {
      // the label and poster use the page's fonts: wait for them, so the canvases don't fall back to Georgia
      await document.fonts?.ready.catch(() => undefined);
      if (disposed) return;
      const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const lite = Math.min(window.innerWidth, window.innerHeight) < 640 || (navigator.hardwareConcurrency ?? 8) <= 4;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: !lite, powerPreference: "high-performance" });
      } catch {
        return; // no WebGL: the dark room colour behind the page stays
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1 : 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.shadowMap.enabled = !lite;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.className = "retro-room-canvas";
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x140c08);
      scene.fog = new THREE.Fog(0x140c08, 13, 30);
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);

      const disposables: { dispose: () => void }[] = [];
      const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);
      const std = (opts: ConstructorParameters<typeof THREE.MeshStandardMaterial>[0]) =>
        keep(new THREE.MeshStandardMaterial({ roughness: 0.75, ...opts }));
      const texture = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        draw(canvas.getContext("2d")!);
        const t = keep(new THREE.CanvasTexture(canvas));
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      };
      const box = (w: number, h: number, d: number, mat: InstanceType<typeof THREE.Material> | InstanceType<typeof THREE.Material>[]) => {
        const m = new THREE.Mesh(keep(new THREE.BoxGeometry(w, h, d)), mat);
        m.castShadow = m.receiveShadow = true;
        return m;
      };

      // ── Light: a warm lamp, a soft fill, and a spot that pools on the turntable ──
      const hemi = new THREE.HemisphereLight(0xffd9b0, 0x1a0f0a, 0.8);
      scene.add(hemi);
      const fill = new THREE.DirectionalLight(0xa9b8d6, 0.35);
      fill.position.set(-6, 6, 8);
      scene.add(fill);
      const bulb = new THREE.PointLight(0xffa860, 28, 0, 2);
      bulb.position.set(5.4, 5.35, -3.7);
      scene.add(bulb);
      const spot = new THREE.SpotLight(0xffc489, 70, 0, 0.55, 0.75, 2);
      spot.position.set(3.2, 8.2, -0.6);
      spot.target.position.set(REC.x - 0.4, TOP_Y, REC.z + 0.4);
      spot.castShadow = !lite;
      spot.shadow.mapSize.set(1024, 1024);
      spot.shadow.bias = -0.0004;
      scene.add(spot, spot.target);

      // ── The room ──
      const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(40, 40)), std({ color: 0x2c1a10, roughness: 0.9 }));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      const planks = texture(512, 512, drawPlanks);
      planks.wrapS = planks.wrapT = THREE.RepeatWrapping;
      planks.repeat.set(5, 1.6);
      const wall = new THREE.Mesh(keep(new THREE.PlaneGeometry(40, 14)), std({ map: planks, roughness: 0.85 }));
      wall.position.set(0, 7, WALL_Z);
      wall.receiveShadow = true;
      scene.add(wall);
      // a window above the turntable: Phnom Penh at night, and moonlight falling in through it
      const WIN = { x: 1.3, y: 4.95, w: 3.4, h: 1.7 };
      const view = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(WIN.w, WIN.h)),
        keep(new THREE.MeshBasicMaterial({ map: texture(640, 400, drawWindowView), toneMapped: false })),
      );
      view.position.set(WIN.x, WIN.y, WALL_Z + 0.01);
      scene.add(view);
      const sash = std({ color: 0x4a2a17, roughness: 0.7 });
      const frameBits: [number, number, number, number, number][] = [
        // w, h, d, x, y
        [WIN.w + 0.28, 0.14, 0.16, WIN.x, WIN.y + WIN.h / 2 + 0.07],
        [WIN.w + 0.28, 0.14, 0.16, WIN.x, WIN.y - WIN.h / 2 - 0.07],
        [0.14, WIN.h, 0.16, WIN.x - WIN.w / 2 - 0.07, WIN.y],
        [0.14, WIN.h, 0.16, WIN.x + WIN.w / 2 + 0.07, WIN.y],
        [0.06, WIN.h, 0.08, WIN.x, WIN.y],
        [WIN.w, 0.06, 0.08, WIN.x, WIN.y + 0.15],
      ];
      frameBits.forEach(([w, h, d, x, y]) => {
        const m = box(w, h, d, sash);
        m.position.set(x, y, WALL_Z + d / 2);
        scene.add(m);
      });
      const sill = box(WIN.w + 0.6, 0.1, 0.38, sash);
      sill.position.set(WIN.x, WIN.y - WIN.h / 2 - 0.19, WALL_Z + 0.19);
      scene.add(sill);
      const moon = new THREE.SpotLight(0x9fb4ff, 14, 0, 0.7, 0.9, 2);
      moon.position.set(WIN.x + 0.6, WIN.y + 0.4, WALL_Z + 0.2);
      moon.target.position.set(WIN.x - 0.6, TOP_Y, -2.4);
      scene.add(moon, moon.target);

      // curtains on a brass rod, either side of the window, folded
      const rod = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.035, 0.035, WIN.w + 2.3, 12)), std({ color: 0xb08a4a, metalness: 0.7, roughness: 0.35 }));
      rod.rotation.z = Math.PI / 2;
      rod.position.set(WIN.x, WIN.y + WIN.h / 2 + 0.45, WALL_Z + 0.5); // (in front of the sill, so the sill never cuts through the curtains)
      scene.add(rod);
      const curtainMat = std({ map: texture(256, 512, drawCurtain), roughness: 0.95, side: THREE.DoubleSide });
      [-1, 1].forEach((side) => {
        const geo = keep(new THREE.PlaneGeometry(0.95, 2.95, 30, 1));
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) / 0.95) * Math.PI * 2 * 5) * 0.05);
        geo.computeVertexNormals();
        const c = new THREE.Mesh(geo, curtainMat);
        c.position.set(WIN.x + side * (WIN.w / 2 + 0.22), WIN.y + WIN.h / 2 + 0.43 - 1.475, WALL_Z + 0.46);
        c.receiveShadow = true;
        scene.add(c);
      });

      // a plant on the sill, a silhouette against the moonlit city
      const SILL_Y = WIN.y - WIN.h / 2 - 0.14;
      const pot = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 20)), std({ color: 0xa0522d, roughness: 0.8 }));
      pot.position.set(WIN.x + 1.05, SILL_Y + 0.15, WALL_Z + 0.2);
      scene.add(pot);
      const leafMat = std({ map: texture(128, 256, drawLeaf), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 });
      const leafGeo = keep(new THREE.PlaneGeometry(0.32, 0.62));
      leafGeo.translate(0, 0.31, 0);
      [-1.1, -0.55, -0.15, 0.25, 0.7, 1.15, 0.05].forEach((a, i) => {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(pot.position.x, SILL_Y + 0.28, pot.position.z);
        leaf.rotation.set(-0.15 + (i % 2) * 0.3, (i * 0.9) % Math.PI, a);
        leaf.scale.setScalar(i === 6 ? 1.25 : 0.85 + (i % 3) * 0.12);
        scene.add(leaf);
      });

      // a 70s hi-fi receiver on the console, its dial and meters glowing amber
      const RX = { x: 3.2, w: 1.55, h: 0.58, d: 1.15 };
      const receiver = box(RX.w, RX.h, RX.d, std({ map: texture(256, 128, (g) => drawWalnut(g, false)), roughness: 0.6 }));
      receiver.position.set(RX.x, TOP_Y + RX.h / 2, CONSOLE.z + 0.15);
      scene.add(receiver);
      const face = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(RX.w - 0.08, RX.h - 0.08)),
        std({
          map: texture(512, 192, (g) => drawReceiver(g)),
          emissiveMap: texture(512, 192, (g) => drawReceiver(g, true)),
          emissive: 0xffffff,
          emissiveIntensity: 0.7,
          roughness: 0.45,
          metalness: 0.3,
        }),
      );
      face.position.set(RX.x, TOP_Y + RX.h / 2, CONSOLE.z + 0.15 + RX.d / 2 + 0.005);
      scene.add(face);
      const dialGlow = new THREE.PointLight(0xffa040, 1.2, 4, 2);
      dialGlow.position.set(RX.x - 0.2, TOP_Y + RX.h / 2, CONSOLE.z + 0.15 + RX.d / 2 + 0.35);
      scene.add(dialGlow);

      // the left of the room: prints on the wall, and a plant in front (low, under the title card)
      const frameWood = std({ color: 0x2a1a10, roughness: 0.6 });
      (
        [
          ["sun", -2.85, 5.75, 1.0, 1.25],
          // (in the opening the clock hangs up here, and this print below the big one)
          heroOnly ? (["bars", -2.85, 4.4, 0.72, 0.72] as const) : (["bars", -1.7, 6.05, 0.72, 0.72] as const),
          heroOnly ? (["hill", -1.7, 4.95, 0.72, 0.56] as const) : (["hill", -1.7, 5.2, 0.72, 0.56] as const),
        ] as const
      ).forEach(([kind, x, y, w, h]) => {
        const f = box(w + 0.14, h + 0.14, 0.06, frameWood);
        f.position.set(x, y, WALL_Z + 0.03);
        scene.add(f);
        const art = new THREE.Mesh(keep(new THREE.PlaneGeometry(w, h)), std({ map: texture(256, Math.round((256 * h) / w), (g) => drawArt(g, kind)), roughness: 0.9 }));
        art.position.set(x, y, WALL_Z + 0.065);
        scene.add(art);
      });
      // on the console's left, kept low (under the title card): LPs lying flat, a mug resting on top
      const LP = REC.r * 2 * 1.04;
      ["#9a4a2a", "#d4a03a", "#67703a", "#c97a3e"].forEach((c, i) => {
        const lp = box(LP, 0.035, LP, std({ color: c, roughness: 0.8 }));
        lp.position.set(-1.35 + (i % 2) * 0.05, TOP_Y + 0.02 + i * 0.037, CONSOLE.z + 0.15 - (i % 3) * 0.04);
        lp.rotation.y = (i - 1.5) * 0.09;
        scene.add(lp);
      });
      const mugMat = std({ color: 0xefe1c5, roughness: 0.5 });
      const MUG = { x: -1.15, y: TOP_Y + 0.165 + 0.14, z: CONSOLE.z + 0.35 }; // on the stack
      const mug = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.13, 0.12, 0.28, 24)), mugMat);
      mug.position.set(MUG.x, MUG.y, MUG.z);
      mug.castShadow = true;
      const handle = new THREE.Mesh(keep(new THREE.TorusGeometry(0.075, 0.022, 8, 16)), mugMat);
      handle.position.set(MUG.x + 0.15, MUG.y + 0.01, MUG.z);
      const coffee = new THREE.Mesh(keep(new THREE.CircleGeometry(0.115, 20)), std({ color: 0x2a140a, roughness: 0.3 }));
      coffee.rotation.x = -Math.PI / 2;
      coffee.position.set(MUG.x, MUG.y + 0.12, MUG.z);
      scene.add(mug, handle, coffee);

      const bigPot = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.38, 0.3, 0.75, 24)), std({ color: 0x8a4526, roughness: 0.8 }));
      bigPot.position.set(-1.7, 0.375, -2.55);
      scene.add(bigPot);
      for (let i = 0; i < 16; i++) {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        const h = 1.4 + (i / 15) * 1.9;
        const a = i * 2.4;
        leaf.position.set(-1.7 + Math.cos(a) * 0.25, h, -2.55 + Math.sin(a) * 0.25);
        leaf.rotation.set(-0.5 + (i % 3) * 0.25, a, (i % 2 ? 1 : -1) * (0.6 + (i % 4) * 0.15));
        leaf.scale.setScalar(1.7 + (i % 3) * 0.3);
        scene.add(leaf);
      }

      const side = new THREE.Mesh(keep(new THREE.PlaneGeometry(40, 14)), std({ map: planks, roughness: 0.85 }));
      side.rotation.y = Math.PI / 2;
      side.position.set(-10, 7, 0);
      scene.add(side);

      const rug = new THREE.Mesh(keep(new THREE.CircleGeometry(4.2, 64)), std({ map: texture(1024, 1024, drawRug), roughness: 1 }));
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(-0.5, 0.01, -0.6);
      rug.receiveShadow = true;
      scene.add(rug);

      // ── The console: walnut, slatted sliding doors, short tapered legs ──
      const walnut = std({ map: texture(512, 256, (g) => drawWalnut(g, false)), roughness: 0.55 });
      const front = std({ map: texture(1024, 320, (g) => drawWalnut(g, true)), roughness: 0.55 });
      const consoleBody = box(CONSOLE.w, CONSOLE.h, CONSOLE.d, [walnut, walnut, walnut, walnut, front, walnut]);
      consoleBody.position.set(0, CONSOLE.legs + CONSOLE.h / 2, CONSOLE.z);
      scene.add(consoleBody);
      const legMat = std({ color: 0x2a170d });
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const leg = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.07, 0.04, CONSOLE.legs, 10)), legMat);
          leg.position.set(sx * (CONSOLE.w / 2 - 0.35), CONSOLE.legs / 2, CONSOLE.z + sz * (CONSOLE.d / 2 - 0.3));
          scene.add(leg);
        }

      // ── The turntable: plinth, platter, the record, the tonearm ──
      const plinth = box(PLINTH.w, PLINTH.h, PLINTH.d, std({ color: 0x8a5634, roughness: 0.45 }));
      plinth.position.set(PLINTH.x, TOP_Y + PLINTH.h / 2, REC.z);
      scene.add(plinth);
      const plate = box(PLINTH.w - 0.12, 0.02, PLINTH.d - 0.12, std({ color: 0x1c1512, roughness: 0.6 }));
      plate.position.set(PLINTH.x, DECK_Y + 0.01, REC.z);
      scene.add(plate);
      const platter = new THREE.Mesh(keep(new THREE.CylinderGeometry(REC.r + 0.04, REC.r + 0.04, 0.07, 64)), std({ color: 0xb8b2a8, metalness: 0.8, roughness: 0.35 }));
      platter.position.set(REC.x, DECK_Y + 0.055, REC.z);
      platter.castShadow = true;
      scene.add(platter);

      const recCanvas = document.createElement("canvas");
      recCanvas.width = recCanvas.height = 1024;
      const recG = recCanvas.getContext("2d")!;
      let labelKey = "";
      const setLabel = (top: string, bottom: string, middle: string) => {
        const key = `${top}|${bottom}|${middle}`;
        if (key === labelKey) return false;
        labelKey = key;
        drawRecord(recG, top, bottom, middle);
        recTex.needsUpdate = true;
        return true;
      };
      const recTex = keep(new THREE.CanvasTexture(recCanvas));
      recTex.colorSpace = THREE.SRGBColorSpace;
      recTex.anisotropy = 8;
      setLabel(profile.name, "★ PORTFOLIO ★", "NOW PLAYING · SIDE A");
      const vinylEdge = std({ color: 0x0e0b0a, roughness: 0.3 });
      const record = new THREE.Mesh(keep(new THREE.CylinderGeometry(REC.r, REC.r, 0.02, 96)), [
        vinylEdge,
        std({ map: recTex, roughness: 0.32, metalness: 0.1 }),
        vinylEdge,
      ]);
      record.position.set(REC.x, REC.y - 0.01, REC.z);
      record.rotation.y = Math.PI / 2; // the label reads upright from the front
      record.castShadow = true;
      scene.add(record);
      const spindle = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 12)), std({ color: 0xd9d0bf, metalness: 0.9, roughness: 0.3 }));
      spindle.position.set(REC.x, REC.y + 0.04, REC.z);
      scene.add(spindle);

      const chrome = std({ color: 0xd9d0bf, metalness: 0.85, roughness: 0.3 });
      const pivotBase = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.16 * TT, 0.2 * TT, 0.22, 24)), chrome);
      pivotBase.position.set(ARM.x, DECK_Y + 0.11, ARM.z);
      pivotBase.castShadow = true;
      scene.add(pivotBase);
      const arm = new THREE.Group();
      arm.position.set(ARM.x, REC.y + 0.16, ARM.z);
      const bar = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.025, 0.025, ARM.len, 10)), chrome);
      bar.rotation.z = Math.PI / 2;
      bar.position.x = ARM.len / 2;
      bar.castShadow = true;
      // the headshell, angled in towards the record as on a real arm, with the cartridge and stylus under
      // it: lowered, the stylus sits on the vinyl (the arm's lowered height is REC.y + 0.16)
      const headshell = new THREE.Group();
      headshell.position.set(ARM.len, 0, 0);
      headshell.rotation.y = -0.38;
      const head = box(0.26 * TT, 0.04, 0.15 * TT, std({ color: 0x2a1c15, roughness: 0.5 }));
      head.position.set(0.06 * TT, -0.03, 0);
      const cartridge = box(0.13 * TT, 0.07, 0.09 * TT, std({ color: 0x8a1c14, roughness: 0.45 }));
      cartridge.position.set(0.07 * TT, -0.085, 0);
      const stylus = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.004, 0.012, 0.04, 6)), chrome);
      stylus.position.set(0.1 * TT, -0.14, 0);
      const lift = box(0.1 * TT, 0.012, 0.025, chrome); // the finger lift
      lift.position.set(0.17 * TT, -0.02, 0.07 * TT);
      headshell.add(head, cartridge, stylus, lift);
      const counter = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.09 * TT, 0.09 * TT, 0.2 * TT, 16)), chrome);
      counter.rotation.z = Math.PI / 2;
      counter.position.x = -0.32 * TT;
      // the pivot: a bearing housing on a post that runs down into the base, so the arm is mounted, not floating
      const bearing = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.075 * TT + 0.02, 0.075 * TT + 0.02, 0.1, 20)), chrome);
      const post = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 12)), chrome);
      post.position.y = -0.11;
      arm.add(bar, headshell, counter, bearing, post);
      scene.add(arm);

      // the arm rest beside the base, where the arm parks (the parked angle, as angleFor works it out below)
      {
        const dx = REC.x - ARM.x;
        const dz = REC.z - ARM.z;
        const d = Math.hypot(dx, dz);
        const a = Math.atan2(-dz, dx) - Math.acos(clamp((ARM.len ** 2 + d * d - ARM_PARKED ** 2) / (2 * ARM.len * d), -1, 1));
        const at = 0.62 * ARM.len;
        const restH = REC.y + 0.22 - 0.03 - DECK_Y;
        const rest = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.02, 0.025, restH, 10)), chrome);
        rest.position.set(ARM.x + Math.cos(a) * at, DECK_Y + restH / 2, ARM.z - Math.sin(a) * at);
        const cradle = box(0.08, 0.03, 0.08, std({ color: 0x1a1210, roughness: 0.6 }));
        cradle.position.set(rest.position.x, DECK_Y + restH, rest.position.z);
        scene.add(rest, cradle);
      }

      // Side B: the groove under the needle glows (a thin ring, sized to the needle's radius each frame)
      const glowMat = keep(new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      const glow = new THREE.Mesh(keep(new THREE.RingGeometry(0.982, 1, 160)), glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(REC.x, REC.y + 0.004, REC.z);
      scene.add(glow);

      // ── The speaker (left, on the console) and the gig poster above it ──
      const grille = std({ map: texture(512, 640, drawGrille), roughness: 0.9 });
      const speaker = box(1.6, 2.0, 1.3, [walnut, walnut, walnut, walnut, grille, walnut]);
      speaker.position.set(-3.1, TOP_Y + 1.0, CONSOLE.z - 0.1);
      scene.add(speaker);
      const posterFrame = box(2.5, 3.5, 0.08, std({ color: 0x2a170d, roughness: 0.5 }));
      posterFrame.position.set(-2.9, 6.6, WALL_Z + 0.05);
      scene.add(posterFrame);
      const poster = new THREE.Mesh(keep(new THREE.PlaneGeometry(2.3, 3.3)), std({ map: texture(512, 736, drawPoster), roughness: 0.9 }));
      poster.position.set(-2.9, 6.6, WALL_Z + 0.1);
      scene.add(poster);
      // the opening has my name in big type already, and the speaker's dark front sat behind it like a black card
      poster.visible = posterFrame.visible = speaker.visible = !heroOnly;

      // ── The record crate on the floor, one sleeve per section ──
      const crateWood = std({ color: 0x8a5634, roughness: 0.7 });
      const crate = new THREE.Group();
      crate.position.set(CRATE.x, 0, CRATE.z);
      crate.rotation.y = 0.35;
      const cw = 1.55;
      const ch = 0.95;
      const cd = 1.2;
      const t = 0.07;
      const panels: [number, number, number, number, number, number][] = [
        [cw, 0.08, cd, 0, 0.04, 0],
        [t, ch, cd, -cw / 2, ch / 2, 0],
        [t, ch, cd, cw / 2, ch / 2, 0],
        [cw, ch * 0.7, t, 0, ch * 0.35, cd / 2],
        [cw, ch, t, 0, ch / 2, -cd / 2],
      ];
      panels.forEach(([w, h, d, x, y, z]) => {
        const p = box(w, h, d, crateWood);
        p.position.set(x, y, z);
        crate.add(p);
      });
      const sleeveEdge = std({ color: 0xe6d6b4, roughness: 0.9 });
      const sleeves = SLEEVES.map((s, i) => {
        const art = std({ map: texture(512, 512, (g) => drawSleeve(g, s)), roughness: 0.85 });
        const m = box(1.3, 1.3, 0.035, [sleeveEdge, sleeveEdge, sleeveEdge, sleeveEdge, art, sleeveEdge]);
        m.position.set(0, 0.72, cd / 2 - 0.2 - i * 0.17);
        m.rotation.x = -0.12;
        crate.add(m);
        return m;
      });
      crate.visible = !heroOnly; // the opening has its own crate of sleeves, in 2D
      scene.add(crate);

      // ── The opening's right wall: a record shelf over the receiver and a framed gold record above it
      // (the right side was bare once the 2D crate went) ──
      if (heroOnly) {
        const SH = { x: 4.45, y: 4.5, z: WALL_Z + 0.24, w: 1.4 };
        const plank = box(SH.w, 0.08, 0.42, walnut);
        plank.position.set(SH.x, SH.y, SH.z);
        scene.add(plank);
        const brass = std({ color: 0xb08a3e, metalness: 0.7, roughness: 0.35 });
        for (const dx of [-0.5, 0.5]) {
          const bracket = box(0.05, 0.22, 0.3, brass);
          bracket.position.set(SH.x + dx, SH.y - 0.15, SH.z - 0.04);
          scene.add(bracket);
        }
        // record spines, a little uneven, in the theme's colours
        const spineCols = [0xd4a03a, 0x9a4a2a, 0x2b1d15, 0xefe1c5, 0x67703a, 0xc97a3e, 0x2f5d7c, 0xd4a03a, 0x3a2314, 0xb85c2e, 0xead6ad];
        let x = SH.x - SH.w / 2 + 0.06;
        spineCols.forEach((c, i) => {
          const t = 0.045 + (i % 3) * 0.012;
          const hgt = 0.6 - (i % 4) * 0.02;
          const spine = box(t, hgt, 0.36, std({ color: c, roughness: 0.6 }));
          spine.position.set(x + t / 2, SH.y + 0.04 + hgt / 2, SH.z);
          spine.rotation.z = i === spineCols.length - 1 ? -0.12 : 0;
          scene.add(spine);
          x += t + 0.006;
        });
        // one sleeve face-out, leaning at the end: a 70s sunburst cover
        const coverArt = std({
          map: texture(256, 256, (g) => {
            g.fillStyle = "#e8a91c";
            g.fillRect(0, 0, 256, 256);
            for (let k = 0; k < 18; k++) {
              g.fillStyle = k % 2 ? "#d4a03a" : "#f0c24e";
              g.beginPath();
              g.moveTo(128, 190);
              g.arc(128, 190, 300, (k / 18) * Math.PI * 2, ((k + 1) / 18) * Math.PI * 2);
              g.fill();
            }
            g.fillStyle = "#9a4a2a";
            g.beginPath();
            g.arc(128, 190, 62, Math.PI, 0);
            g.fill();
            g.fillStyle = "#3a2314";
            g.fillRect(0, 190, 256, 66);
            g.fillStyle = "#efe1c5";
            g.font = 'bold 34px "Shrikhand", Georgia, serif';
            g.textAlign = "center";
            g.fillText("Side A", 128, 238);
          }),
          roughness: 0.8,
        });
        const sleeveEdge = std({ color: 0x3a2314 });
        const sleeve = box(0.62, 0.62, 0.02, [sleeveEdge, sleeveEdge, sleeveEdge, sleeveEdge, coverArt, sleeveEdge]);
        sleeve.position.set(SH.x + SH.w / 2 - 0.36, SH.y + 0.35, SH.z + 0.12);
        sleeve.rotation.x = -0.1;
        scene.add(sleeve);

        // the gold record, framed
        const frame = box(0.95, 0.95, 0.06, std({ color: 0x2a170d, roughness: 0.5 }));
        frame.position.set(SH.x - 0.45, SH.y + 1.15, WALL_Z + 0.05);
        scene.add(frame);
        const mat = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.83, 0.83)), std({ color: 0xefe1c5, roughness: 0.9 }));
        mat.position.set(SH.x - 0.45, SH.y + 1.15, WALL_Z + 0.085);
        scene.add(mat);
        const gold = new THREE.Mesh(keep(new THREE.CircleGeometry(0.3, 48)), std({ color: 0xd9a93a, metalness: 0.85, roughness: 0.3 }));
        gold.position.set(SH.x - 0.45, SH.y + 1.17, WALL_Z + 0.09);
        scene.add(gold);
        const hub = new THREE.Mesh(keep(new THREE.CircleGeometry(0.09, 32)), std({ color: 0x9a4a2a, roughness: 0.6 }));
        hub.position.set(SH.x - 0.45, SH.y + 1.17, WALL_Z + 0.095);
        scene.add(hub);
      }

      // ── The opening's left wall: a round clock at the top, by the prints, on Phnom Penh time (the city in the
      // window), its second hand ticking ──
      let clock: { h: InstanceType<typeof THREE.Group>; m: InstanceType<typeof THREE.Group>; s: InstanceType<typeof THREE.Group> } | null = null;
      let clockSec = -1;
      if (heroOnly) {
        const C = { x: -1.7, y: 5.85, z: WALL_Z + 0.05, r: 0.34 };
        const rim = new THREE.Mesh(keep(new THREE.CylinderGeometry(C.r + 0.05, C.r + 0.05, 0.09, 48)), std({ color: 0x3a2314, roughness: 0.45, metalness: 0.2 }));
        rim.rotation.x = Math.PI / 2;
        rim.position.set(C.x, C.y, C.z);
        scene.add(rim);
        const dial = new THREE.Mesh(
          keep(new THREE.CircleGeometry(C.r, 48)),
          std({
            map: texture(256, 256, (g) => {
              g.fillStyle = "#efe1c5";
              g.fillRect(0, 0, 256, 256);
              g.translate(128, 128);
              for (let i = 0; i < 60; i++) {
                const big = i % 5 === 0;
                g.fillStyle = big ? "#3a2314" : "rgba(58,35,20,0.45)";
                g.save();
                g.rotate((i / 60) * Math.PI * 2);
                g.fillRect(big ? -3 : -1, -122, big ? 6 : 2, big ? 16 : 8);
                g.restore();
              }
              g.fillStyle = "#9a4a2a";
              g.font = 'bold 30px "Fraunces", Georgia, serif';
              g.textAlign = "center";
              g.textBaseline = "middle";
              ([["12", 0, -84], ["3", 86, 0], ["6", 0, 86], ["9", -86, 0]] as const).forEach(([n, x, y]) => g.fillText(n, x, y));
              g.fillStyle = "rgba(58,35,20,0.6)";
              g.font = '600 13px "Barlow Condensed", sans-serif';
              g.fillText("PHNOM PENH", 0, 42);
            }),
            emissive: 0x3a2818,
            emissiveIntensity: 0.6,
            roughness: 0.8,
          }),
        );
        dial.position.set(C.x, C.y, C.z + 0.046);
        scene.add(dial);
        const hand = (len: number, w: number, color: number, z: number) => {
          const g = new THREE.Group();
          g.position.set(C.x, C.y, C.z + z);
          const m = new THREE.Mesh(keep(new THREE.BoxGeometry(w, len, 0.008)), std({ color, roughness: 0.5 }));
          m.position.y = len / 2 - 0.05; // a short tail past the centre
          g.add(m);
          scene.add(g);
          return g;
        };
        clock = { h: hand(0.19, 0.03, 0x2b1d15, 0.055), m: hand(0.27, 0.02, 0x2b1d15, 0.062), s: hand(0.3, 0.008, 0xc0392b, 0.069) };
        const cap = new THREE.Mesh(keep(new THREE.CircleGeometry(0.025, 16)), std({ color: 0xc0392b }));
        cap.position.set(C.x, C.y, C.z + 0.075);
        scene.add(cap);
      }

      // ── The floor lamp (right): its shade glows, its bulb lights the room ──
      const lampMetal = std({ color: 0x3a2a1f, metalness: 0.6, roughness: 0.4 });
      const lampBase = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.45, 0.5, 0.08, 32)), lampMetal);
      lampBase.position.set(5.4, 0.04, -3.7);
      const stem = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.04, 0.04, 5.1, 12)), lampMetal);
      stem.position.set(5.4, 2.6, -3.7);
      const shadeMat = std({ color: 0xe9cf9a, emissive: 0xffa860, emissiveIntensity: 0.9, side: THREE.DoubleSide, roughness: 0.9 });
      const shade = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.5, 0.95, 1.05, 32, 1, true)), shadeMat);
      shade.position.set(5.4, 5.55, -3.7);
      scene.add(lampBase, stem, shade);

      // ── Size, and the shift that leaves room for the text on wide screens ──
      let shiftNow = OPEN.shift;
      let liftNow = 0;
      const size = () => {
        const w = heroOnly ? host.clientWidth || window.innerWidth : window.innerWidth;
        const h = heroOnly ? host.clientHeight || window.innerHeight : window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // narrow screens see a bit more of the room
        camera.fov = w / h < 0.8 ? 50 : 35;
        camera.updateProjectionMatrix();
        dirty = true;
      };
      const applyShift = (s: number, l: number) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const x = w >= 1024 ? s : 0;
        if (x > 0.001 || Math.abs(l) > 0.001) camera.setViewOffset(w, h, -x * w, l * h, w, h);
        else camera.clearViewOffset();
      };
      let dirty = true;
      size();
      window.addEventListener("resize", size);

      // ── The loop: draws only while something moves ──
      const shots = SHOTS.map((x) => ({ ...x }));
      if (heroOnly) shots[0] = HERO;
      const proj = new THREE.Vector3();
      const camPos = new THREE.Vector3(...(heroOnly ? HERO_START : OPEN).pos);
      const camLook = new THREE.Vector3(...OPEN.look);
      const toPos = new THREE.Vector3();
      const toLook = new THREE.Vector3();
      const tmp = new THREE.Vector3();
      let spin = 0; // record speed, rad/s
      let armAngle = NaN;
      let litNow = -1;
      const pulls = SLEEVES.map(() => 0);
      let last = performance.now();
      let raf = 0;
      let first = true;

      // the arm angle that puts the needle at distance r from the record's centre (r > 1.2 × TT: parked)
      const dx = REC.x - ARM.x;
      const dz = REC.z - ARM.z;
      const d = Math.hypot(dx, dz);
      const toCentre = Math.atan2(-dz, dx);
      const angleFor = (r: number) => toCentre - Math.acos(clamp((ARM.len ** 2 + d * d - r * r) / (2 * ARM.len * d), -1, 1));

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (document.hidden) return;
        // the hero-only room rests once it has scrolled out of view
        if (heroOnly && host.getBoundingClientRect().bottom < 0) return;
        const dt = Math.min(0.25, (now - last) / 1000); // generous, so a slow frame catches up instead of lagging
        last = now;
        const ease = still || first ? 1 : 1 - Math.exp(-dt * (heroOnly ? 10 : 3.2)); // hero: the opening already eases
        // the clock: moves once a second (Phnom Penh is UTC+7, no daylight saving)
        if (clock) {
          const sec = Math.floor(Date.now() / 1000);
          if (sec !== clockSec) {
            clockSec = sec;
            const day = (sec + 7 * 3600) % 86400;
            const TAU = Math.PI * 2;
            clock.s.rotation.z = -((day % 60) / 60) * TAU;
            clock.m.rotation.z = -((day % 3600) / 3600) * TAU;
            clock.h.rotation.z = -((day % 43200) / 43200) * TAU;
            dirty = true;
          }
        }

        // camera: towards the shot for where the page is
        // the Journey shot follows the needle: low over the record
        const sideR = (roomBus.sideB >= 0 ? 0.95 - 0.5 * roomBus.sideB : 0.95) * TT;
        const tipA = angleFor(sideR);
        const tipX = ARM.x + Math.cos(tipA) * ARM.len;
        const tipZ = ARM.z - Math.sin(tipA) * ARM.len;
        // just behind and above the tip, so the record fills the screen; the arm leaves towards the top right
        shots[2] = { pos: [tipX + 0.55, REC.y + 1.3, tipZ + 1.75], look: [tipX - 0.15, REC.y, tipZ - 0.15], shift: 0 };

        const p = heroOnly ? 0.65 : pagePosition();
        // hero mode, the needle drop: the arm swings over and lowers, the lamp comes on, the camera pulls back
        // into the room (and all of it backwards on the way up)
        const t = heroOnly ? clamp(roomBus.heroP) : 1;
        const lower = smooth(span(t, DROP.lower));
        const armR = ARM_PARKED - (ARM_PARKED - ARM_ON) * smooth(span(t, DROP.swing));
        const [a, b, k]: [Shot, Shot, number] = heroOnly ? [HERO_START, HERO, smooth(span(t, DROP.pull))] : shotAt(p, shots);
        toPos.set(...a.pos).lerp(tmp.set(...b.pos), k);
        toLook.set(...a.look).lerp(tmp.set(...b.look), k);
        // at rest the opening's camera breathes a little, so the room doesn't look like a still
        if (heroOnly && t < 0.02 && !still) {
          toPos.x += Math.sin(now / 3100) * 0.05;
          const bob = Math.sin(now / 2300) * 0.025;
          toPos.y += bob;
          toLook.y += bob; // (rises and falls level, never tilts)
        }
        const toShift = a.shift + (b.shift - a.shift) * k;
        const toLift = (a.lift ?? 0) + ((b.lift ?? 0) - (a.lift ?? 0)) * k;
        const moving =
          camPos.distanceToSquared(toPos) > 1e-6 ||
          camLook.distanceToSquared(toLook) > 1e-6 ||
          Math.abs(shiftNow - toShift) > 1e-4 ||
          Math.abs(liftNow - toLift) > 1e-4;
        camPos.lerp(toPos, ease);
        camLook.lerp(toLook, ease);
        shiftNow += (toShift - shiftNow) * ease;
        liftNow += (toLift - liftNow) * ease;
        camera.position.copy(camPos);
        camera.lookAt(camLook);
        applyShift(shiftNow, liftNow);
        if (heroOnly && (moving || first)) {
          // tell the opening where the record is, so its label lands on it
          camera.updateMatrixWorld();
          const w = host.clientWidth;
          const h = host.clientHeight;
          proj.set(REC.x, REC.y, REC.z).project(camera);
          const x = ((proj.x + 1) / 2) * w;
          const y = ((1 - proj.y) / 2) * h;
          proj.set(REC.x + REC.r, REC.y, REC.z).project(camera);
          setRecordScreen({ x, y, d: Math.abs(((proj.x + 1) / 2) * w - x) * 2 });
        }

        // the record: spins up and down like a real platter; plays while the music is on, or on Side B
        const section = Math.floor(p);
        // (the opening's record turns once the needle is down)
        const playing = isBgmOn() || roomBus.sideB >= 0 || (heroOnly && t >= NEEDLE_DOWN);
        const want = playing && !still ? 3.49 : 0;
        spin += (want - spin) * (1 - Math.exp(-dt * (want ? 1.6 : 2.4)));
        if (spin > 0.002) {
          record.rotation.y -= spin * dt;
          platter.rotation.y = record.rotation.y;
        }

        // the label: the picked project while Work is on screen, otherwise my name
        let relabel = false;
        if (section === 4 && roomBus.track) relabel = setLabel(roomBus.track.title, "★ " + roomBus.track.side + " ★", "NOW PLAYING");
        else relabel = setLabel(profile.name, "★ PORTFOLIO ★", "NOW PLAYING · SIDE A");

        // the tonearm: on Side B it follows the page from the outer groove inwards; with the music on it
        // rests on the lead-in; otherwise it's parked
        // (in the opening it swings over with the needle drop)
        const r = heroOnly ? armR : roomBus.sideB >= 0 ? sideR : isBgmOn() ? ARM_ON : ARM_PARKED;
        const glowWant = roomBus.sideB >= 0 ? 0.75 : 0;
        const glowMoving = Math.abs(glowMat.opacity - glowWant) > 0.005 || (glowWant > 0 && Math.abs(glow.scale.x - r) > 1e-4);
        glowMat.opacity += (glowWant - glowMat.opacity) * (still ? 1 : 1 - Math.exp(-dt * 4));
        glow.scale.setScalar(r);
        const wantAngle = angleFor(r);
        const armMoving = Number.isNaN(armAngle) || Math.abs(wantAngle - armAngle) > 1e-4;
        armAngle = Number.isNaN(armAngle) ? wantAngle : armAngle + (wantAngle - armAngle) * (still ? 1 : 1 - Math.exp(-dt * 5));
        arm.rotation.y = armAngle;
        // the needle lifts a little while it's parked
        arm.position.y = REC.y + (heroOnly ? 0.22 - 0.06 * lower : r > 1.2 * TT ? 0.22 : 0.16);

        // the lights: dark but for the spot on the turntable until the needle's down, then the lamp comes on
        const lit = heroOnly ? smooth(span(t, DROP.lights)) : 1;
        const lightsMoving = Math.abs(lit - litNow) > 1e-4;
        if (lightsMoving || first) {
          litNow = lit;
          // the opening is lit by the one lamp (and the spot on the turntable): little even "sky" light,
          // so the room falls off into shadow away from it
          hemi.intensity = 0.1 + (heroOnly ? 0.22 : 0.7) * lit;
          fill.intensity = 0.04 + (heroOnly ? 0.08 : 0.31) * lit;
          bulb.intensity = (heroOnly ? 34 : 28) * lit;
          shadeMat.emissiveIntensity = 0.9 * lit;
        }

        // About: its sleeve rises out of the crate
        let pulling = false;
        sleeves.forEach((s, i) => {
          const want = section === i + 1 ? 1 : 0;
          const next = pulls[i] + (want - pulls[i]) * (still ? 1 : 1 - Math.exp(-dt * 4));
          if (Math.abs(next - pulls[i]) > 1e-4) pulling = true;
          pulls[i] = next;
          s.position.y = 0.72 + next * 0.75;
          s.rotation.x = -0.12 - next * 0.12;
        });

        if (moving || spin > 0.002 || armMoving || lightsMoving || pulling || relabel || glowMoving || dirty || first) {
          renderer.render(scene, camera);
          dirty = false;
          if (first) {
            first = false;
            setReady(true);
          }
        }
      };
      raf = requestAnimationFrame(frame);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", size);
        if (heroOnly) setRecordScreen(null);
        disposables.forEach((x) => x.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [heroOnly]);

  return (
    <div ref={hostRef} className={`retro-room${heroOnly ? " is-hero" : ""}`} data-ready={ready || undefined} aria-hidden="true" />
  );
}
