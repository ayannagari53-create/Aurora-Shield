import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Core3DState } from '../../types';

interface AuroraCoreProps {
  state?: Core3DState;
  className?: string;
  size?: number;
}

export const AuroraCore: React.FC<AuroraCoreProps> = ({
  state = 'SCANNING',
  className = '',
  size
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = size || container.clientWidth || 320;
    const height = size || container.clientHeight || 320;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Color mapper based on compliance state
    const getColorForState = (st: Core3DState) => {
      switch (st) {
        case 'COMPLIANT':
          return new THREE.Color(0x10b981); // Emerald
        case 'POTENTIAL_ISSUE':
          return new THREE.Color(0xef4444); // Rose/Red
        case 'NEEDS_VERIFICATION':
          return new THREE.Color(0xf59e0b); // Amber
        case 'ANALYZING':
          return new THREE.Color(0x8a2be2); // Electric Purple
        case 'VERIFYING':
          return new THREE.Color(0x3b82f6); // Royal Blue
        case 'SCANNING':
        default:
          return new THREE.Color(0x00f2fe); // Cyan
      }
    };

    // 1. Central Core Sphere (Icosahedron wireframe + inner glowing sphere)
    const coreGeometry = new THREE.IcosahedronGeometry(1.15, 2);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: getColorForState(stateRef.current),
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);

    // Inner glow sphere
    const innerGeo = new THREE.SphereGeometry(0.75, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: getColorForState(stateRef.current),
      transparent: true,
      opacity: 0.35
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // 2. Outer Scanning Rings (3 gyroscopic rings)
    const createRing = (radius: number, tube: number, col: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.7
      });
      return new THREE.Mesh(ringGeo, ringMat);
    };

    const ring1 = createRing(1.85, 0.02, 0x00f2fe);
    const ring2 = createRing(2.1, 0.018, 0x8a2be2);
    const ring3 = createRing(2.35, 0.015, 0x4facfe);

    ring1.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    ring3.rotation.z = Math.PI / 6;

    scene.add(ring1);
    scene.add(ring2);
    scene.add(ring3);

    // 3. Orbiting Data Stream Nodes
    const nodesGroup = new THREE.Group();
    const nodeCount = 8;
    const nodeMeshes: THREE.Mesh[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const nodeGeo = new THREE.SphereGeometry(0.065, 12, 12);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: 0xffffff
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodesGroup.add(nodeMesh);
      nodeMeshes.push(nodeMesh);
    }
    scene.add(nodesGroup);

    // 4. Subtle Particle Swarm
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = 1.4 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.04,
      transparent: true,
      opacity: 0.65
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const currentState = stateRef.current;
      const targetColor = getColorForState(currentState);

      // Smooth color transition
      coreMaterial.color.lerp(targetColor, 0.08);
      innerMat.color.lerp(targetColor, 0.08);
      particleMat.color.lerp(targetColor, 0.08);

      // Speed intensity based on state
      const speedMult = currentState === 'SCANNING' || currentState === 'ANALYZING' ? 2.2 : 1.0;

      // Rotation
      coreMesh.rotation.x = elapsedTime * 0.4 * speedMult;
      coreMesh.rotation.y = elapsedTime * 0.6 * speedMult;

      ring1.rotation.x += 0.015 * speedMult;
      ring1.rotation.y += 0.009 * speedMult;

      ring2.rotation.y += 0.012 * speedMult;
      ring2.rotation.z += 0.016 * speedMult;

      ring3.rotation.z += 0.018 * speedMult;
      ring3.rotation.x += 0.011 * speedMult;

      particleSystem.rotation.y = elapsedTime * 0.15 * speedMult;

      // Orbiting nodes motion
      nodeMeshes.forEach((n, idx) => {
        const angle = elapsedTime * 1.2 * speedMult + (idx * (Math.PI * 2)) / nodeCount;
        const radius = 1.9 + Math.sin(elapsedTime * 2 + idx) * 0.2;
        n.position.x = Math.cos(angle) * radius;
        n.position.y = Math.sin(angle * 0.7) * (radius * 0.6);
        n.position.z = Math.sin(angle) * radius;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = size || container.clientWidth;
      const newH = size || container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <div ref={containerRef} className="w-full h-full flex items-center justify-center pointer-events-none" />
      {/* State Badge Overlay */}
      <div className="absolute bottom-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase backdrop-blur-md border border-cyan-500/20 bg-slate-950/70 text-cyan-300">
        ENGINE: {state.replace('_', ' ')}
      </div>
    </div>
  );
};
