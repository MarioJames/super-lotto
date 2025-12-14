'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import type { CinematicPhase } from './CinematicStage';

const RED_BALL = '#ef4444';
const BLUE_BALL = '#3b82f6';

export interface DoubleBall3DBall {
  id: number;
  name: string;
  color: string;
  ballNo: number;
  revealed: boolean;
}

interface DoubleBall3DMachineProps {
  phase: CinematicPhase;
  balls: DoubleBall3DBall[];
  activeIndex: number;
  className?: string;
}

type BallState = 'chamber' | 'extracting' | 'falling' | 'display';

type MachineBall = {
  mesh: THREE.Mesh;
  label: THREE.Sprite;
  labelKind: 'number' | 'winner';
  velocity: THREE.Vector3;
  radius: number;
  ballNo: number;
  color: string;
  winnerIndex: number | null;
  state: BallState;
  stateT: number;
  displayTarget: THREE.Vector3;
};

type PaddleRuntime = {
  group: THREE.Group;
  blade: THREE.Mesh;
};

type Runtime = {
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  bloomPass: UnrealBloomPass;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  resizeObserver: ResizeObserver;
  rafId: number;
  clock: THREE.Clock;
  machineGroup: THREE.Group;
  domeMesh: THREE.Mesh;
  chamberCenter: THREE.Vector3;
  chamberRadius: number;
  holePosition: THREE.Vector3;
  holeRadius: number;
  holeRing: THREE.Mesh;
  holeGate: THREE.Mesh;
  chute: THREE.Mesh;
  paddles: PaddleRuntime[];
  levers: THREE.Group[];
  balls: MachineBall[];
  winnerBallByIndex: Map<number, MachineBall>;
  lastActiveIndex: number;
};

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeDisplayTarget(index: number, total: number) {
  const perRow = total <= 8 ? 8 : 10;
  const row = Math.floor(index / perRow);
  const col = index % perRow;
  const colsInRow = Math.min(perRow, total - row * perRow);

  const spread = clamp(colsInRow * 0.22, 0.9, 2.2);
  const x = (col / Math.max(1, colsInRow - 1) - 0.5) * spread;
  const y = 0.18 - row * 0.22;
  const z = 1.55 + row * 0.1;
  return new THREE.Vector3(x, y, z);
}

