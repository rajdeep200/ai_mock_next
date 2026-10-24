"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// 3x3x3 "Qube" of rounded, colour-coded cubelets with code symbols on every face.
// A random layer turns like a puzzle every couple of seconds; the cube tilts toward the pointer.

const STEP = 1.06;
const AXES = ["x", "y", "z"] as const;

type Tone = { m: THREE.MeshStandardMaterial; ink: string };

const SYMBOLS = ["</>", "{ }", "( )", "[ ]", "=>", "#", "&&", "!=", "O(n)", ";", "++", "::", "</>", "{ }"];

// fixed, balanced mix: mostly colour, only a few cream cubelets
const MIX = [
  "cobalt", "sun", "blush", "violet", "cobalt", "night", "sun", "blush", "deep",
  "cobalt", "sun", "cream", "blush", "violet", "sun", "cobalt", "night", "blush",
  "deep", "sun", "cobalt", "cream", "blush", "sun", "violet", "cobalt", "cream",
];

const FACES: { p: [number, number, number]; r: [number, number, number] }[] = [
  { p: [0, 0, 0.503], r: [0, 0, 0] },
  { p: [0, 0, -0.503], r: [0, Math.PI, 0] },
  { p: [0.503, 0, 0], r: [0, Math.PI / 2, 0] },
  { p: [-0.503, 0, 0], r: [0, -Math.PI / 2, 0] },
  { p: [0, 0.503, 0], r: [-Math.PI / 2, 0, 0] },
  { p: [0, -0.503, 0], r: [Math.PI / 2, 0, 0] },
];

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function initCube(canvas: HTMLCanvasElement, hero: HTMLElement) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(d: T) => {
    disposables.push(d);
    return d;
  };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  cam.position.set(0, 0, 15);

  // soft studio lighting (x PI: lights are physically based in current three.js)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbfb6aa, 0.7 * Math.PI));
  const key = new THREE.DirectionalLight(0xfff0dc, 1.0 * Math.PI);
  key.position.set(4, 7, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fa0ff, 0.45 * Math.PI);
  rim.position.set(-6, 2, -5);
  scene.add(rim);

  // one rounded-cube geometry shared by all cubelets
  const W = 0.84, R = 0.1, B = 0.08;
  const shape = new THREE.Shape();
  const x = -W / 2, y = -W / 2;
  shape.moveTo(x + R, y);
  shape.lineTo(x + W - R, y);
  shape.absarc(x + W - R, y + R, R, -Math.PI / 2, 0, false);
  shape.lineTo(x + W, y + W - R);
  shape.absarc(x + W - R, y + W - R, R, 0, Math.PI / 2, false);
  shape.lineTo(x + R, y + W);
  shape.absarc(x + R, y + W - R, R, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + R);
  shape.absarc(x + R, y + R, R, Math.PI, Math.PI * 1.5, false);
  const geo = track(
    new THREE.ExtrudeGeometry(shape, {
      depth: W, bevelEnabled: true, bevelSegments: 6, bevelSize: B, bevelThickness: B, curveSegments: 10,
    })
  );
  geo.center();

  const mat = (hex: number) =>
    track(new THREE.MeshStandardMaterial({ color: hex, roughness: 0.48, metalness: 0.05 }));
  const tones: Record<string, Tone> = {
    cobalt: { m: mat(0x2b3af0), ink: "#FFFFFF" },
    deep: { m: mat(0x1b26b8), ink: "#FFFFFF" },
    violet: { m: mat(0x7a5cff), ink: "#FFFFFF" },
    sun: { m: mat(0xffb43a), ink: "#16150F" },
    blush: { m: mat(0xff8f6b), ink: "#16150F" },
    night: { m: mat(0x1e1d27), ink: "#FFB43A" },
    cream: { m: mat(0xf1ece3), ink: "#2B3AF0" },
  };

  // code / language symbols engraved on the faces
  const decalCache: Record<string, THREE.MeshStandardMaterial> = {};
  const decal = (sym: string, ink: string) => {
    const k = sym + ink;
    if (decalCache[k]) return decalCache[k];
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = 150;
    const font = () => `700 ${size}px ui-monospace, Consolas, Menlo, monospace`;
    ctx.font = font();
    while (ctx.measureText(sym).width > 190 && size > 40) {
      size -= 6;
      ctx.font = font();
    }
    ctx.fillText(sym, 128, 134);
    const tex = track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const m = track(
      new THREE.MeshStandardMaterial({
        map: tex, transparent: true, opacity: 0.9, roughness: 0.5, metalness: 0.05, depthWrite: false,
      })
    );
    decalCache[k] = m;
    return m;
  };
  const decalGeo = track(new THREE.PlaneGeometry(0.62, 0.62));

  const qube = new THREE.Group();
  scene.add(qube);
  const cubelets: THREE.Mesh[] = [];
  let n = 0;
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (let k = -1; k <= 1; k++) {
        const tone = tones[MIX[n]];
        const m = new THREE.Mesh(geo, tone.m);
        m.position.set(i * STEP, j * STEP, k * STEP);
        FACES.forEach((f, fi) => {
          const sym = SYMBOLS[(n * 5 + fi * 3) % SYMBOLS.length];
          const d = new THREE.Mesh(decalGeo, decal(sym, tone.ink));
          d.position.set(...f.p);
          d.rotation.set(...f.r);
          m.add(d);
        });
        n++;
        qube.add(m);
        cubelets.push(m);
      }

  // contact shadow: soft radial gradient on a floor plane
  const sc = document.createElement("canvas");
  sc.width = sc.height = 128;
  const sctx = sc.getContext("2d")!;
  const g = sctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, "rgba(22,21,15,.30)");
  g.addColorStop(1, "rgba(22,21,15,0)");
  sctx.fillStyle = g;
  sctx.fillRect(0, 0, 128, 128);
  const shadowGeo = track(new THREE.PlaneGeometry(6, 6));
  const shadowMat = track(
    new THREE.MeshBasicMaterial({ map: track(new THREE.CanvasTexture(sc)), transparent: true, depthWrite: false })
  );
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -3.1;
  scene.add(shadow);

  const base = { x: 0.52, y: -0.72 };
  qube.rotation.set(base.x, base.y, 0);

  // layer turns
  type Move = { pivot: THREE.Group; axis: "x" | "y" | "z"; dir: number; t0: number; dur: number };
  let move: Move | null = null;
  let nextAt = 1.4;
  let lastAxis = -1;

  function startMove(t: number) {
    let a: number;
    do {
      a = Math.floor(Math.random() * 3);
    } while (a === lastAxis);
    lastAxis = a;
    const layer = Math.floor(Math.random() * 3) - 1;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const pivot = new THREE.Group();
    qube.add(pivot);
    cubelets.forEach((c) => {
      if (Math.abs(c.position[AXES[a]] - layer * STEP) < 0.01) pivot.attach(c);
    });
    move = { pivot, axis: AXES[a], dir, t0: t, dur: 1.15 };
  }

  function endMove(t: number) {
    if (!move) return;
    const { pivot } = move;
    pivot.rotation[move.axis] = (move.dir * Math.PI) / 2;
    pivot.updateMatrixWorld(true);
    [...pivot.children].forEach((c) => {
      qube.attach(c);
      c.position.set(
        Math.round(c.position.x / STEP) * STEP,
        Math.round(c.position.y / STEP) * STEP,
        Math.round(c.position.z / STEP) * STEP
      );
      const q = Math.PI / 2;
      c.rotation.set(Math.round(c.rotation.x / q) * q, Math.round(c.rotation.y / q) * q, Math.round(c.rotation.z / q) * q);
    });
    qube.remove(pivot);
    move = null;
    nextAt = t + 0.9;
  }

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  const onLeave = () => {
    mouse.tx = 0;
    mouse.ty = 0;
  };
  hero.addEventListener("pointermove", onMove);
  hero.addEventListener("pointerleave", onLeave);

  let spin = 0;
  let last = performance.now() / 1000;
  function draw(t: number) {
    const dt = Math.min(t - last, 0.05);
    last = t;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    spin += dt * 0.12;
    qube.rotation.y = base.y + spin + mouse.x * 0.25;
    qube.rotation.x = base.x + mouse.y * 0.18;
    const bob = Math.sin(t * 0.9) * 0.18;
    qube.position.y = bob;
    shadow.scale.setScalar(1 - bob * 0.35);
    shadowMat.opacity = 0.9 + bob;

    if (!reduce) {
      if (!move && t >= nextAt) startMove(t);
      if (move) {
        const p = Math.min((t - move.t0) / move.dur, 1);
        move.pivot.rotation[move.axis] = move.dir * (Math.PI / 2) * ease(p);
        if (p >= 1) endMove(t);
      }
    }
    renderer.render(scene, cam);
  }

  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    draw(performance.now() / 1000);
  }

  let running = false;
  let raf = 0;
  function loop(now: number) {
    if (!running) return;
    draw(now / 1000);
    raf = requestAnimationFrame(loop);
  }
  function setRunning(on: boolean) {
    if (reduce || on === running) return;
    running = on;
    if (on) {
      last = performance.now() / 1000;
      raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(raf);
    }
  }

  let heroVisible = true;
  const ro = new ResizeObserver(layout);
  ro.observe(canvas);
  const io = new IntersectionObserver((es) => {
    heroVisible = es[0].isIntersecting;
    setRunning(heroVisible && !document.hidden);
  });
  io.observe(hero);
  const onVis = () => setRunning(heroVisible && !document.hidden);
  document.addEventListener("visibilitychange", onVis);
  layout();

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    hero.removeEventListener("pointermove", onMove);
    hero.removeEventListener("pointerleave", onLeave);
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  };
}

export default function HeroCube() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const hero = canvas?.closest<HTMLElement>(".hero");
    if (!canvas || !hero) return;
    let cleanup: (() => void) | undefined;
    try {
      cleanup = initCube(canvas, hero);
    } catch {
      // WebGL unavailable: the page works without the cube
    }
    return () => cleanup?.();
  }, []);

  return <canvas id="cube3d" ref={ref} aria-hidden="true" />;
}
