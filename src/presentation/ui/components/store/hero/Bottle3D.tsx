"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import type { Essence } from "./essences";

/** Modelo 3D del frasco, servido desde /public. */
const MODEL_URL = "/perfume.glb";
/** Altura objetivo del frasco dentro de la escena (unidades de three.js). */
const TARGET_HEIGHT = 3.4;
/** Cuánto se mezcla la esencia elegida con el color original del modelo (0 = sin tinte, 1 = color puro). */
const TINT_STRENGTH = 0.25;

useGLTF.preload(MODEL_URL);

function PerfumeModel({ essence }: { essence: Essence }) {
  const { scene } = useGLTF(MODEL_URL);

  const { scale, materials } = useMemo(() => {
    const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const list: THREE.MeshStandardMaterial[] = [];
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (material instanceof THREE.MeshStandardMaterial && !list.includes(material)) list.push(material);
      }
    });
    return { scale: TARGET_HEIGHT / Math.max(size.x, size.y, size.z, 1e-6), materials: list };
  }, [scene]);

  const tint = useMemo(() => new THREE.Color(), []);
  useEffect(() => {
    tint.set("#ffffff").lerp(new THREE.Color(essence.liquid), TINT_STRENGTH);
  }, [essence, tint]);

  useFrame((_, delta) => {
    const step = Math.min(1, delta * 3);
    for (const material of materials) material.color.lerp(tint, step);
  });

  return (
    <Center>
      <group scale={scale}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

/** Si el modelo no carga, la escena se queda vacía en vez de romper toda la página. */
class ModelBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("No se pudo cargar el modelo 3D del frasco:", error);
    this.props.onError();
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Escena 3D del hero: el modelo del frasco y la iluminación de estudio generada en la propia escena. */
export default function Bottle3D({ essence, onError }: { essence: Essence; onError: () => void }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.2, 10.4], fov: 30 }} gl={{ antialias: true, alpha: true }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow />
      <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#e9c46a" />
      <ModelBoundary onError={onError}>
        <Suspense fallback={null}>
          <PerfumeModel essence={essence} />
        </Suspense>
      </ModelBoundary>
      <Environment resolution={256}>
        <Lightformer intensity={3} position={[0, 9, 0]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} color="#fff2dc" />
        <Lightformer intensity={2.2} position={[-9, 1, 2]} rotation-y={Math.PI / 2} scale={[3, 12, 1]} color="#ffe1b0" />
        <Lightformer intensity={1.2} position={[9, 0, -2]} rotation-y={-Math.PI / 2} scale={[2, 10, 1]} color="#d8c2ff" />
      </Environment>
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.8} minPolarAngle={Math.PI / 2.6} maxPolarAngle={Math.PI / 1.9} target={[0, 0, 0]} />
    </Canvas>
  );
}
