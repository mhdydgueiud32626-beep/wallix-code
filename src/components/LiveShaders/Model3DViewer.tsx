import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Model3DViewerProps {
  modelUrl: string;
  className?: string;
  autoRotate?: boolean;
  scaleMultiplier?: number;
  rotationSpeed?: number; 
  enableWireframe?: boolean;
  backgroundColor?: string;
  onError?: (errMessage: string) => void;
}

export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  modelUrl,
  className = 'w-full h-full',
  autoRotate = true,
  scaleMultiplier = 1,
  rotationSpeed = 1,
  enableWireframe = false,
  backgroundColor,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !modelUrl) return;

    setLoading(true);
    setError(null);
    setLoadingProgress(0);

    const scene = new THREE.Scene();
    if (backgroundColor) {
      scene.background = new THREE.Color(backgroundColor);
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !backgroundColor });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    // Orbit Controls for mouse drag, zoom, and rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0 * rotationSpeed;
    controls.maxDistance = 25;
    controls.minDistance = 0.5;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 1.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 2.5);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 2.0);
    dirLight2.position.set(-5, -2, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 20);
    pointLight.position.set(0, 3, 2);
    scene.add(pointLight);

    // Ground Grid Helper for cyber aesthetic
    const gridHelper = new THREE.GridHelper(20, 20, 0x06b6d4, 0x312e81);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    // GLTF / GLB Loader
    const loader = new GLTFLoader();
    let mixer: THREE.AnimationMixer | null = null;
    let modelGroup: THREE.Group | null = null;
    let animationFrameId: number;
    const clock = new THREE.Clock();

    loader.load(
      modelUrl,
      (gltf) => {
        modelGroup = gltf.scene;

        // Auto-center and normalize scale
        const box = new THREE.Box3().setFromObject(modelGroup);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = (2.2 / (maxDim || 1)) * scaleMultiplier;
        modelGroup.scale.setScalar(scale);

        // Center on origin
        modelGroup.position.x = -center.x * scale;
        modelGroup.position.y = -center.y * scale;
        modelGroup.position.z = -center.z * scale;

        // Apply wireframe or custom material props if needed
        modelGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (enableWireframe && mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => {
                  if ('wireframe' in m) {
                    (m as unknown as { wireframe: boolean }).wireframe = true;
                  }
                });
              } else if ('wireframe' in mesh.material) {
                (mesh.material as unknown as { wireframe: boolean }).wireframe = true;
              }
            }
          }
        });

        scene.add(modelGroup);

        // Animations support
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(modelGroup);
          gltf.animations.forEach((clip) => {
            mixer?.clipAction(clip).play();
          });
        }

        setLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const progress = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadingProgress(progress);
        }
      },
      (err) => {
        console.error('Error loading 3D model:', err);
        const msg = 'Failed to load 3D model. Please ensure the .glb or .gltf file is valid.';
        setError(msg);
        setLoading(false);
        onError?.(msg);
      }
    );

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

    // Render loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta * rotationSpeed);
      }

      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 2.0 * rotationSpeed;
      controls.update();

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      container.replaceChildren();
    };
  }, [modelUrl, autoRotate, scaleMultiplier, rotationSpeed, enableWireframe, backgroundColor, onError]);

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-cyan-400 space-y-3 pointer-events-none">
          <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-xs font-mono font-bold tracking-wider">
            LOADING 3D GLTF/GLB MODEL {loadingProgress > 0 ? `(${loadingProgress}%)` : ''}...
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 text-center text-rose-400 space-y-2">
          <p className="text-sm font-bold">{error}</p>
          <p className="text-xs text-slate-400">Please try uploading a valid .glb or .gltf file format.</p>
        </div>
      )}
    </div>
  );
};
