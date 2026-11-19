import { Eye, Train } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSky, useWeather } from "../hooks/interactive";
import { departure, RIDE_STOPS, rideProgress } from "../metroRide";

// Metro theme: a small 3D Phnom Penh behind the whole page. Low-poly blocks, the river, a few landmarks,
// and the line on a viaduct looping through it with a station for every section. Scrolling drives the
// train: it waits at a section's station while you read, and pulls into the next one as you reach the
// next section. The first screen shows the whole map (drag to look around, click a station to ride
// there); further down, the camera rides behind the train. Day, night and rain follow the live sky.
// three.js is loaded only when this mounts, so the other themes never download it.

const STATIONS = RIDE_STOPS.map((s, i) => ({ ...s, t: i / (RIDE_STOPS.length + 1) }));

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
  const [wholeMap, setWholeMap] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [onHero, setOnHero] = useState(true);
  const [stop, setStop] = useState({ at: true, label: STATIONS[0].label });
  const wholeMapRef = useRef(wholeMap);
  const sky = useSky();
  const weather = useWeather();
  const night = sky === "night";
  const wet = weather?.kind === "rain" || weather?.kind === "storm";
  const envRef = useRef({ night, wet });
  useEffect(() => {
    wholeMapRef.current = wholeMap;
    envRef.current = { night, wet };
  }, [wholeMap, night, wet]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      // phones and slow machines: no shadows, fewer pixels
      const lite = Math.min(window.innerWidth, window.innerHeight) < 640 || (navigator.hardwareConcurrency ?? 8) <= 4;

      // ── Renderer, scene, camera ──
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: !lite, alpha: false, powerPreference: "high-performance" });
      } catch {
        setFailed(true); // no WebGL: the plain sky-coloured backdrop stays
        return;
      }
      // sharp on the first screen; behind the sections the city sits under a wash, so it renders at a
      // fraction of the pixels (and looks softly out of focus, which suits it)
      const sharp = Math.min(window.devicePixelRatio, lite ? 1 : 1.25);
      const soft = lite ? 0.6 : 0.85;
      renderer.setPixelRatio(sharp);
      renderer.shadowMap.enabled = !lite;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.shadowMap.autoUpdate = false; // the city never moves and the train casts none: drawn once
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
      sun.shadow.mapSize.set(1024, 1024);
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

      // a marker floating over the lead car, so the train is easy to find on the whole map
      const marker = new THREE.Mesh(track(new THREE.ConeGeometry(1.6, 3.2, 4)), lambert(0xf06a1f, { emissive: 0x7a2a00 }));
      marker.rotation.x = Math.PI;
      scene.add(marker);

      // ── Camera: drag to look around the whole map (first screen only) ──
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

      // ── Scroll → where the train should be, and how far the camera has come down from the map ──
      let targetT = 0;
      let mapView = 1; // 1 = whole map (first screen), 0 = riding behind the train
      let shownStop = "";
      let shownHero = true;
      const readScroll = () => {
        const { i, f } = rideProgress();
        const last = STATIONS.length - 1;
        const go = i < last ? departure(f) : 0;
        targetT = i < last ? STATIONS[i].t + (STATIONS[i + 1].t - STATIONS[i].t) * go : STATIONS[last].t;
        mapView = 1 - Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)));
        const at = go < 0.02 || i === last;
        const label = at ? STATIONS[i].label : STATIONS[i + 1].label;
        if (`${at}${label}` !== shownStop) {
          shownStop = `${at}${label}`;
          setStop({ at, label });
        }
        const hero = mapView > 0.4;
        if (hero !== shownHero) {
          shownHero = hero;
          setOnHero(hero);
          renderer.setPixelRatio(hero ? sharp : soft);
          size();
        }
      };
      let scrollDirty = true;
      const onScroll = () => {
        scrollDirty = true;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      readScroll();

      // ── The loop ──
      let trainT = targetT;
      let raf = 0;
      let last = performance.now();
      let frames = 0;
      let firstFrame = true;
      const center = new THREE.Vector3(-4, 0, -2);
      const camPos = new THREE.Vector3(80, 70, 80);
      const camLook = center.clone();
      const want = new THREE.Vector3();
      const wantLook = new THREE.Vector3();
      const mapPos = new THREE.Vector3();
      const head = new THREE.Vector3();
      const side = new THREE.Vector3();
      const tmp = new THREE.Vector3();

      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (document.hidden) return;
        if (scrollDirty || ++frames % 30 === 0) {
          scrollDirty = false;
          readScroll(); // also every half second, in case the page's layout moved
        }
        applyEnv();
        const wholeMap = wholeMapRef.current;
        const m = wholeMap ? 1 : mapView;
        const snap = still || firstFrame;
        firstFrame = false;

        // the train drives to where the scroll says it should be
        const trainMoved = Math.abs(targetT - trainT) > 1e-5;
        trainT = snap ? targetT : trainT + (targetT - trainT) * (1 - Math.pow(0.03, dt));
        cars.forEach((car, i) => {
          const t = (trainT - i * 0.0128 + 1) % 1;
          const p = curve.getPointAt(t);
          const a = curve.getPointAt((t + 0.002) % 1);
          car.position.set(p.x, p.y + 0.35, p.z);
          car.lookAt(a.x, p.y + 0.35, a.z);
          car.rotateY(Math.PI / 2);
        });
        const lead = cars[0].position;
        marker.visible = m > 0.05;
        marker.position.set(lead.x, lead.y + 7 + Math.sin(now / 400) * (still ? 0 : 0.6), lead.z);
        marker.scale.setScalar(0.4 + m * 1.2);

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

        // camera: the whole map on the first screen, then down behind the train, on the outside of the
        // loop, looking along the line and across the city
        idle += dt;
        if (!dragging && idle > 4 && !still && m > 0.05) azimuth += dt * 0.04;
        const zoom = camera.aspect < 1 ? 1.7 : camera.aspect < 1.4 ? 1.25 : 1;
        mapPos.set(center.x + Math.cos(azimuth) * 128 * zoom, 92 * zoom, center.z + Math.sin(azimuth) * 128 * zoom);
        curve.getTangentAt(trainT, head).setY(0).normalize();
        side.set(-head.z, 0, head.x);
        if (side.dot(tmp.copy(lead).sub(center)) < 0) side.negate();
        const back = 34 * zoom;
        want
          .copy(lead)
          .addScaledVector(head, -back)
          .addScaledVector(side, 22 * zoom)
          .add(tmp.set(0, 24 * zoom, 0))
          .lerp(mapPos, m);
        wantLook.copy(lead).addScaledVector(head, 12).addScaledVector(side, -5).lerp(center, m);
        const settle = snap ? 1 : 1 - Math.pow(0.004, dt);
        const camMoved = camPos.distanceToSquared(want) > 1e-4;
        camPos.lerp(want, settle);
        camLook.lerp(wantLook, snap ? 1 : 1 - Math.pow(0.002, dt));
        camera.position.copy(camPos);
        camera.lookAt(camLook);

        // nothing on screen changed: skip the draw (a still page costs almost nothing)
        const animating = trainMoved || camMoved || rain.visible || m > 0.05 || renderer.shadowMap.needsUpdate;
        if (!animating && !snap && frames % 60 !== 0) return;
        renderer.render(scene, camera);

        // station signs follow their stations on screen; shown on the whole map only
        const w = host.clientWidth;
        const h = host.clientHeight;
        stationPoints.forEach((p, i) => {
          const el = labelRefs.current[i];
          if (!el) return;
          const v = tmp.set(p.x, p.y + 7, p.z).project(camera);
          const off = m < 0.5 || v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1;
          el.style.opacity = off ? "0" : String(Math.min(1, (m - 0.5) * 3));
          el.style.visibility = off ? "hidden" : "visible";
          el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -100%)`;
        });
      };

      renderer.shadowMap.needsUpdate = true;
      raf = requestAnimationFrame(frame);
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
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
    <>
      <div className="metro-city" data-ready={ready ? "true" : undefined} data-failed={failed ? "true" : undefined}>
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
              tabIndex={onHero ? undefined : -1}
            >
              <span className="metro-badge" aria-hidden="true">
                {i === 0 ? "R" : i}
              </span>
              {s.label}
            </a>
          ))}
        </div>
      </div>
      <div className="metro-city-hud">
        <span className="metro-city-tag">
          <span className="metro-live-dot" aria-hidden="true" />
          Line 1 · {stop.at ? "now at" : "next stop"} <b>{stop.label}</b>
        </span>
        {onHero && !failed && <span className="metro-city-hint">Drag the city to look around · scroll to ride</span>}
        {!failed && (!onHero || wholeMap) && (
          <button type="button" className="metro-city-toggle" onClick={() => setWholeMap((v) => !v)} aria-pressed={wholeMap}>
            {wholeMap ? <Train size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            {wholeMap ? "Ride along" : "Whole map"}
          </button>
        )}
      </div>
    </>
  );
}
