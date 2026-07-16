import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Compressor3DProps {
  status: 'NOMINAL' | 'AVERTISSEMENT' | 'CRITIQUE';
}

const STATE_CONFIG = {
  NOMINAL: {
    color: 0x29D3F0, // Cyber Cyan
    coreColor: 0x2E7FE8, // Blue
    speed: 0.006,
    pulseSpeed: 1.5,
    scaleMult: 1.0,
  },
  AVERTISSEMENT: {
    color: 0xF2B84B, // Amber Warning
    coreColor: 0xD97706,
    speed: 0.02,
    pulseSpeed: 3.5,
    scaleMult: 1.1,
  },
  CRITIQUE: {
    color: 0xFF4B4B, // Red Alarm
    coreColor: 0x991B1B,
    speed: 0.05,
    pulseSpeed: 8.0,
    scaleMult: 1.25,
  },
};

export const Compressor3D: React.FC<Compressor3DProps> = ({ status }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 130;
    const height = mountRef.current.clientHeight || 62;
    const scene = new THREE.Scene();

    // Technical background grid overlay look inside canvas
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // 1. Holographic outer frame (Icosahedron for sci-fi node structure)
    const outerGeom = new THREE.IcosahedronGeometry(1.0, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x29D3F0,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const outerMesh = new THREE.Mesh(outerGeom, outerMat);
    group.add(outerMesh);

    // 2. Pulse core sphere (Solid glowing center)
    const coreGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x2E7FE8,
      transparent: true,
      opacity: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    group.add(coreMesh);

    // 3. Orbiting ring (Technical design)
    const ringGeom = new THREE.RingGeometry(1.25, 1.28, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x29D3F0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    group.add(ring);

    // 4. Floating particles around core
    const particleCount = 45;
    const pGeom = new THREE.BufferGeometry();
    const pCoords = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 0.65 + Math.random() * 0.35; // Constrained shells
      pCoords[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pCoords[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pCoords[i * 3 + 2] = r * Math.cos(phi);
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pCoords, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x29D3F0,
      size: 0.05,
      transparent: true,
      opacity: 0.9,
    });
    const particles = new THREE.Points(pGeom, pMat);
    group.add(particles);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const cfg = STATE_CONFIG[statusRef.current] ?? STATE_CONFIG.NOMINAL;

      // Group rotation
      group.rotation.y += cfg.speed;
      group.rotation.x = Math.sin(elapsed * 0.5) * 0.15;
      group.rotation.z += 0.002;

      // Ring counter-rotation
      ring.rotation.z -= cfg.speed * 1.5;

      // Dynamic scaling (pulse) representing data transmission
      const pulseFactor = 1.0 + Math.sin(elapsed * cfg.pulseSpeed) * 0.06 * cfg.scaleMult;
      outerMesh.scale.set(pulseFactor, pulseFactor, pulseFactor);
      
      const corePulse = 1.0 + Math.cos(elapsed * cfg.pulseSpeed * 1.2) * 0.15 * cfg.scaleMult;
      coreMesh.scale.set(corePulse, corePulse, corePulse);

      // Color updates
      outerMat.color.setHex(cfg.color);
      coreMat.color.setHex(cfg.coreColor);
      ringMat.color.setHex(cfg.color);
      pMat.color.setHex(cfg.color);

      // Status visual indicators
      if (statusRef.current === 'CRITIQUE') {
        const flash = Math.sin(elapsed * 18) > 0;
        outerMat.opacity = flash ? 0.7 : 0.15;
        coreMat.opacity = flash ? 0.95 : 0.3;
        pMat.opacity = flash ? 0.9 : 0.2;
      } else if (statusRef.current === 'AVERTISSEMENT') {
        outerMat.opacity = 0.35 + Math.sin(elapsed * 4) * 0.15;
        coreMat.opacity = 0.75 + Math.sin(elapsed * 4) * 0.15;
        pMat.opacity = 0.8;
      } else {
        outerMat.opacity = 0.25;
        coreMat.opacity = 0.65;
        pMat.opacity = 0.7;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mountRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      outerGeom.dispose();
      outerMat.dispose();
      coreGeom.dispose();
      coreMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      pGeom.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    />
  );
};
export default Compressor3D;