function isBallNearHole(ballPos: THREE.Vector3, holePos: THREE.Vector3, holeRadius: number) {
  const dx = ballPos.x - holePos.x;
  const dz = ballPos.z - holePos.z;
  return dx * dx + dz * dz <= holeRadius * holeRadius;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function createBallLabelTexture(params: { ballNo: number; ballColor: string; name?: string }) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Number badge
  const cx = w / 2;
  const cy = h * 0.42;
  const r = h * 0.22;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = 'rgba(255,255,255,0.98)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 14;
  ctx.strokeStyle = params.ballColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = params.ballColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 168px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText(String(params.ballNo), cx, cy + 6);

  if (params.name) {
    const name = params.name.trim();
    const padX = 34;
    const maxWidth = w - padX * 2;
    let fontSize = 56;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (; fontSize >= 28; fontSize -= 2) {
      ctx.font = `650 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      if (ctx.measureText(name).width <= maxWidth) break;
    }

    const badgeH = fontSize + 30;
    const badgeY = h * 0.78 - badgeH / 2;
    drawRoundedRect(ctx, padX, badgeY, w - padX * 2, badgeH, 22);
    ctx.fillStyle = 'rgba(15,23,42,0.78)';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(name, cx, h * 0.78);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function DoubleBall3DMachine({ phase, balls, activeIndex, className }: DoubleBall3DMachineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const ballsSignature = useMemo(() => balls.map(b => `${b.id}:${b.color}:${b.ballNo}`).join('|'), [balls]);
  const winnerMeta = useMemo(() => {
    if (!ballsSignature) return [];
    return ballsSignature.split('|').filter(Boolean).map(item => {
      const [idStr, color, ballNoStr] = item.split(':');
      return { id: Number(idStr), color, ballNo: Number(ballNoStr) };
    });
  }, [ballsSignature]);

  const runtimeRef = useRef<Runtime | null>(null);

  const propsRef = useRef({ phase, balls, activeIndex });
  useEffect(() => {
    propsRef.current = { phase, balls, activeIndex };
  }, [phase, balls, activeIndex]);

  // Create scene once
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    camera.position.set(0, 1.85, 4.6);
    camera.lookAt(0, 1.05, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;

    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(3.5, 4.2, 2.0);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(new THREE.Color('#22d3ee'), 6.5, 9, 2);
    rimLight.position.set(-1.8, 2.1, -2.0);
    scene.add(rimLight);

    const topGlow = new THREE.PointLight(new THREE.Color('#a78bfa'), 4.8, 8, 2);
    topGlow.position.set(0.4, 3.6, 0.6);
    scene.add(topGlow);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 96),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#070b14'),
        metalness: 0.05,
        roughness: 0.95,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.06;
    scene.add(floor);

    // Machine group
    const machineGroup = new THREE.Group();
    machineGroup.position.set(0, 0.05, 0);
    scene.add(machineGroup);

    // Base platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.9, 0.18, 64, 1, false),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0b1220'),
        metalness: 0.92,
        roughness: 0.28,
      }),
    );
    platform.position.set(0, 0.05, 0);
    machineGroup.add(platform);

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.38, 1.55, 0.52, 64, 1, false),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0f172a'),
        metalness: 0.92,
        roughness: 0.26,
      }),
    );
    pedestal.position.set(0, 0.38, 0);
    machineGroup.add(pedestal);

    // Accent ring
    const accentRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.16, 0.055, 18, 180),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#38bdf8'),
        emissive: new THREE.Color('#38bdf8'),
        emissiveIntensity: 0.65,
        metalness: 0.2,
        roughness: 0.35,
      }),
    );
    accentRing.rotation.x = Math.PI / 2;
    accentRing.position.set(0, 0.66, 0);
    machineGroup.add(accentRing);

    // Chamber
    const chamberCenter = new THREE.Vector3(0, 1.38, 0);
    const chamberRadius = 1.02;

    const domeMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#c7f9ff'),
      metalness: 0,
      roughness: 0.16,
      transmission: 0.92,
      thickness: 0.45,
      ior: 1.45,
      transparent: true,
      opacity: 1,
      clearcoat: 0.75,
      clearcoatRoughness: 0.22,
      attenuationColor: new THREE.Color('#60a5fa'),
      attenuationDistance: 1.2,
    });
    domeMaterial.envMapIntensity = 0.35;
    domeMaterial.specularIntensity = 0.55;
    const domeMesh = new THREE.Mesh(new THREE.SphereGeometry(1.12, 96, 96), domeMaterial);
    domeMesh.position.copy(chamberCenter);
    machineGroup.add(domeMesh);

    // Subtle rim highlight
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.02, 18, 180),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0b1220'),
        emissive: new THREE.Color('#22d3ee'),
        emissiveIntensity: 0.4,
        metalness: 0.7,
        roughness: 0.25,
      }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.copy(chamberCenter).add(new THREE.Vector3(0, -1.02, 0));
    machineGroup.add(rim);

    // Exit hole + gate (bottom front)
    const holeRadius = 0.15;
    const holePosition = new THREE.Vector3(0, chamberCenter.y - chamberRadius + 0.035, 0.42);

    const holeRing = new THREE.Mesh(
      new THREE.RingGeometry(holeRadius * 0.75, holeRadius * 1.08, 72),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#fde047'),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    holeRing.rotation.x = -Math.PI / 2;
    holeRing.position.copy(holePosition);
    machineGroup.add(holeRing);

    const holeGate = new THREE.Mesh(
      new THREE.BoxGeometry(holeRadius * 1.65, 0.045, holeRadius * 1.15),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0b1220'),
        metalness: 0.9,
        roughness: 0.22,
      }),
    );
    holeGate.position.copy(holePosition).add(new THREE.Vector3(0, 0.025, 0.02));
    holeGate.rotation.z = 0;
    machineGroup.add(holeGate);

    const chute = new THREE.Mesh(
      new THREE.CylinderGeometry(holeRadius * 0.55, holeRadius * 0.68, 0.42, 28),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0b1220'),
        metalness: 0.92,
        roughness: 0.28,
      }),
    );
    chute.position.copy(holePosition).add(new THREE.Vector3(0, -0.25, 0.02));
    machineGroup.add(chute);

    // Paddles (two blades shaking inside chamber)
    const paddles: PaddleRuntime[] = [];

    const paddleMetal = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0b1220'),
      metalness: 0.95,
      roughness: 0.22,
    });
    const bladeMatA = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f172a'),
      metalness: 0.8,
      roughness: 0.24,
      emissive: new THREE.Color('#22d3ee'),
      emissiveIntensity: 0.55,
    });
    const bladeMatB = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f172a'),
      metalness: 0.8,
      roughness: 0.24,
      emissive: new THREE.Color('#a78bfa'),
      emissiveIntensity: 0.55,
    });

    const paddleCenter = chamberCenter.clone().add(new THREE.Vector3(0, -0.12, 0));
    const makePaddle = (bladeMat: THREE.Material) => {
      const group = new THREE.Group();
      group.position.copy(paddleCenter);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.62, 18), paddleMetal);
      shaft.position.set(0, 0, 0);
      group.add(shaft);

      const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.98, 16);
      armGeo.rotateZ(Math.PI / 2);
      const arm = new THREE.Mesh(armGeo, paddleMetal);
      arm.position.set(0.49, 0.06, 0);
      group.add(arm);

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.065, 0.36), bladeMat);
      blade.position.set(0.92, 0.06, 0);
      group.add(blade);

      machineGroup.add(group);
      return { group, blade };
    };

    paddles.push(makePaddle(bladeMatA));
    paddles.push(makePaddle(bladeMatB));
    paddles[1].group.position.y += 0.1;
    paddles[1].group.rotation.y = Math.PI / 2;

    // External levers (visual cue)
    const levers: THREE.Group[] = [];
    const makeLever = (side: -1 | 1, glow: THREE.Color) => {
      const group = new THREE.Group();
      group.position.set(side * 1.45, 0.46, 0.25);
      group.rotation.z = side * 0.12;

      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.62, 16),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color('#0b1220'),
          metalness: 0.95,
          roughness: 0.22,
        }),
      );
      rod.position.set(0, 0.25, 0);
      rod.rotation.x = Math.PI / 2.4;
      group.add(rod);

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 26, 26),
        new THREE.MeshStandardMaterial({
          color: glow.clone(),
          emissive: glow.clone(),
          emissiveIntensity: 0.7,
          metalness: 0.25,
          roughness: 0.25,
        }),
      );
      knob.position.set(0, 0.62, 0.15);
      group.add(knob);

      machineGroup.add(group);
      return group;
    };
    levers.push(makeLever(-1, new THREE.Color('#22d3ee')));
    levers.push(makeLever(1, new THREE.Color('#a78bfa')));

    // Postprocessing (bloom)
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.35, 0.65);
    bloomPass.strength = 0.92;
    bloomPass.radius = 0.35;
    bloomPass.threshold = 0.65;
    composer.addPass(bloomPass);

    const clock = new THREE.Clock();

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      bloomPass.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
    resize();

    const runtime: Runtime = {
      renderer,
      composer,
      bloomPass,
      scene,
      camera,
      resizeObserver,
      rafId: 0,
      clock,
      machineGroup,
      domeMesh,
      chamberCenter,
      chamberRadius,
      holePosition,
      holeRadius,
      holeRing,
      holeGate,
      chute,
      paddles,
      levers,
      balls: [],
      winnerBallByIndex: new Map(),
      lastActiveIndex: -1,
    };

    runtimeRef.current = runtime;

    // Temp vectors (avoid GC)
    const vCenterToBall = new THREE.Vector3();
    const vNormal = new THREE.Vector3();
    const vDelta = new THREE.Vector3();
    const vRelVel = new THREE.Vector3();
    const vBladeA = new THREE.Vector3();
    const vBladeB = new THREE.Vector3();
    const vHoleDir = new THREE.Vector3();
    const vCamDir = new THREE.Vector3();
    const vLabelScale = new THREE.Vector3();
    const unitScale = new THREE.Vector3(1, 1, 1);

    const animate = () => {
      const rt = runtimeRef.current;
      if (!rt) return;

      const dtFrame = Math.min(0.033, rt.clock.getDelta());
      const t = rt.clock.elapsedTime;
      const { phase: phaseNow, balls: ballsNow, activeIndex: activeNow } = propsRef.current;

      const stirring = phaseNow === 'drawing' || phaseNow === 'revealing';
      const revealMode = phaseNow === 'revealing';

      // Levers + paddles motion
      const leverAmp = stirring ? 0.42 : 0.12;
      const leverA = Math.sin(t * 5.2) * leverAmp;
      const leverB = Math.sin(t * 4.8 + 1.3) * leverAmp;
      rt.levers[0].rotation.x = leverA;
      rt.levers[1].rotation.x = -leverB;

      const spin = phaseNow === 'drawing' ? 6.8 : phaseNow === 'revealing' ? 8.6 : 0.9;
      rt.paddles[0].group.rotation.y = t * spin;
      rt.paddles[0].group.rotation.z = Math.sin(t * 5.2) * (stirring ? 0.22 : 0.06);
      rt.paddles[1].group.rotation.y = -t * (spin * 0.92) + 1.1;
      rt.paddles[1].group.rotation.x = Math.sin(t * 4.8 + 1.3) * (stirring ? 0.28 : 0.08);

      // Hole gate (open/close)
      const gateTarget = revealMode ? -Math.PI * 0.42 : 0;
      rt.holeGate.rotation.x = rt.holeGate.rotation.x + (gateTarget - rt.holeGate.rotation.x) * 0.2;

      const ringMat = rt.holeRing.material as THREE.MeshBasicMaterial;
      const ringOpacityTarget = revealMode ? 0.9 : stirring ? 0.14 : 0.05;
      ringMat.opacity = ringMat.opacity + (ringOpacityTarget - ringMat.opacity) * 0.08;
      rt.holeRing.scale.setScalar(revealMode ? 1.05 + Math.sin(t * 12) * 0.08 : 1.0);

      // Shimmer dome
      const domeMat = rt.domeMesh.material as THREE.MeshPhysicalMaterial;
      domeMat.roughness = 0.14 + Math.abs(Math.sin(t * 0.45)) * 0.06;
      rt.domeMesh.rotation.y = Math.sin(t * 0.22) * 0.08;

      // Blade positions (world)
      rt.paddles[0].blade.getWorldPosition(vBladeA);
      rt.paddles[1].blade.getWorldPosition(vBladeB);

      // Trigger extraction when the current ball is revealed (robust to batched state updates)
      if (revealMode && activeNow >= 0) {
        const activeMeta = ballsNow[activeNow];
        const targetBall = rt.winnerBallByIndex.get(activeNow);
        if (activeMeta?.revealed && targetBall && targetBall.state === 'chamber') {
          targetBall.state = 'extracting';
          targetBall.stateT = 0;
          const mat = targetBall.mesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.9;

          if (targetBall.labelKind !== 'winner') {
            const labelMat = targetBall.label.material as THREE.SpriteMaterial;
            labelMat.map?.dispose();
            labelMat.map = createBallLabelTexture({
              ballNo: targetBall.ballNo,
              ballColor: targetBall.color,
              name: activeMeta.name,
            });
            labelMat.needsUpdate = true;
            targetBall.labelKind = 'winner';
          }
        }
      }

      const steps = stirring ? 2 : 1;
      const dt = dtFrame / steps;

      for (let step = 0; step < steps; step++) {
        // Integrate forces
        for (const ball of rt.balls) {
          if (ball.state === 'display') {
            ball.mesh.position.lerp(ball.displayTarget, 0.16);
            ball.mesh.scale.lerp(unitScale, 0.14);
            continue;
          }

          if (ball.state === 'falling') {
            ball.velocity.y += -7.8 * dt;
            ball.velocity.multiplyScalar(0.992);
            ball.mesh.position.addScaledVector(ball.velocity, dt);

            if (ball.mesh.position.y <= 0.18) {
              ball.state = 'display';
              ball.stateT = 0;
              ball.velocity.set(0, 0, 0);
            }
            continue;
          }

          // Chamber / extracting physics
          const gravity = stirring ? -6.6 : -7.4;
          const swirl = phaseNow === 'drawing' ? 10.5 : phaseNow === 'revealing' ? 13.0 : 2.0;
          const jitter = stirring ? 0.45 : 0.05;
          const paddlePush = phaseNow === 'revealing' ? 18 : phaseNow === 'drawing' ? 12 : 4;

          // gravity
          ball.velocity.y += gravity * dt;

          // swirl around chamber center (simulate paddles stirring)
          vCenterToBall.copy(ball.mesh.position).sub(rt.chamberCenter);
          ball.velocity.x += (-vCenterToBall.z * swirl) * dt;
          ball.velocity.z += (vCenterToBall.x * swirl) * dt;

          // small deterministic-ish jitter (avoid random in render)
          const j = Math.sin(t * 7.4 + (ball.winnerIndex ?? 7) * 1.9) * jitter;
          ball.velocity.x += j * dt;
          ball.velocity.z += Math.cos(t * 6.9 + (ball.winnerIndex ?? 11) * 1.7) * jitter * dt;

          // paddle impulse near blades
          for (const bladePos of [vBladeA, vBladeB]) {
            vDelta.copy(ball.mesh.position).sub(bladePos);
            const d = vDelta.length();
            const influence = 0.34;
            if (d > 0.0001 && d < influence) {
              vDelta.multiplyScalar(1 / d);
              const strength = (influence - d) * paddlePush;
              ball.velocity.addScaledVector(vDelta, strength * dt);
              // tangential kick
              ball.velocity.x += vDelta.z * strength * 0.35 * dt;
              ball.velocity.z += -vDelta.x * strength * 0.35 * dt;
            }
          }

          // extracting: 让“开口后自然掉落”更像真实双色球
          if (ball.state === 'extracting') {
            // 额外下坠，让它更容易在底部缺口处掉落
            ball.velocity.y += (revealMode ? -2.4 : -1.3) * dt;

            // 只在靠近底部时，轻微引导它靠近缺口（避免明显“吸过去”）
            const nearBottom = ball.mesh.position.y <= rt.holePosition.y + 0.42;
            if (nearBottom) {
              vHoleDir.copy(rt.holePosition).sub(ball.mesh.position);
              vHoleDir.y = 0;
              const dist = vHoleDir.length();
              if (dist > 0.0001) {
                vHoleDir.multiplyScalar(1 / dist);
                const pull = revealMode ? 4.2 : 2.8;
                ball.velocity.addScaledVector(vHoleDir, pull * dt);
              }
            }

            ball.stateT = Math.min(1, ball.stateT + dt / 1.2);
          }

          // damping + clamp speed
          ball.velocity.multiplyScalar(stirring ? 0.988 : 0.992);
          const maxSpeed = revealMode ? 4.8 : 3.9;
          const sp2 = ball.velocity.lengthSq();
          if (sp2 > maxSpeed * maxSpeed) {
            ball.velocity.multiplyScalar(maxSpeed / Math.sqrt(sp2));
          }

          // integrate position
          ball.mesh.position.addScaledVector(ball.velocity, dt);

          // boundary collision (sphere)
          vCenterToBall.copy(ball.mesh.position).sub(rt.chamberCenter);
          const distFromCenter = vCenterToBall.length();
          const limit = rt.chamberRadius - ball.radius;
          if (distFromCenter > limit) {
            const allowThrough = ball.state === 'extracting' && revealMode && isBallNearHole(ball.mesh.position, rt.holePosition, rt.holeRadius * 0.82);
            if (!allowThrough) {
              vNormal.copy(vCenterToBall).multiplyScalar(1 / Math.max(0.0001, distFromCenter));
              ball.mesh.position.copy(rt.chamberCenter).addScaledVector(vNormal, limit);
              const vn = ball.velocity.dot(vNormal);
              if (vn > 0) ball.velocity.addScaledVector(vNormal, -1.9 * vn);
            }
          }

          // drop through hole
          if (ball.state === 'extracting' && revealMode) {
            const inMouth = isBallNearHole(ball.mesh.position, rt.holePosition, rt.holeRadius * 0.7);
            const lowEnough = ball.mesh.position.y <= rt.holePosition.y + 0.02;
            if (inMouth && lowEnough) {
              ball.state = 'falling';
              ball.stateT = 0;
              ball.velocity.set(0, -1.8, 0.6);
              const mat = ball.mesh.material as THREE.MeshStandardMaterial;
              mat.emissiveIntensity = 0.55;
              ball.mesh.scale.setScalar(1.06);
            }
          }
        }

        // Ball-ball collisions (naive, small count)
        const restitution = 0.35;
        const ballsDyn = rt.balls;
        for (let i = 0; i < ballsDyn.length; i++) {
          const a = ballsDyn[i];
          if (a.state === 'display' || a.state === 'falling') continue;
          for (let j = i + 1; j < ballsDyn.length; j++) {
            const b = ballsDyn[j];
            if (b.state === 'display' || b.state === 'falling') continue;

            vDelta.copy(b.mesh.position).sub(a.mesh.position);
            const d = vDelta.length();
            const minD = a.radius + b.radius;
            if (d > 0.0001 && d < minD) {
              const overlap = minD - d;
              vNormal.copy(vDelta).multiplyScalar(1 / d);

              // Separate
              a.mesh.position.addScaledVector(vNormal, -overlap * 0.5);
              b.mesh.position.addScaledVector(vNormal, overlap * 0.5);

              // Impulse
              vRelVel.copy(b.velocity).sub(a.velocity);
              const vn = vRelVel.dot(vNormal);
              if (vn < 0) {
                const invMassA = 1 / Math.max(0.0001, a.radius * a.radius * a.radius);
                const invMassB = 1 / Math.max(0.0001, b.radius * b.radius * b.radius);
                const jImpulse = (-(1 + restitution) * vn) / (invMassA + invMassB);
                a.velocity.addScaledVector(vNormal, -jImpulse * invMassA);
                b.velocity.addScaledVector(vNormal, jImpulse * invMassB);
              }
            }
          }
        }
      }

      for (const ball of rt.balls) {
        const labelMat = ball.label.material as THREE.SpriteMaterial;
        const opacityTarget =
          ball.state === 'chamber' ? 0.28 : ball.state === 'extracting' ? 0.85 : ball.state === 'falling' ? 0.95 : 1;
        labelMat.opacity = labelMat.opacity + (opacityTarget - labelMat.opacity) * 0.12;

        const scaleTarget = ball.state === 'display' ? 0.3 : ball.state === 'chamber' ? 0.18 : 0.24;
        vLabelScale.set(scaleTarget, scaleTarget, 1);
        ball.label.scale.lerp(vLabelScale, 0.18);

        vCamDir.copy(rt.camera.position).sub(ball.mesh.position);
        const len = vCamDir.length();
        if (len > 0.0001) vCamDir.multiplyScalar(1 / len);
        else vCamDir.set(0, 0, 1);
        ball.label.position.copy(ball.mesh.position).addScaledVector(vCamDir, ball.radius * 0.92);
      }

      // Subtle glow when done
      if (phaseNow === 'done') {
        rt.bloomPass.strength = rt.bloomPass.strength + (1.05 - rt.bloomPass.strength) * 0.06;
      } else if (phaseNow === 'revealing') {
        rt.bloomPass.strength = rt.bloomPass.strength + (0.95 - rt.bloomPass.strength) * 0.06;
      } else {
        rt.bloomPass.strength = rt.bloomPass.strength + (0.85 - rt.bloomPass.strength) * 0.06;
      }

      rt.composer.render();
      rt.rafId = requestAnimationFrame(animate);
    };

    runtime.rafId = requestAnimationFrame(animate);

    return () => {
      const rt = runtimeRef.current;
      if (!rt) return;

      cancelAnimationFrame(rt.rafId);
      rt.resizeObserver.disconnect();
      container.removeChild(rt.renderer.domElement);

      rt.scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach(m => m.dispose());
          else mat.dispose();
        }
        if (obj instanceof THREE.Sprite) {
          const mat = obj.material;
          const mats = Array.isArray(mat) ? mat : [mat];
          mats.forEach(m => {
            if (m instanceof THREE.SpriteMaterial) m.map?.dispose();
            m.dispose();
          });
        }
      });

      rt.renderer.dispose();
      pmrem.dispose();
      runtimeRef.current = null;
    };
  }, []);

  // (Re)create balls when a new draw starts
  useEffect(() => {
    const rt = runtimeRef.current;
    if (!rt) return;

    // Cleanup old balls
    for (const b of rt.balls) {
      rt.machineGroup.remove(b.mesh);
      rt.machineGroup.remove(b.label);

      b.mesh.geometry.dispose();
      const mat = b.mesh.material;
      if (Array.isArray(mat)) mat.forEach(m => m.dispose());
      else mat.dispose();

      const labelMat = b.label.material as THREE.SpriteMaterial;
      labelMat.map?.dispose();
      labelMat.dispose();
    }
    rt.balls = [];
    rt.winnerBallByIndex.clear();

    if (winnerMeta.length === 0) return;

    const seed = hashString(`dbl_pool_${ballsSignature}`);
    const rand = mulberry32(seed);

    const winnerKeyToIndex = new Map<string, number>();
    for (let i = 0; i < winnerMeta.length; i++) {
      const w = winnerMeta[i];
      if (!Number.isFinite(w.ballNo)) continue;
      winnerKeyToIndex.set(`${w.color}:${w.ballNo}`, i);
    }

    const pool: Array<{ color: string; ballNo: number; winnerIndex: number | null }> = [];
    for (let n = 1; n <= 33; n++) pool.push({ color: RED_BALL, ballNo: n, winnerIndex: null });
    for (let n = 1; n <= 16; n++) pool.push({ color: BLUE_BALL, ballNo: n, winnerIndex: null });

    for (const ball of pool) {
      const winnerIndex = winnerKeyToIndex.get(`${ball.color}:${ball.ballNo}`);
      if (winnerIndex != null) ball.winnerIndex = winnerIndex;
    }

    const winnerAssigned = Array.from({ length: winnerMeta.length }).fill(false) as boolean[];
    for (const ball of pool) {
      if (ball.winnerIndex != null && ball.winnerIndex >= 0 && ball.winnerIndex < winnerAssigned.length) {
        winnerAssigned[ball.winnerIndex] = true;
      }
    }

    const unassignedByColor = new Map<string, Array<(typeof pool)[number]>>();
    for (const ball of pool) {
      if (ball.winnerIndex == null) {
        const list = unassignedByColor.get(ball.color) ?? [];
        list.push(ball);
        unassignedByColor.set(ball.color, list);
      }
    }

    for (let i = 0; i < winnerMeta.length; i++) {
      if (winnerAssigned[i]) continue;
      const desiredColor = winnerMeta[i].color;
      const candidates = unassignedByColor.get(desiredColor);
      if (!candidates || candidates.length === 0) continue;
      const pickIdx = Math.floor(rand() * candidates.length);
      const picked = candidates.splice(pickIdx, 1)[0];
      picked.winnerIndex = i;
      winnerAssigned[i] = true;
    }

    // Reuse geometry
    const ballRadius = 0.108;
    const ballGeo = new THREE.SphereGeometry(ballRadius, 30, 30);

    const tmp = new THREE.Vector3();
    const placed: THREE.Vector3[] = [];
    const placeInsideChamber = () => {
      // Random point in sphere (biased to upper half so it looks "full")
      const u = rand();
      const v = rand();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = Math.pow(rand(), 0.35) * (rt.chamberRadius - ballRadius - 0.04);
      tmp.set(
        Math.sin(phi) * Math.cos(theta),
        Math.abs(Math.cos(phi)),
        Math.sin(phi) * Math.sin(theta),
      ).multiplyScalar(r);
      tmp.add(rt.chamberCenter);
      tmp.y = Math.max(tmp.y, rt.chamberCenter.y - 0.65);
      return tmp.clone();
    };

    for (let i = 0; i < pool.length; i++) {
      const { color, ballNo, winnerIndex } = pool[i];
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.08,
        roughness: 0.22,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.08,
      });
      const mesh = new THREE.Mesh(ballGeo, mat);
      mesh.castShadow = false;
      mesh.receiveShadow = false;

      // Try to place without overlap
      let pos = placeInsideChamber();
      for (let tries = 0; tries < 24; tries++) {
        let ok = true;
        for (const p of placed) {
          if (p.distanceToSquared(pos) < (ballRadius * 2.05) * (ballRadius * 2.05)) {
            ok = false;
            break;
          }
        }
        if (ok) break;
        pos = placeInsideChamber();
      }
      placed.push(pos);
      mesh.position.copy(pos);

      rt.machineGroup.add(mesh);

      const labelMat = new THREE.SpriteMaterial({
        map: createBallLabelTexture({ ballNo, ballColor: color }),
        transparent: true,
        opacity: 0.28,
        depthTest: true,
        depthWrite: false,
      });
      const label = new THREE.Sprite(labelMat);
      label.scale.setScalar(0.18);
      label.position.copy(mesh.position);
      label.renderOrder = 3;
      rt.machineGroup.add(label);

      const displayTarget = winnerIndex == null ? new THREE.Vector3() : computeDisplayTarget(winnerIndex, winnerMeta.length);

      const b: MachineBall = {
        mesh,
        label,
        labelKind: 'number',
        velocity: new THREE.Vector3((rand() - 0.5) * 0.2, (rand() - 0.5) * 0.2, (rand() - 0.5) * 0.2),
        radius: ballRadius,
        ballNo,
        color,
        winnerIndex,
        state: 'chamber',
        stateT: 0,
        displayTarget,
      };
      rt.balls.push(b);
      if (winnerIndex != null) rt.winnerBallByIndex.set(winnerIndex, b);
    }

    // Make sure winners are the first to be "visible" on tray positions
    for (const [idx, wb] of rt.winnerBallByIndex.entries()) {
      wb.displayTarget.copy(computeDisplayTarget(idx, winnerMeta.length));
    }
  }, [ballsSignature, winnerMeta]);

  return (
    <div
      ref={containerRef}
      className={className ?? 'w-full'}
      style={{
        height: 'min(62vh, 660px)',
      }}
    />
  );
}
