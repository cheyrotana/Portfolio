// The Retro room's textures, each drawn on a canvas (no image files): the record label, the wall planks,
// the receiver's faceplate, curtains, leaves, wall art, Phnom Penh at night through the window, walnut,
// the speaker grille, the gig poster, the crate's sleeves and the rug. RetroRoom.tsx turns them into
// three.js textures.
import { profile } from "../../data/profile";

/** A record sleeve in the crate (one per section). */
export interface Sleeve {
  code: string;
  title: string;
  colors: string[];
}


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
export function drawRecord(g: CanvasRenderingContext2D, top: string, bottom: string, middle: string) {
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

export function drawPlanks(g: CanvasRenderingContext2D) {
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

// The view through the window: Phnom Penh at night from across the river. The Royal Palace in gold, the
// Independence Monument, Canadia Tower, The Peak and Vattanac Capital, palms and lamps along Sisowath Quay.
// The receiver's face: brushed metal, an amber tuning dial, two VU meters and knobs. `glow` draws only the
// parts that light up (for the emissive map).
export function drawReceiver(g: CanvasRenderingContext2D, glow = false) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  if (!glow) {
    const metal = g.createLinearGradient(0, 0, 0, H);
    metal.addColorStop(0, "#968d7d"); // aged, satin metal: lamp-lit, not a mirror
    metal.addColorStop(1, "#62594c");
    g.fillStyle = metal;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,0.04)";
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
export function drawCurtain(g: CanvasRenderingContext2D) {
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
export function drawLeaf(g: CanvasRenderingContext2D) {
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
export function drawArt(g: CanvasRenderingContext2D, kind: "sun" | "bars" | "hill") {
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

export function drawWindowView(g: CanvasRenderingContext2D) {
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
  // the moon, with its glow: high in the sky, clear of the window's cross bar
  const mx = W * 0.74;
  const my = H * 0.2;
  const glow = g.createRadialGradient(mx, my, 0, mx, my, 120);
  glow.addColorStop(0, "rgba(255,236,190,0.45)");
  glow.addColorStop(1, "rgba(255,236,190,0)");
  g.fillStyle = glow;
  g.fillRect(mx - 120, my - 120, 240, 240);
  g.fillStyle = "#f6ead0";
  g.beginPath();
  g.arc(mx, my, 24, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(200,185,150,0.35)";
  [[-7, -5, 5], [6, 4, 4], [-3, 9, 3]].forEach(([dx, dy, r]) => {
    g.beginPath();
    g.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
    g.fill();
  });
  // a warm glow where the city meets the sky
  const rim = g.createLinearGradient(0, horizon - 130, 0, horizon);
  rim.addColorStop(0, "rgba(255,150,90,0)");
  rim.addColorStop(1, "rgba(255,150,90,0.3)");
  g.fillStyle = rim;
  g.fillRect(0, horizon - 130, W, 130);
  // the city in three layers: far ones hazy and pale, near ones dark and sharp, each lit from below
  const city = (base: number, top: string, bottom: string, minH: number, maxH: number, lit: number, winA: number, mastEvery: number) => {
    let x = -10;
    while (x < W) {
      const w = 16 + rnd() * 44;
      const h = minH + rnd() * (maxH - minH);
      const body = g.createLinearGradient(0, base - h, 0, base);
      body.addColorStop(0, top);
      body.addColorStop(1, bottom);
      g.fillStyle = body;
      g.fillRect(x, base - h, w, h + 2);
      g.fillStyle = "rgba(255,190,130,0.16)"; // the lit edge facing the moon
      g.fillRect(x + w - 1.5, base - h, 1.5, h + 2);
      g.fillStyle = "rgba(255,200,140,0.12)"; // roof edge
      g.fillRect(x, base - h, w, 1.2);
      if (mastEvery && rnd() < 1 / mastEvery) {
        g.fillStyle = top;
        g.fillRect(x + w * 0.5 - 0.7, base - h - 14, 1.4, 14);
        g.fillStyle = "rgba(255,70,50,0.95)"; // aircraft light
        g.fillRect(x + w * 0.5 - 1.4, base - h - 16, 2.8, 2.8);
      }
      for (let wy = base - h + 6; wy < base - 6; wy += 9) {
        for (let wx = x + 4; wx < x + w - 5; wx += 8) {
          if (rnd() < lit) {
            g.fillStyle = `rgba(255,${190 + Math.floor(rnd() * 40)},110,${winA * (0.55 + rnd() * 0.4)})`;
            g.fillRect(wx, wy, 3.5, 4.5);
          }
        }
      }
      x += w + rnd() * 6;
    }
  };
  // Phnom Penh from across the river: hazy towers far back, then the landmarks, then the riverfront
  city(horizon - 4, "#3a3558", "#4a3c58", 24, 72, 0.08, 0.5, 0); // far, in haze
  const tower = (x: number, w: number, h: number, top: string, lit: number) => {
    const body = g.createLinearGradient(0, horizon - h, 0, horizon);
    body.addColorStop(0, top);
    body.addColorStop(1, "#2a2038");
    g.fillStyle = body;
    g.fillRect(x, horizon - h, w, h);
    g.fillStyle = "rgba(255,190,130,0.18)";
    g.fillRect(x + w - 1.5, horizon - h, 1.5, h);
    for (let wy = horizon - h + 6; wy < horizon - 6; wy += 7) {
      for (let wx = x + 3; wx < x + w - 4; wx += 6) {
        if (rnd() < lit) {
          g.fillStyle = `rgba(255,${200 + Math.floor(rnd() * 40)},150,${0.5 + rnd() * 0.4})`;
          g.fillRect(wx, wy, 2.5, 3.5);
        }
      }
    }
  };
  // Canadia Tower, with its crown
  tower(268, 26, 90, "#232040", 0.3);
  g.fillStyle = "#232040";
  g.fillRect(275, horizon - 102, 12, 12);
  g.fillRect(280, horizon - 114, 2, 12);
  // The Peak: two towers with stepped tops
  tower(410, 24, 98, "#25223f", 0.28);
  g.fillStyle = "#25223f";
  g.fillRect(414, horizon - 104, 16, 6);
  tower(440, 24, 86, "#25223f", 0.28);
  g.fillStyle = "#25223f";
  g.fillRect(444, horizon - 92, 16, 6);
  // Vattanac Capital: the tallest, its side sweeping in to the top like a dragon's tail
  {
    const x = 352;
    const base = horizon - 24;
    const top = horizon - 140;
    g.fillStyle = "#1e1c36";
    g.fillRect(x - 22, base, 78, 24); // the podium
    const glass = g.createLinearGradient(x, 0, x + 38, 0);
    glass.addColorStop(0, "#3a4a72");
    glass.addColorStop(1, "#1c2240");
    g.fillStyle = glass;
    g.beginPath();
    g.moveTo(x, base);
    g.lineTo(x, top);
    g.quadraticCurveTo(x + 36, top + 30, x + 38, top + 72);
    g.lineTo(x + 38, base);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(200,225,255,0.55)"; // lit fins up the face
    g.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(x + 5 + i * 9, base);
      g.lineTo(x + 5 + i * 9, top + 6 + i * i * 7);
      g.stroke();
    }
    g.fillStyle = "rgba(255,70,50,0.95)";
    g.fillRect(x - 1, top - 3, 3, 3);
  }
  city(horizon, "#1e1b34", "#2c2038", 14, 55, 0.22, 1, 6); // the middle, kept low so the landmarks stand out
  // Independence Monument: a lotus tower lit warm
  {
    const tx = 236;
    g.fillStyle = "#3a2a2c";
    let ty = horizon - 6;
    let tw = 40;
    for (let i = 0; i < 5; i++) {
      const th = 12 - i;
      g.fillRect(tx - tw / 2, ty - th, tw, th);
      g.fillStyle = "rgba(255,170,90,0.45)";
      g.fillRect(tx - tw / 2, ty - th, tw, 1.5);
      g.fillStyle = "#3a2a2c";
      ty -= th;
      tw *= 0.8;
    }
    g.beginPath();
    g.moveTo(tx - tw / 2, ty);
    g.lineTo(tx, ty - 26);
    g.lineTo(tx + tw / 2, ty);
    g.fill();
  }
  // the Royal Palace: the Throne Hall's golden tiered roofs and spire, floodlit
  const palace = (cx: number, s: number) => {
    const base = horizon - 4;
    const halo = g.createRadialGradient(cx, base - 30 * s, 0, cx, base - 30 * s, 100 * s);
    halo.addColorStop(0, "rgba(255,190,90,0.35)");
    halo.addColorStop(1, "rgba(255,190,90,0)");
    g.fillStyle = halo;
    g.fillRect(cx - 100 * s, base - 130 * s, 200 * s, 130 * s);
    g.fillStyle = "#c98a3a"; // the hall
    g.fillRect(cx - 62 * s, base - 16 * s, 124 * s, 16 * s);
    g.fillStyle = "rgba(90,40,10,0.7)";
    for (let i = -5; i <= 5; i++) g.fillRect(cx + i * 10 * s - 2 * s, base - 12 * s, 4 * s, 9 * s);
    // three tiers of flared roofs, each narrower
    let y = base - 16 * s;
    [64, 48, 34].forEach((hw, i) => {
      const rh = (14 - i * 2) * s;
      const roof = g.createLinearGradient(0, y - rh, 0, y);
      roof.addColorStop(0, "#f6cf6a");
      roof.addColorStop(1, "#b9772a");
      g.fillStyle = roof;
      g.beginPath();
      g.moveTo(cx - hw * s - 6 * s, y + 2 * s);
      g.lineTo(cx - hw * s * 0.55, y - rh);
      g.lineTo(cx + hw * s * 0.55, y - rh);
      g.lineTo(cx + hw * s + 6 * s, y + 2 * s);
      g.closePath();
      g.fill();
      g.fillStyle = "#f6cf6a"; // the upturned finials at the eaves
      g.fillRect(cx - hw * s - 7 * s, y - 2 * s, 2 * s, 5 * s);
      g.fillRect(cx + hw * s + 5 * s, y - 2 * s, 2 * s, 5 * s);
      y -= rh;
    });
    // the spire: stacked tiers, then a needle
    g.fillStyle = "#f2c35c";
    let sw = 14 * s;
    for (let i = 0; i < 5; i++) {
      g.fillRect(cx - sw / 2, y - 5 * s, sw, 5 * s);
      y -= 5 * s;
      sw *= 0.78;
    }
    g.beginPath();
    g.moveTo(cx - sw / 2, y);
    g.lineTo(cx, y - 30 * s);
    g.lineTo(cx + sw / 2, y);
    g.fill();
  };
  palace(96, 1);
  // a stupa beside it, like the Silver Pagoda's
  g.fillStyle = "#d9a84e";
  g.beginPath();
  g.moveTo(170, horizon - 4);
  g.quadraticCurveTo(170, horizon - 26, 178, horizon - 30);
  g.lineTo(178, horizon - 52);
  g.lineTo(179, horizon - 30);
  g.quadraticCurveTo(188, horizon - 26, 188, horizon - 4);
  g.closePath();
  g.fill();
  // Sisowath Quay: the riverside promenade, a row of lamps and palms
  g.fillStyle = "#0d0a16";
  g.fillRect(0, horizon - 4, W, 6);
  const palm = (x: number, h: number) => {
    g.strokeStyle = "#0d0a16";
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(x, horizon - 2);
    g.quadraticCurveTo(x + 3, horizon - h / 2, x + 1, horizon - h);
    g.stroke();
    g.fillStyle = "#0d0a16";
    [-2.6, -2, -1.2, -0.5, 0.2].forEach((a) => {
      g.beginPath();
      g.ellipse(x + 1 + Math.cos(a) * 6, horizon - h + Math.sin(a) * 3 + 2, 7, 1.6, a, 0, Math.PI * 2);
      g.fill();
    });
  };
  [22, 58, 150, 205, 262, 330, 398, 470, 548, 612].forEach((x, i) => palm(x, 18 + (i % 3) * 4));
  for (let x = 8; x < W; x += 15) {
    g.fillStyle = "rgba(255,214,150,0.95)";
    g.fillRect(x, horizon - 9, 2, 2);
    g.fillStyle = "rgba(255,200,120,0.25)";
    g.fillRect(x - 2, horizon - 11, 6, 6);
  }
  const haze = g.createLinearGradient(0, horizon - 24, 0, horizon + 4);
  haze.addColorStop(0, "rgba(120,90,130,0)");
  haze.addColorStop(1, "rgba(150,100,110,0.22)");
  g.fillStyle = haze;
  g.fillRect(0, horizon - 24, W, 28);
  // the river, the city's lights trailing in it
  const river = g.createLinearGradient(0, horizon, 0, H);
  river.addColorStop(0, "#1a1c34");
  river.addColorStop(1, "#0b0c1a");
  g.fillStyle = river;
  g.fillRect(0, horizon + 2, W, H - horizon);
  for (let i = 0; i < 60; i++) {
    const x = rnd() * W;
    const y = horizon + 4 + rnd() * (H - horizon - 8);
    g.fillStyle = `rgba(255,200,120,${0.12 + rnd() * 0.3})`;
    g.fillRect(x, y, 6 + rnd() * 16, 1.5);
  }
  // the palace's gold and the tower's lights, shimmering in the water
  for (let y = horizon + 5; y < H; y += 4) {
    const fade = 1 - (y - horizon) / (H - horizon);
    g.fillStyle = `rgba(255,190,90,${0.5 * fade})`;
    g.fillRect(96 - 26 - rnd() * 14, y, 52 + rnd() * 28, 1.5);
    g.fillStyle = `rgba(190,210,255,${0.3 * fade})`;
    g.fillRect(366 - 6 - rnd() * 6, y, 12 + rnd() * 10, 1.2);
  }
  g.fillStyle = "rgba(255,236,190,0.35)";
  for (let y = horizon + 6; y < H; y += 5) g.fillRect(mx - 10 - rnd() * 8, y, 20 + rnd() * 16, 1.5);
  // a lit dinner boat out on the river
  g.fillStyle = "#120d18";
  g.fillRect(196, horizon + 40, 60, 8);
  g.fillRect(204, horizon + 33, 44, 7);
  for (let x = 200; x < 254; x += 6) {
    g.fillStyle = `hsl(${(x * 7) % 360} 90% 70%)`;
    g.fillRect(x, horizon + 31, 2.5, 2.5);
  }
  g.fillStyle = "rgba(255,210,140,0.85)";
  for (let x = 207; x < 246; x += 6) g.fillRect(x, horizon + 35, 3, 3);
}

export function drawWalnut(g: CanvasRenderingContext2D, slats: boolean) {
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

export function drawGrille(g: CanvasRenderingContext2D) {
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

export function drawPoster(g: CanvasRenderingContext2D) {
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

export function drawSleeve(g: CanvasRenderingContext2D, s: Sleeve) {
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

export function drawRug(g: CanvasRenderingContext2D) {
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
