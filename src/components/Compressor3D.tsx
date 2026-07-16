import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Compressor3DProps {
  status: 'NOMINAL' | 'AVERTISSEMENT' | 'CRITIQUE';
}

const STATE_CONFIG = {
  NOMINAL: {
    color: 0x29D3F0, // Cyan
    speed: 0.008,
    pulseSpeed: 0.001,
    glowIntensity: 0.5,
  },
  AVERTISSEMENT: {
    color: 0xF2B84B, // Amber
    speed: 0.025,
    pulseSpeed: 0.003,
    glowIntensity: 1.0,
  },
  CRITIQUE: {
    color: 0xFF4B4B, // Red
    speed: 0.065,
    pulseSpeed: 0.008,
    glowIntensity: 2.0,
  },
};

export const Compressor3D: React.FC<Compressor3DProps> = ({ status }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef(status);

  // Keep ref up to date so animation loop uses latest config instantly
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene, camera, renderer
    const width = mountRef.current.clientWidth || 300;
    const height = mountRef.current.clientHeight || 150;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Create custom industrial machine wireframe (Procedural Cylinder + rings)
    const group = new THREE.Group();
    scene.add(group);

    // 1. Core Compressor Cylinder
    const cylinderGeom = new THREE.CylinderGeometry(1.2, 1.2, 3.2, 16, 6, true);
    const cylinderMat = new THREE.MeshBasicMaterial({
      color: 0x29D3F0,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const cylinderMesh = new THREE.Mesh(cylinderGeom, cylinderMat);
    group.add(cylinderMesh);

    // 2. Glowing Piston/Rotor Points inside
    const particleCount = 120;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Cylinder distribution
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.9;
      const y = (Math.random() - 0.5) * 2.8;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x2E7FE8,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    group.add(particles);

    // 3. Outer orbiting rings
    const ringGeom1 = new THREE.TorusGeometry(1.8, 0.02, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x29D3F0,
      transparent: true,
      opacity: 0.6,
    });
    const ring1 = new THREE.Mesh(ringGeom1, ringMat);
    ring1.rotation.x = Math.PI / 2;
    group.add(ring1);

    const ringGeom2 = new THREE.TorusGeometry(1.9, 0.015, 8, 48);
    const ring2 = new THREE.Mesh(ringGeom2, ringMat);
    ring2.rotation.x = Math.PI / 4;
    group.add(ring2);

    // Animation variables
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const cfg = STATE_CONFIG[statusRef.current] ?? STATE_CONFIG.NOMINAL;
      time += 1;

      // Rotate group
      group.rotation.y += cfg.speed;
      group.rotation.x = Math.sin(time * 0.01) * 0.15;

      // Update ring rotation speeds
      ring1.rotation.z += cfg.speed * 0.5;
      ring2.rotation.z -= cfg.speed * 0.8;

      // Pulsing scale & opacity
      const pulse = 1.0 + Math.sin(time * cfg.pulseSpeed * 50) * 0.08 * cfg.glowIntensity;
      cylinderMesh.scale.set(pulse, pulse, pulse);

      // Color updates
      cylinderMat.color.setHex(cfg.color);
      particleMat.color.setHex(cfg.color);
      ringMat.color.setHex(cfg.color);

      // Flash/pulse opacity for alert status
      if (statusRef.current === 'CRITIQUE') {
        const strobe = Math.sin(time * 0.25) > 0;
        cylinderMat.opacity = strobe ? 0.6 : 0.15;
        ringMat.opacity = strobe ? 0.9 : 0.25;
      } else if (statusRef.current === 'AVERTISSEMENT') {
        cylinderMat.opacity = 0.35 + Math.sin(time * 0.08) * 0.15;
        ringMat.opacity = 0.7 + Math.sin(time * 0.08) * 0.2;
      } else {
        cylinderMat.opacity = 0.22;
        ringMat.opacity = 0.55;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resizing
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

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // Dispose materials & geometries
      cylinderGeom.dispose();
      cylinderMat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      ringGeom1.dispose();
      ringGeom2.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '140px',
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
