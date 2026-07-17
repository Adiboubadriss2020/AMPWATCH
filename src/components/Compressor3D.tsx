import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import type { MachineStatus } from '../types';
import { IconCompressor } from './Icons';

interface Compressor3DProps {
  status: MachineStatus;
  kw?: number;
  machineId?: string;
  machineName?: string;
  theme?: 'light' | 'dark';
  /** When false, fan/particles stop (production OFF). */
  running?: boolean;
  /** Machine ON while API feed is stopped (Off-Hours YES). */
  offHoursAlert?: boolean;
  /** Accumulated API-stopped time, e.g. "2h 15m". */
  offHoursOnLabel?: string;
}

const STATUS = {
  NOMINAL: {
    accent: 0x0ea5c9,
    emissive: 0x0ea5c9,
    rpm: 1.2,
    label: 'NOMINAL',
  },
  AVERTISSEMENT: {
    accent: 0xd97706,
    emissive: 0xf59e0b,
    rpm: 2.4,
    label: 'WARNING',
  },
  CRITIQUE: {
    accent: 0xdc2626,
    emissive: 0xef4444,
    rpm: 4.2,
    label: 'CRITICAL',
  },
} as const;

export const Compressor3D: React.FC<Compressor3DProps> = ({
  status,
  kw = 0,
  machineId = 'COMP-01',
  machineName = 'Compresseur Air 1',
  theme = 'light',
  running = true,
  offHoursAlert = false,
  offHoursOnLabel = '0m',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef(status);
  const kwRef = useRef(kw);
  const themeRef = useRef(theme);
  const runningRef = useRef(running);
  const wasRunningRef = useRef(running);
  const bootStartRef = useRef(running ? -10 : 0); // elapsed time when last powered on
  const powerRef = useRef(running ? 1 : 0); // 0 idle → 1 full

  const [booting, setBooting] = useState(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    kwRef.current = kw;
  }, [kw]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    // Rising edge → trigger power-on boot sequence
    if (running && !wasRunningRef.current) {
      bootStartRef.current = -1; // signal animate loop to stamp clock
      powerRef.current = 0;
      setBooting(true);
      const id = window.setTimeout(() => setBooting(false), 1900);
      wasRunningRef.current = running;
      runningRef.current = running;
      return () => window.clearTimeout(id);
    }
    if (!running) {
      powerRef.current = 0;
      setBooting(false);
    }
    wasRunningRef.current = running;
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 280;
    const isDark = () =>
      themeRef.current === 'dark' ||
      document.documentElement.getAttribute('data-theme') === 'dark';

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isDark() ? 0x050b14 : 0xf0f4f8, 0.022);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    // Fixed framing — slightly zoomed in, full compressor + capteur visible
    camera.position.set(2.4, 1.65, 4.6);
    camera.lookAt(0, 0.75, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0xb0c4d8, 0.85);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(4, 8, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.radius = 3;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9ec9ff, 0.35);
    fill.position.set(-4, 2, -2);
    scene.add(fill);

    const accentLight = new THREE.PointLight(0x0ea5c9, 1.2, 12);
    accentLight.position.set(0, 1.4, 1.5);
    scene.add(accentLight);

    // Soft ground
    const groundMat = new THREE.MeshStandardMaterial({
      color: isDark() ? 0x050b14 : 0xe8eef5,
      metalness: 0.05,
      roughness: 0.85,
    });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle grid ring
    const gridMat = new THREE.MeshBasicMaterial({
      color: isDark() ? 0x334155 : 0x94a3b8,
      transparent: true,
      opacity: isDark() ? 0.25 : 0.35,
      side: THREE.DoubleSide,
    });
    const grid = new THREE.Mesh(new THREE.RingGeometry(1.9, 1.95, 96), gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = 0.01;
    scene.add(grid);

    const twin = new THREE.Group();
    scene.add(twin);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: isDark() ? 0xe8eef5 : 0xb8c0cc,
      metalness: isDark() ? 0.78 : 0.7,
      roughness: isDark() ? 0.22 : 0.32,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: isDark() ? 0xcbd5e1 : 0x64748b,
      metalness: isDark() ? 0.65 : 0.55,
      roughness: isDark() ? 0.3 : 0.4,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5c9,
      metalness: 0.4,
      roughness: 0.35,
      emissive: 0x0ea5c9,
      emissiveIntensity: 0.25,
    });
    const gaugeFaceMat = new THREE.MeshStandardMaterial({
      color: isDark() ? 0xffffff : 0xf8fafc,
      metalness: 0.3,
      roughness: 0.35,
    });

    const bladeMat = new THREE.MeshStandardMaterial({
      color: isDark() ? 0x94a3b8 : 0x7b8794,
      metalness: 0.6,
      roughness: 0.3,
    });
    const beltMat = new THREE.MeshStandardMaterial({
      color: isDark() ? 0xb0bac8 : 0x6b7280,
      metalness: 0.5,
      roughness: 0.45,
    });

    // Horizontal air tank
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.1, 48), bodyMat);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0, 0.55, 0);
    tank.castShadow = true;
    tank.receiveShadow = true;
    twin.add(tank);

    // Tank end caps
    const capGeom = new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI);
    const capL = new THREE.Mesh(capGeom, bodyMat);
    capL.rotation.y = Math.PI / 2;
    capL.position.set(-1.05, 0.55, 0);
    capL.castShadow = true;
    twin.add(capL);
    const capR = new THREE.Mesh(capGeom, bodyMat);
    capR.rotation.y = -Math.PI / 2;
    capR.position.set(1.05, 0.55, 0);
    capR.castShadow = true;
    twin.add(capR);

    // Motor housing
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.7, 32), darkMat);
    motor.position.set(-0.15, 1.35, 0);
    motor.castShadow = true;
    twin.add(motor);

    // Motor top dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), darkMat);
    dome.position.set(-0.15, 1.75, 0);
    dome.castShadow = true;
    twin.add(dome);

    // Cooling fan (rotates with RPM)
    const fan = new THREE.Group();
    fan.position.set(-0.15, 1.35, 0.42);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), accentMat);
    hub.rotation.x = Math.PI / 2;
    fan.add(hub);
    for (let i = 0; i < 5; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.02), bladeMat);
      blade.position.y = 0.18;
      const pivot = new THREE.Group();
      pivot.rotation.z = (i / 5) * Math.PI * 2;
      pivot.add(blade);
      fan.add(pivot);
    }
    twin.add(fan);

    // Support legs
    const legGeom = new THREE.BoxGeometry(0.12, 0.5, 0.12);
    for (const [x, z] of [
      [-0.7, 0.35],
      [-0.7, -0.35],
      [0.7, 0.35],
      [0.7, -0.35],
    ] as const) {
      const leg = new THREE.Mesh(legGeom, darkMat);
      leg.position.set(x, 0.25, z);
      leg.castShadow = true;
      twin.add(leg);
    }

    // Outlet pipe + pressure gauge (classic air-compressor look)
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 16), darkMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(1.45, 0.85, 0);
    pipe.castShadow = true;
    twin.add(pipe);
    const valve = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 12, 24), accentMat);
    valve.position.set(1.75, 0.85, 0);
    valve.rotation.y = Math.PI / 2;
    twin.add(valve);

    // Analog pressure gauge on tank
    const gaugeBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.08, 32),
      gaugeFaceMat,
    );
    gaugeBody.rotation.x = Math.PI / 2;
    gaugeBody.position.set(0.55, 1.12, 0.42);
    gaugeBody.castShadow = true;
    twin.add(gaugeBody);
    const gaugeRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.025, 10, 28),
      darkMat,
    );
    gaugeRim.position.copy(gaugeBody.position);
    twin.add(gaugeRim);
    const gaugeNeedle = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.14, 0.01),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.2, roughness: 0.4 }),
    );
    gaugeNeedle.position.set(0.55, 1.12, 0.47);
    gaugeNeedle.geometry.translate(0, 0.05, 0);
    twin.add(gaugeNeedle);

    // Belt housing between motor and pump (reads as compressor, not abstract shape)
    const beltGuard = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.18), beltMat);
    beltGuard.position.set(0.35, 1.15, 0.28);
    beltGuard.castShadow = true;
    twin.add(beltGuard);

    // ── IoT Capteur (sensor) mounted on tank, wired in ─────────────────────────
    const sensorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.45,
      roughness: 0.4,
    });
    const sensorAccent = new THREE.MeshStandardMaterial({
      color: 0x0ea5c9,
      metalness: 0.35,
      roughness: 0.3,
      emissive: 0x0ea5c9,
      emissiveIntensity: 0.55,
    });

    const capteur = new THREE.Group();
    capteur.position.set(-0.85, 1.05, 0.55);

    // Main sensor enclosure
    const sensorBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.14), sensorMat);
    sensorBox.castShadow = true;
    capteur.add(sensorBox);

    // Antenna
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8), darkMat);
    antenna.position.set(0.1, 0.22, 0);
    capteur.add(antenna);
    const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), sensorAccent);
    antennaTip.position.set(0.1, 0.36, 0);
    capteur.add(antennaTip);

    // Status LED on capteur
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), sensorAccent);
    led.position.set(-0.08, 0.02, 0.08);
    capteur.add(led);

    // Small screen plate
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x022c22,
        emissive: 0x14b8a6,
        emissiveIntensity: 0.4,
        metalness: 0.2,
        roughness: 0.5,
      }),
    );
    screen.position.set(0.02, 0.01, 0.072);
    capteur.add(screen);

    twin.add(capteur);

    // Cable from tank mount point → capteur (Cat5-style conduit)
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.15 });
    const cablePoints = [
      new THREE.Vector3(-0.55, 0.95, 0.52), // on tank surface
      new THREE.Vector3(-0.7, 0.88, 0.62),
      new THREE.Vector3(-0.82, 0.95, 0.58),
      new THREE.Vector3(-0.85, 1.0, 0.55), // into sensor
    ];
    const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(cableCurve, 24, 0.022, 8, false),
      cableMat,
    );
    cable.castShadow = true;
    twin.add(cable);

    // Live data pulses traveling sensor → machine (visible when production ON)
    const pulseCount = 5;
    const pulses: THREE.Mesh[] = [];
    const pulseMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5c9,
      emissive: 0x0ea5c9,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0,
      metalness: 0.2,
      roughness: 0.3,
    });
    for (let i = 0; i < pulseCount; i++) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), pulseMat.clone());
      bead.visible = false;
      twin.add(bead);
      pulses.push(bead);
    }

    // Antenna signal rings (expand when listening / running)
    const signalRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.008, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0x0ea5c9, transparent: true, opacity: 0 }),
      );
      ring.rotation.x = Math.PI / 2;
      antennaTip.add(ring);
      signalRings.push(ring);
    }

    const applyMachineTheme = (dark: boolean) => {
      if (dark) {
        // Dark UI → bright silver machine (visible, not black-on-black)
        bodyMat.color.setHex(0xe8eef5);
        bodyMat.metalness = 0.78;
        bodyMat.roughness = 0.22;
        darkMat.color.setHex(0xcbd5e1);
        darkMat.metalness = 0.65;
        darkMat.roughness = 0.3;
        bladeMat.color.setHex(0x94a3b8);
        beltMat.color.setHex(0xb0bac8);
        gaugeFaceMat.color.setHex(0xffffff);
        sensorMat.color.setHex(0x1e293b);
        cableMat.color.setHex(0x334155);
        groundMat.color.setHex(0x0b1524);
        gridMat.color.setHex(0x29d3f0);
        gridMat.opacity = 0.5;
        hemi.intensity = 0.7;
        key.intensity = 1.5;
        fill.intensity = 0.7;
        fill.color.setHex(0x29d3f0);
        if (scene.fog instanceof THREE.FogExp2) scene.fog.color.setHex(0x050b14);
      } else {
        // Light UI → grey industrial finish (not black)
        bodyMat.color.setHex(0xb8c0cc);
        bodyMat.metalness = 0.7;
        bodyMat.roughness = 0.32;
        darkMat.color.setHex(0x64748b);
        darkMat.metalness = 0.55;
        darkMat.roughness = 0.4;
        bladeMat.color.setHex(0x7b8794);
        beltMat.color.setHex(0x6b7280);
        gaugeFaceMat.color.setHex(0xf8fafc);
        sensorMat.color.setHex(0x334155);
        cableMat.color.setHex(0x475569);
        groundMat.color.setHex(0xe8eef5);
        gridMat.color.setHex(0x94a3b8);
        gridMat.opacity = 0.35;
        hemi.intensity = 0.9;
        key.intensity = 1.35;
        fill.intensity = 0.4;
        fill.color.setHex(0x9ec9ff);
        if (scene.fog instanceof THREE.FogExp2) scene.fog.color.setHex(0xf0f4f8);
      }
      bodyMat.needsUpdate = true;
      darkMat.needsUpdate = true;
      bladeMat.needsUpdate = true;
      beltMat.needsUpdate = true;
      gaugeFaceMat.needsUpdate = true;
      sensorMat.needsUpdate = true;
      cableMat.needsUpdate = true;
      groundMat.needsUpdate = true;
    };
    applyMachineTheme(isDark());

    // Probe tip stuck on tank (current / clamp style)
    const probe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 0.12, 12),
      accentMat,
    );
    probe.rotation.x = Math.PI / 2;
    probe.position.set(-0.55, 0.95, 0.5);
    probe.castShadow = true;
    twin.add(probe);

    // Status halo ring under twin
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.018, 12, 80),
      new THREE.MeshBasicMaterial({ color: 0x0ea5c9, transparent: true, opacity: 0.55 }),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.04;
    scene.add(halo);

    // Power-on shockwave ring (expands once on Start Production)
    const bootRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.03, 10, 64),
      new THREE.MeshBasicMaterial({ color: 0x0ea5c9, transparent: true, opacity: 0 }),
    );
    bootRing.rotation.x = Math.PI / 2;
    bootRing.position.y = 0.06;
    scene.add(bootRing);

    // Floating energy particles
    const particleCount = 60;
    const pGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 1.4;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.2 + Math.random() * 2.2;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.15 + Math.random() * 0.45;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x0ea5c9,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeom, pMat);
    scene.add(particles);

    const clock = new THREE.Clock();
    let frameId = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let bootCamKick = 0;

    const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
    const easeOutBack = (x: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
    };

    const onPointer = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      // Responsive tilt with cursor — no zoom / orbit
      targetRotY = nx * 0.45;
      targetRotX = ny * 0.22;
    };
    const onPointerLeave = () => {
      targetRotY = 0;
      targetRotX = 0;
    };
    mount.addEventListener('pointermove', onPointer);
    mount.addEventListener('pointerleave', onPointerLeave);

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const isRunning = runningRef.current;
      const cfg = STATUS[statusRef.current] ?? STATUS.NOMINAL;

      // Stamp boot start on rising edge
      if (bootStartRef.current < 0) {
        bootStartRef.current = t;
        bootCamKick = 1;
        bootRing.scale.setScalar(0.6);
        (bootRing.material as THREE.MeshBasicMaterial).opacity = 0.85;
      }

      // Power factor: smooth spin-up / spin-down (~1.8s)
      const bootAge = bootStartRef.current >= 0 ? t - bootStartRef.current : 99;
      if (isRunning) {
        const bootRamp = easeOutCubic(Math.min(1, Math.max(0, bootAge / 1.8)));
        powerRef.current += (bootRamp - powerRef.current) * 0.14;
      } else {
        powerRef.current += (0 - powerRef.current) * 0.12;
      }
      const power = Math.max(0, Math.min(1, powerRef.current));

      const load = power > 0.02
        ? Math.min(1.4, Math.max(0.35, ((kwRef.current || 18) / 50))) * power
        : 0;

      applyMachineTheme(isDark());

      twin.rotation.y += (targetRotY - twin.rotation.y) * 0.22;
      twin.rotation.x += (targetRotX - twin.rotation.x) * 0.22;
      // Idle hover + stronger lift during boot
      const bootBounce = isRunning && bootAge < 1.8 ? Math.sin(bootAge * 10) * 0.025 * (1 - bootAge / 1.8) : 0;
      twin.position.y = power > 0.05 ? Math.sin(t * 1.4) * 0.02 * power + bootBounce : 0;

      // Fan spins up with power
      fan.rotation.z -= cfg.rpm * 0.1 * Math.max(load, power * 0.55);
      gaugeNeedle.rotation.z =
        -0.6 +
        load * 1.1 +
        (isRunning && statusRef.current === 'CRITIQUE' ? Math.sin(t * 6) * 0.15 : 0);

      // Boot flash on accents
      const bootFlash = isRunning && bootAge < 0.55 ? (1 - bootAge / 0.55) * 0.9 : 0;

      accentMat.color.setHex(cfg.accent);
      accentMat.emissive.setHex(cfg.emissive);
      accentMat.emissiveIntensity = !isRunning
        ? 0.08
        : (statusRef.current === 'CRITIQUE'
            ? 0.55 + Math.sin(t * 10) * 0.35
            : statusRef.current === 'AVERTISSEMENT'
              ? 0.4 + Math.sin(t * 4) * 0.15
              : 0.22 + Math.sin(t * 2) * 0.08) * power + bootFlash;

      sensorAccent.color.setHex(cfg.accent);
      sensorAccent.emissive.setHex(cfg.emissive);
      sensorAccent.emissiveIntensity = !isRunning
        ? 0.1
        : (statusRef.current === 'CRITIQUE'
            ? 0.9 + Math.sin(t * 12) * 0.5
            : 0.45 + Math.sin(t * 3) * 0.2) * power + bootFlash * 0.6;
      capteur.position.y = 1.05 + (power > 0.1 ? Math.sin(t * 2.6) * 0.01 * power : 0);

      const haloMat = halo.material as THREE.MeshBasicMaterial;
      haloMat.color.setHex(cfg.accent);
      haloMat.opacity = !isRunning
        ? 0.12
        : (statusRef.current === 'CRITIQUE'
            ? 0.35 + Math.abs(Math.sin(t * 8)) * 0.5
            : 0.35 + 0.15 * power) + bootFlash * 0.4;
      const haloPulse = isRunning && bootAge < 1.2
        ? 1 + easeOutBack(Math.min(1, bootAge / 1.2)) * 0.12
        : 1 + Math.sin(t * cfg.rpm) * 0.015 * load;
      halo.scale.setScalar(haloPulse);

      // Expanding shockwave on Start Production
      const bootRingMat = bootRing.material as THREE.MeshBasicMaterial;
      if (isRunning && bootAge < 1.4) {
        const p = bootAge / 1.4;
        bootRing.scale.setScalar(0.7 + easeOutCubic(p) * 1.8);
        bootRingMat.color.setHex(cfg.accent);
        bootRingMat.opacity = (1 - p) * 0.75;
      } else {
        bootRingMat.opacity = 0;
      }

      accentLight.color.setHex(cfg.accent);
      accentLight.intensity = isRunning
        ? (0.35 + load * 0.7) * power + bootFlash * 1.4
        : 0.2;

      pMat.color.setHex(cfg.accent);
      pMat.opacity = 0.15 + 0.65 * power;
      const pos = pGeom.attributes.position as THREE.BufferAttribute;
      if (power > 0.05) {
        for (let i = 0; i < particleCount; i++) {
          let y = pos.getY(i) + speeds[i] * 0.014 * cfg.rpm * power;
          if (y > 2.6) y = 0.15;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      }

      // Data beads along cable: sensor → compressor
      for (let i = 0; i < pulseCount; i++) {
        const bead = pulses[i];
        const mat = bead.material as THREE.MeshStandardMaterial;
        if (power < 0.08) {
          bead.visible = false;
          mat.opacity = 0;
          continue;
        }
        bead.visible = true;
        const u = ((t * 0.35 * (0.7 + power) + i / pulseCount) % 1);
        const pt = cableCurve.getPoint(1 - u); // from sensor (end) toward tank (start)
        bead.position.copy(pt);
        mat.color.setHex(cfg.accent);
        mat.emissive.setHex(cfg.accent);
        mat.emissiveIntensity = 0.8 + power * 0.8 + bootFlash * 0.5;
        mat.opacity = 0.35 + 0.55 * power;
        const s = 0.75 + 0.45 * Math.sin(u * Math.PI);
        bead.scale.setScalar(s);
      }

      // Antenna signal rings
      for (let i = 0; i < signalRings.length; i++) {
        const ring = signalRings[i];
        const mat = ring.material as THREE.MeshBasicMaterial;
        if (power < 0.05) {
          mat.opacity = 0;
          continue;
        }
        const phase = (t * 0.9 + i * 0.33) % 1;
        const s = 0.6 + phase * 2.2;
        ring.scale.setScalar(s);
        mat.color.setHex(cfg.accent);
        mat.opacity = (1 - phase) * 0.55 * power;
      }

      // Subtle camera punch on boot, then settle
      bootCamKick *= 0.92;
      const kick = bootCamKick * 0.12;
      camera.position.set(2.4 - kick, 1.65 + kick * 0.15, 4.6 - kick * 0.35);
      camera.lookAt(0, 0.75, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      mount.removeEventListener('pointermove', onPointer);
      mount.removeEventListener('pointerleave', onPointerLeave);
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  const cfg = STATUS[status] ?? STATUS.NOMINAL;
  const statusLabel = !running ? 'STOPPED' : booting ? 'POWERING UP' : cfg.label;
  const statusColor = !running
    ? 'var(--color-text-dim)'
    : booting
      ? 'var(--color-cyan)'
      : status === 'CRITIQUE'
        ? 'var(--color-red)'
        : status === 'AVERTISSEMENT'
          ? 'var(--color-amber)'
          : 'var(--color-cyan)';

  return (
    <div
      className="panel panel--live widget-enter"
      style={{
        position: 'relative',
        padding: 0,
        overflow: 'hidden',
        minHeight: '240px',
        height: '100%',
        maxHeight: '320px',
        borderTop: `2px solid ${statusColor}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '0.7rem',
          left: '0.85rem',
          right: '0.85rem',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'none',
        }}
      >
        <div>
          <div className="section-label" style={{ marginBottom: '0.2rem' }}>
            <span className="widget-icon"><IconCompressor size={14} /></span>
            Air Compressor · Digital Twin
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)' }}>
            {machineId}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-sub)', fontWeight: 600 }}>{machineName}</div>
          {(running || offHoursAlert) && (
            <div
              className="mono"
              style={{
                marginTop: '0.45rem',
                display: 'inline-flex',
                flexDirection: 'column',
                gap: '0.15rem',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                background: offHoursAlert ? 'var(--color-red-dim)' : 'var(--color-overlay)',
                border: `1px solid ${offHoursAlert ? 'var(--color-red)' : 'var(--color-hairline)'}`,
              }}
            >
              <span
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: offHoursAlert ? 'var(--color-red)' : 'var(--color-text-sub)',
                }}
              >
                {offHoursAlert ? 'API stopped · Off-Hours' : 'API live · receiving'}
              </span>
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: offHoursAlert ? 'var(--color-red)' : 'var(--color-text)',
                }}
              >
                {offHoursOnLabel}
              </span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            className="mono"
            style={{
              display: 'inline-block',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: statusColor,
              border: `1px solid ${statusColor}`,
              borderRadius: '4px',
              padding: '2px 7px',
              background: 'var(--color-surface-alpha)',
            }}
          >
            {statusLabel}
          </span>
          <div className="mono" style={{ marginTop: '0.35rem', fontSize: '1.05rem', fontWeight: 700, color: statusColor }}>
            {(running ? kw : 0).toFixed(1)}
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-sub)', fontWeight: 600 }}> kW</span>
          </div>
        </div>
      </div>

      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      <div
        style={{
          position: 'absolute',
          bottom: '0.55rem',
          left: '0.85rem',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: '0.58rem',
            color: 'var(--color-text)',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}
        >
          AIR COMPRESSOR + IOT CAPTEUR
        </span>
      </div>
    </div>
  );
};

export default Compressor3D;
