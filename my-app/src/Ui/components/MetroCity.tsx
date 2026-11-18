import { Eye, Train } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSky, useWeather } from "../hooks/interactive";
import { NAV_SECTIONS } from "../data/sections";

// Metro theme: a small 3D Phnom Penh. Low-poly blocks, the river, a few landmarks, and the line on a
// viaduct looping through it with a station for every section. The train runs the loop and slows into
// each station; the camera rides along behind it (or pulls back for the whole map). Drag to look
// around; click a station's sign to ride there. Day, night and rain follow the site's live sky.
// three.js is loaded only when this mounts, so the other themes never download it.

const STATIONS = [
  { id: "home", label: "Rotana Central", t: 0 },
  ...NAV_SECTIONS.map((s, i) => ({ id: s.id, label: s.label, t: (i + 1) / (NAV_SECTIONS.length + 1) })),
];

// The loop, at viaduct height
const ROUTE: [number, number][] = [
  [-46, -22],
  [-24, -40],
  [6, -42],
  [30, -28],
  [36, -2],
  [26, 26],
  [0, 38],
  [-28, 34],
  [-48, 12],
];
const DECK_Y = 6;

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function MetroCity() {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [follow, setFollow] = useState(false);
  const [ready, setReady] = useState(false);
  const [next, setNext] = useState(STATIONS[1].label);
  const followRef = useRef(follow);
  const sky = useSky();
  const weather = useWeather();
  const night = sky === "night";
  const wet = weather?.kind === "rain" || weather?.kind === "storm";
  const envRef = useRef({ night, wet });
  useEffect(() => {
    followRef.current = follow;
    envRef.current = { night, wet };
  }, [follow, night, wet]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

      // ── Renderer, scene, camera ──
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.className = "metro-city-canvas";
      host.prepend(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xcfe6f3, 170, 360);
      const camera = new THREE.PerspectiveCamera(34, 1, 1, 600);

      const hemi = new THREE.HemisphereLight(0xffffff, 0xd8cfbf, 1.1);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
      sun.position.set(-60, 110, 50);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -95, right: 95, top: 95, bottom: -95, near: 10, far: 300 });
      sun.shadow.bias = -0.0005;
      scene.add(sun);

      const disposables: { dispose: () => void }[] = [];
      const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);
      const lambert = (color: number | string, extra: Record<string, unknown> = {}) =>
        track(new THREE.MeshLambertMaterial({ color, ...extra }));

      // ── Ground and river ──
      const groundMat = lambert(0xe7e1d6);
      const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(420, 420)), groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const riverMat = lambert(0x86b9d9);
      const river = new THREE.Mesh(track(new THREE.PlaneGeometry(34, 420)), riverMat);
      river.rotation.x = -Math.PI / 2;
      river.position.set(66, 0.05, 0);
      scene.add(river);
      const bankMat = lambert(0xcfc6b6);
      const bank = new THREE.Mesh(track(new THREE.BoxGeometry(3, 1, 420)), bankMat);
      bank.position.set(48.5, 0.5, 0);
      scene.add(bank);

      // ── The route ──
      const curve = new THREE.CatmullRomCurve3(
        ROUTE.map(([x, z]) => new THREE.Vector3(x, DECK_Y, z)),
        true,
        "centripetal",
      );
      const SEGMENTS = 260;
      const deckGeo = track(new THREE.BoxGeometry(1, 0.7, 3.4));
      const deck = new THREE.InstancedMesh(deckGeo, lambert(0xbdb7ad), SEGMENTS);
      const stripeMat = lambert(0xf06a1f);
      const stripe = new THREE.InstancedMesh(track(new THREE.BoxGeometry(1, 0.12, 0.7)), stripeMat, SEGMENTS);
      deck.castShadow = deck.receiveShadow = true;
      const dummy = new THREE.Object3D();
      const segLen = curve.getLength() / SEGMENTS;
      for (let i = 0; i < SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const p = curve.getPointAt(t);
        const ahead = curve.getPointAt((t + 0.001) % 1);
        dummy.position.copy(p);
        dummy.lookAt(ahead);
        dummy.rotateY(Math.PI / 2);
        dummy.scale.set(segLen * 1.08, 1, 1);
        dummy.updateMatrix();
        deck.setMatrixAt(i, dummy.matrix);
        dummy.position.y += 0.4;
        dummy.updateMatrix();
        stripe.setMatrixAt(i, dummy.matrix);
      }
      scene.add(deck, stripe);

      // pillars under the viaduct
      const PILLARS = 44;
      const pillars = new THREE.InstancedMesh(track(new THREE.CylinderGeometry(0.55, 0.7, DECK_Y, 8)), lambert(0xa9a399), PILLARS);
      pillars.castShadow = true;
      for (let i = 0; i < PILLARS; i++) {
        const p = curve.getPointAt(i / PILLARS);
        dummy.position.set(p.x, DECK_Y / 2 - 0.3, p.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        pillars.setMatrixAt(i, dummy.matrix);
      }
      scene.add(pillars);

      // stations: a platform, a canopy and an orange roundel post
      const stationPoints = STATIONS.map((s) => curve.getPointAt(s.t));
      const platMat = lambert(0xf3f1ec);
      const canopyMat = lambert(0x1b1b1b);
      const roundelMat = lambert(0xf06a1f);
      STATIONS.forEach((s, i) => {
        const p = stationPoints[i];
        const ahead = curve.getPointAt((s.t + 0.002) % 1);
        const g = new THREE.Group();
        g.position.copy(p);
        g.lookAt(ahead);
        g.rotateY(Math.PI / 2);
        const platform = new THREE.Mesh(track(new THREE.BoxGeometry(11, 0.9, 2.4)), platMat);
        platform.position.set(0, 0.1, 3);
        platform.castShadow = platform.receiveShadow = true;
        const canopy = new THREE.Mesh(track(new THREE.BoxGeometry(11.6, 0.35, 4.2)), canopyMat);
        canopy.position.set(0, 3.6, 2.4);
        canopy.castShadow = true;
        const post = new THREE.Mesh(track(new THREE.CylinderGeometry(0.15, 0.15, 3.4, 6)), canopyMat);
        post.position.set(-5, 1.9, 3.9);
        const post2 = post.clone();
        post2.position.x = 5;
        const roundel = new THREE.Mesh(track(new THREE.CylinderGeometry(0.9, 0.9, 0.25, 20)), roundelMat);
        roundel.rotation.x = Math.PI / 2;
        roundel.position.set(0, 4.8, 3.9);
        g.add(platform, canopy, post, post2, roundel);
        scene.add(g);
      });

      // ── The city: instanced blocks, kept clear of the line, the stations and the river ──
      const r = rng(11);
      const distToLine = (x: number, z: number) => {
        let best = Infinity;
        for (let i = 0; i < 120; i++) {
          const p = curve.getPointAt(i / 120);
          best = Math.min(best, Math.hypot(p.x - x, p.z - z));
        }
        return best;
      };
      const blocks: { x: number; z: number; w: number; d: number; h: number; c: string }[] = [];
      const palette = ["#f4f1ea", "#e6e0d5", "#d6cfc2", "#ece7de", "#cfc7b9", "#dcd6cb"];
      for (let x = -96; x <= 42; x += 7.5) {
        for (let z = -96; z <= 96; z += 7.5) {
          if (r() < 0.16) continue; // a few empty lots
          const jx = x + (r() - 0.5) * 2;
          const jz = z + (r() - 0.5) * 2;
          if (distToLine(jx, jz) < 8.5) continue;
          if (Math.hypot(jx, jz + 2) < 9) continue; // the monument's square
          const fromCentre = Math.hypot(jx + 5, jz);
          const tall = Math.max(0, 1 - fromCentre / 90);
          const h = 1.6 + r() * 4.6 + tall * tall * r() * 18;
          const accent = r();
          const c = accent < 0.03 ? "#f08a4b" : accent < 0.05 ? "#7f9ccf" : accent < 0.07 ? "#c97f95" : palette[Math.floor(r() * palette.length)];
          blocks.push({ x: jx, z: jz, w: 3.4 + r() * 2.6, d: 3.4 + r() * 2.6, h, c });
        }
      }
      const blockMesh = new THREE.InstancedMesh(track(new THREE.BoxGeometry(1, 1, 1)), lambert(0xffffff), blocks.length);
      blockMesh.castShadow = blockMesh.receiveShadow = true;
      const color = new THREE.Color();
      blocks.forEach((b, i) => {
        dummy.position.set(b.x, b.h / 2, b.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(b.w, b.h, b.d);
        dummy.updateMatrix();
        blockMesh.setMatrixAt(i, dummy.matrix);
        blockMesh.setColorAt(i, color.set(b.c));
      });
      scene.add(blockMesh);

      // lit windows, shown at night: little glowing panes on the block faces
      const winPos: [number, number, number, number][] = [];
      blocks.forEach((b) => {
        if (b.h < 3.5) return;
        for (let y = 2; y < b.h - 1; y += 2.2) {
          for (const side of [1, -1]) {
            if (r() < 0.6) winPos.push([b.x + (side * b.w) / 2 + side * 0.02, y, b.z + (r() - 0.5) * (b.d - 1.4), Math.PI / 2]);
            if (r() < 0.6) winPos.push([b.x + (r() - 0.5) * (b.w - 1.4), y, b.z + (side * b.d) / 2 + side * 0.02, 0]);
          }
        }
      });
      const winMat = track(new THREE.MeshBasicMaterial({ color: 0xffcf6b, side: THREE.DoubleSide }));
      const windows = new THREE.InstancedMesh(track(new THREE.PlaneGeometry(0.8, 1)), winMat, winPos.length);
      winPos.forEach(([x, y, z, ry], i) => {
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, ry, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        windows.setMatrixAt(i, dummy.matrix);
      });
      scene.add(windows);

      // trees along the river and in the square
      const treeSpots: [number, number][] = [];
      for (let z = -100; z <= 100; z += 6) treeSpots.push([44 + r() * 2, z + r() * 2]);
      for (let a = 0; a < 12; a++) treeSpots.push([Math.cos(a / 1.9) * 7, -2 + Math.sin(a / 1.9) * 7]);
      const trees = new THREE.InstancedMesh(track(new THREE.IcosahedronGeometry(1.6, 0)), lambert(0x5f8f5a, { flatShading: true }), treeSpots.length);
      trees.castShadow = true;
      treeSpots.forEach(([x, z], i) => {
        const s = 0.8 + r() * 0.6;
        dummy.position.set(x, 1.9 * s, z);
        dummy.rotation.set(r(), r(), 0);
        dummy.scale.set(s, s * 1.2, s);
        dummy.updateMatrix();
        trees.setMatrixAt(i, dummy.matrix);
      });
      scene.add(trees);

      // ── Landmarks (stylised, original shapes) ──
      const gold = lambert(0xd9b24c, { flatShading: true });
      const monument = new THREE.Group();
      [
        [9, 1.2],
        [7, 1.4],
        [5.2, 1.6],
        [3.6, 1.8],
        [2.2, 2],
      ].reduce((y, [w, h]) => {
        const tier = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, w)), gold);
        tier.position.y = y + h / 2;
        tier.castShadow = true;
        monument.add(tier);
        return y + h;
      }, 0);
      const spire = new THREE.Mesh(track(new THREE.ConeGeometry(0.9, 6, 4)), gold);
      spire.position.y = 8 + 3;
      spire.rotation.y = Math.PI / 4;
      spire.castShadow = true;
      monument.add(spire);
      monument.position.set(0, 0, -2);
      scene.add(monument);

      const glass = lambert(0x9fb3c4);
      const tower = new THREE.Group();
      const shaft = new THREE.Mesh(track(new THREE.BoxGeometry(6, 44, 6)), glass);
      shaft.position.y = 22;
      shaft.castShadow = true;
      const crown = new THREE.Mesh(track(new THREE.BoxGeometry(6.2, 7, 6.2)), glass);
      crown.position.set(0, 46, 0);
      crown.rotation.z = 0.5;
      crown.castShadow = true;
      tower.add(shaft, crown);
      tower.position.set(-14, 0, 12);
      scene.add(tower);

      const roof = lambert(0xb4532a, { flatShading: true });
      const pavilion = new THREE.Group();
      const hall = new THREE.Mesh(track(new THREE.BoxGeometry(10, 4, 7)), lambert(0xf4efe6));
      hall.position.y = 2;
      hall.castShadow = true;
      const top = new THREE.Mesh(track(new THREE.ConeGeometry(8, 5, 4)), roof);
      top.position.y = 6.5;
      top.rotation.y = Math.PI / 4;
      top.scale.set(1, 1, 0.75);
      top.castShadow = true;
      pavilion.add(hall, top);
      pavilion.position.set(40, 0, -48);
      scene.add(pavilion);

      // ── The train: three cars ──
      const bodyMat = lambert(0xf7f5f0);
      const bandMat = lambert(0xf06a1f);
      const glassMat = lambert(0x22262c);
      const cars = Array.from({ length: 3 }, () => {
        const car = new THREE.Group();
        const body = new THREE.Mesh(track(new THREE.BoxGeometry(5.4, 2, 2.5)), bodyMat);
        body.position.y = 1.5;
        body.castShadow = true;
        const band = new THREE.Mesh(track(new THREE.BoxGeometry(5.42, 0.35, 2.54)), bandMat);
        band.position.y = 0.95;
        const win = new THREE.Mesh(track(new THREE.BoxGeometry(5, 0.6, 2.56)), glassMat);
        win.position.y = 1.85;
        car.add(body, band, win);
        scene.add(car);
        return car;
      });

      // ── Rain ──
      const DROPS = 1400;
      const rainGeo = track(new THREE.BufferGeometry());
      const rainPos = new Float32Array(DROPS * 6);
      for (let i = 0; i < DROPS; i++) {
        const x = (r() - 0.5) * 220;
        const y = r() * 70;
        const z = (r() - 0.5) * 220;
        rainPos.set([x, y, z, x - 0.25, y - 1.6, z], i * 6);
      }
      rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
      const rainMat = track(new THREE.LineBasicMaterial({ color: 0xc7d6e2, transparent: true, opacity: 0.55 }));
      const rain = new THREE.LineSegments(rainGeo, rainMat);
      scene.add(rain);

      // ── Day / night / rain ──
      let lastEnv = "";
      const applyEnv = () => {
        const { night, wet } = envRef.current;
        const key = `${night}-${wet}`;
        if (key === lastEnv) return;
        lastEnv = key;
        const skyColor = night ? (wet ? 0x0d1219 : 0x0b1430) : wet ? 0xaab4bd : 0xcfe6f3;
        scene.background = new THREE.Color(skyColor);
        scene.fog!.color.set(skyColor);
        hemi.intensity = night ? 0.55 : wet ? 0.95 : 1.1;
        hemi.color.set(night ? 0x8fa3d6 : 0xffffff);
        sun.intensity = night ? 0.6 : wet ? 0.9 : 2.2;
        sun.color.set(night ? 0x9db4ff : 0xfff1d6);
        groundMat.color.set(night ? 0x262d3d : 0xe7e1d6);
        stripeMat.emissive.set(night ? 0xf06a1f : 0x000000);
        glassMat.emissive.set(night ? 0xffcf6b : 0x000000);
        roundelMat.emissive.set(night ? 0xf06a1f : 0x000000);
        riverMat.color.set(night ? 0x13243b : wet ? 0x7d98ab : 0x86b9d9);
        windows.visible = night;
        rain.visible = wet;
      };

      // ── Camera control: drag to look around, follow the train or see the whole map ──
      let azimuth = -0.75;
      let dragging = false;
      let lastX = 0;
      let idle = 0;
      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        renderer.domElement.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        azimuth -= (e.clientX - lastX) * 0.006;
        lastX = e.clientX;
        idle = 0;
      };
      const onUp = () => {
        dragging = false;
      };
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("pointercancel", onUp);

      const size = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(size);
      ro.observe(host);
      size();

      // ── The loop ──
      let tTrain = 0.02;
      let dwell = 0;
      let lastStation = -1;
      let visible = true;
      let raf = 0;
      let last = performance.now();
      const camPos = new THREE.Vector3(80, 70, 80);
      const camLook = new THREE.Vector3();
      const tmp = new THREE.Vector3();
      const nextIndex = () => STATIONS.findIndex((s) => s.t > tTrain + 0.001);
      let shownNext = "";

      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        applyEnv();

        // the train slows into each station, waits, then pulls away
        if (!still) {
          if (dwell > 0) dwell -= dt;
          else {
            let nearest = 1;
            STATIONS.forEach((s, i) => {
              let d = (s.t - tTrain + 1) % 1;
              if (d > 0.5) d -= 1;
              if (Math.abs(d) < Math.abs(nearest)) nearest = d;
              if (Math.abs(d) < 0.0015 && lastStation !== i) {
                lastStation = i;
                dwell = 1.4;
              }
            });
            const ease = Math.min(1, Math.max(0.12, Math.abs(nearest) / 0.035));
            tTrain = (tTrain + dt * 0.022 * ease) % 1;
          }
        }
        const ni = nextIndex();
        const nextLabel = STATIONS[ni === -1 ? 0 : ni].label;
        if (nextLabel !== shownNext) {
          shownNext = nextLabel;
          setNext(nextLabel);
        }
        cars.forEach((car, i) => {
          const t = (tTrain - i * 0.0128 + 1) % 1;
          const p = curve.getPointAt(t);
          const a = curve.getPointAt((t + 0.002) % 1);
          car.position.set(p.x, p.y + 0.35, p.z);
          car.lookAt(a.x, p.y + 0.35, a.z);
          car.rotateY(Math.PI / 2);
        });

        // rain
        if (rain.visible && !still) {
          const pos = rainGeo.attributes.position as InstanceType<typeof THREE.BufferAttribute>;
          for (let i = 0; i < DROPS; i++) {
            let y = pos.getY(i * 2) - dt * 60;
            if (y < 0) y += 70;
            pos.setY(i * 2, y);
            pos.setY(i * 2 + 1, y - 1.6);
          }
          pos.needsUpdate = true;
        }

        // camera: behind the train, or the whole map; pulls back as the hero scrolls away
        idle += dt;
        if (!dragging && idle > 4 && !still) azimuth += dt * 0.05;
        const box = host.getBoundingClientRect();
        const away = Math.min(1, Math.max(0, -box.top / Math.max(1, box.height)));
        const following = followRef.current;
        const target = following ? cars[0].position : tmp.set(-4, 0, -2);
        const radius = (following ? 58 : 128) * (1 + away * 0.6);
        const height = (following ? 40 : 92) * (1 + away * 0.5);
        const want = tmp.set(target.x + Math.cos(azimuth) * radius, target.y + height, target.z + Math.sin(azimuth) * radius);
        camPos.lerp(want, 1 - Math.pow(0.002, dt));
        camLook.lerp(following ? cars[0].position : new THREE.Vector3(-4, 0, -2), 1 - Math.pow(0.001, dt));
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        renderer.render(scene, camera);

        // station signs follow their stations on screen
        const w = host.clientWidth;
        const h = host.clientHeight;
        stationPoints.forEach((p, i) => {
          const el = labelRefs.current[i];
          if (!el) return;
          const v = tmp.set(p.x, p.y + 7, p.z).project(camera);
          const hidden = v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1;
          el.style.opacity = hidden ? "0" : "1";
          el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -100%)`;
        });

        raf = visible && !still ? requestAnimationFrame(frame) : 0;
      };

      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      });
      io.observe(host);
      raf = requestAnimationFrame(frame);
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerup", onUp);
        renderer.domElement.removeEventListener("pointercancel", onUp);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className="metro-city" data-ready={ready ? "true" : undefined}>
      <div ref={hostRef} className="metro-city-stage" role="img" aria-label="A 3D model of Phnom Penh with the Rotana Line running through it">
        {STATIONS.map((s, i) => (
          <a
            key={s.id}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            href={`#${s.id}`}
            data-jump
            className="metro-city-sign"
          >
            <span className="metro-badge" aria-hidden="true">
              {i === 0 ? "R" : i}
            </span>
            {s.label}
          </a>
        ))}
      </div>
      <div className="metro-city-hud">
        <span className="metro-city-tag">
          <span className="metro-live-dot" aria-hidden="true" />
          Line 1 · next stop <b>{next}</b>
        </span>
        <span className="metro-city-hint">Drag to look around · click a station to ride there</span>
        <button type="button" className="metro-city-toggle" onClick={() => setFollow((f) => !f)} aria-pressed={!follow}>
          {follow ? <Eye size={15} aria-hidden="true" /> : <Train size={15} aria-hidden="true" />}
          {follow ? "Whole map" : "Ride along"}
        </button>
      </div>
      {!ready && <span className="metro-city-loading">Building the city…</span>}
    </div>
  );
}
