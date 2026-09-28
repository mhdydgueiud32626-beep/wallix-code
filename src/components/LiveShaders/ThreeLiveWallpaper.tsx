import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LiveShaderType } from '../../types';

interface Props {
  shaderType?: LiveShaderType;
  interactive?: boolean;
  className?: string;
  speedMultiplier?: number;
  particlesCount?: number;
  isPaused?: boolean;
}

export const ThreeLiveWallpaper: React.FC<Props> = ({
  shaderType = 'synthwave-sunset',
  interactive = true,
  className = 'w-full h-full',
  speedMultiplier = 1,
  isPaused = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.replaceChildren(renderer.domElement);

    // Objects storage
    let animationFrameId: number;
    const cleanups: (() => void)[] = [];

    // Create scene based on shader type
    if (shaderType === 'synthwave-sunset') {
      // 1. Sun
      const sunGeo = new THREE.CircleGeometry(2.4, 64);
      const sunMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FF2E93'),
        transparent: true,
        opacity: 0.95,
      });
      const sun = new THREE.Mesh(sunGeo, sunMat);
      sun.position.set(0, 0.5, -4);
      scene.add(sun);

      // 2. Horizon grid
      const gridHelper = new THREE.GridHelper(40, 40, 0x06b6d4, 0x6366f1);
      gridHelper.position.y = -1.6;
      scene.add(gridHelper);

      // 3. Mountains wireframe
      const mountainGeo = new THREE.PlaneGeometry(30, 8, 32, 16);
      const pos = mountainGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const zNoise = Math.sin(u * 0.5) * Math.cos(v * 0.8) * 1.8 + Math.sin(u * 1.2) * 0.8;
        pos.setZ(i, Math.max(0, zNoise));
      }
      mountainGeo.computeVertexNormals();
      const mountainMat = new THREE.MeshBasicMaterial({
        color: 0x4f46e5,
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      });
      const mountains = new THREE.Mesh(mountainGeo, mountainMat);
      mountains.rotation.x = -Math.PI / 3;
      mountains.position.set(0, -1.2, -3);
      scene.add(mountains);

      // 4. Stardust particles
      const starGeo = new THREE.BufferGeometry();
      const starCount = 350;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPos[i] = (Math.random() - 0.5) * 20;
        starPos[i + 1] = Math.random() * 8;
        starPos[i + 2] = (Math.random() - 0.5) * 10 - 2;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.05, transparent: true, opacity: 0.8 });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      let clock = 0;
      const animate = () => {
        clock += 0.015 * speedMultiplier;
        gridHelper.position.z = (clock * 1.5) % 1;
        stars.rotation.y = clock * 0.05;
        sun.position.y = 0.5 + Math.sin(clock * 0.5) * 0.05;
      };
      cleanups.push(() => animate());
    } else if (shaderType === 'cosmic-nebula') {
      // Swirling galaxy particles
      const particleCount = 1200;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      const color1 = new THREE.Color('#3B82F6');
      const color2 = new THREE.Color('#8B5CF6');
      const color3 = new THREE.Color('#06B6D4');

      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 4 + 0.2;
        const spinAngle = radius * 3;
        const branchAngle = ((i % 3) * (2 * Math.PI)) / 3;

        const x = Math.cos(branchAngle + spinAngle) * radius + (Math.random() - 0.5) * 0.5;
        const y = (Math.random() - 0.5) * 0.8;
        const z = Math.sin(branchAngle + spinAngle) * radius + (Math.random() - 0.5) * 0.5;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const mixedColor = color1.clone().lerp(i % 2 === 0 ? color2 : color3, radius / 4);
        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const nebula = new THREE.Points(geo, mat);
      scene.add(nebula);

      let t = 0;
      const animate = () => {
        t += 0.005 * speedMultiplier;
        nebula.rotation.y = t;
        nebula.rotation.z = Math.sin(t * 0.5) * 0.1;
      };
      cleanups.push(() => animate());
    } else if (shaderType === 'cyber-torus') {
      // 3D Chrome Torus Knot + Ring
      const torusGeo = new THREE.TorusKnotGeometry(1.2, 0.35, 128, 32, 2, 3);
      const torusMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        roughness: 0.15,
        metalness: 0.9,
        wireframe: false,
      });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      scene.add(torus);

      const wireGeo = new THREE.TorusGeometry(2.2, 0.04, 16, 100);
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
      const ring = new THREE.Mesh(wireGeo, wireMat);
      scene.add(ring);

      const light1 = new THREE.DirectionalLight(0x06b6d4, 3);
      light1.position.set(5, 5, 5);
      scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xf43f5e, 2);
      light2.position.set(-5, -5, -2);
      scene.add(light2);
      scene.add(new THREE.AmbientLight(0x312e81, 1.5));

      let t = 0;
      const animate = () => {
        t += 0.01 * speedMultiplier;
        torus.rotation.x = t * 0.8;
        torus.rotation.y = t * 1.2;
        ring.rotation.z = -t * 0.5;
        ring.rotation.x = Math.sin(t) * 0.4;
      };
      cleanups.push(() => animate());
    } else if (shaderType === 'aurora-waves') {
      // Flowing undulating wave mesh
      const planeGeo = new THREE.PlaneGeometry(24, 16, 64, 48);
      const planeMat = new THREE.MeshStandardMaterial({
        color: 0x059669,
        wireframe: true,
        roughness: 0.2,
        metalness: 0.8,
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = -Math.PI / 2.5;
      plane.position.y = -1;
      scene.add(plane);

      const light = new THREE.PointLight(0x34d399, 4, 25);
      light.position.set(0, 3, 2);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0x064e3b, 2));

      let t = 0;
      const pos = planeGeo.attributes.position;
      const animate = () => {
        t += 0.02 * speedMultiplier;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const v = pos.getY(i);
          const z = Math.sin(u * 0.4 + t) * Math.cos(v * 0.3 + t * 0.8) * 1.6;
          pos.setZ(i, z);
        }
        pos.needsUpdate = true;
        planeGeo.computeVertexNormals();
      };
      cleanups.push(() => animate());
    } else {
      // Default: Floating Polyhedron Crystal
      const crystalGeo = new THREE.IcosahedronGeometry(1.6, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        roughness: 0.1,
        metalness: 0.95,
        wireframe: false,
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      scene.add(crystal);

      const wire = new THREE.Mesh(
        crystalGeo,
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.6 })
      );
      scene.add(wire);

      const light = new THREE.PointLight(0x06b6d4, 3, 20);
      light.position.set(3, 3, 3);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0x1e1b4b, 2));

      let t = 0;
      const animate = () => {
        t += 0.01 * speedMultiplier;
        crystal.rotation.x = t;
        crystal.rotation.y = t * 1.3;
        wire.rotation.x = crystal.rotation.x;
        wire.rotation.y = crystal.rotation.y;
      };
      cleanups.push(() => animate());
    }

    // Mouse movement listener for interactive parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || isPausedRef.current) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.8;
      mouseRef.current.targetY = y * 0.8;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    // ProcessMonitor event listeners inside Three renderer
    const onPause = () => {
      isPausedRef.current = true;
    };
    const onResume = () => {
      isPausedRef.current = false;
    };
    window.addEventListener('wallix:pause-render', onPause);
    window.addEventListener('wallix:resume-render', onResume);

    // Main Render Loop with 0% CPU Freeze when isPausedRef is true
    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      // If paused by ProcessMonitor (App Maximized / Game Mode), skip heavy WebGL render loop
      if (isPausedRef.current) {
        return;
      }

      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      camera.position.x = mouseRef.current.x;
      camera.position.y = mouseRef.current.y;
      camera.lookAt(0, 0, 0);

      cleanups.forEach((fn) => fn());
      renderer.render(scene, camera);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wallix:pause-render', onPause);
      window.removeEventListener('wallix:resume-render', onResume);
      resizeObserver.disconnect();
      renderer.dispose();
      container.replaceChildren();
    };
  }, [shaderType, interactive, speedMultiplier]);

  return <div ref={containerRef} className={`relative overflow-hidden ${className}`} />;
};
