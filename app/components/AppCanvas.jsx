// import * as THREE from 'three'
// import { Canvas, render, events, extend } from '@react-three/fiber'
// import App from './App'
// import { useRef,useEffect } from 'react';

// extend(THREE)


// const AppCanvas = () => {
//     const handleResize = () => {
//       // handle resize logic
//     };
  
//   return (
//       <div style={{width:1000, height:1000, border: '1px solid black' }}>
//       <Canvas
//         onCreated={({ gl }) => {
//           // Additional setup logic can be placed here
//         }}
//         style={{ width: '100%', height: '100%' }}
//         gl={{ antialias: true, alpha: true }}
//         camera={{ fov: 25, position: [0, 0, 6] }}
//         linear
//       >
//         <App />

//       </Canvas>
//       </div>

//     );
// };
// export default AppCanvas
import { getGPUTier } from 'detect-gpu';

import * as THREE from "three";
import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Noise,
  Vignette
} from "@react-three/postprocessing";
import {
  Html,
  Icosahedron,
  useTexture,
  useCubeTexture,
  MeshDistortMaterial
} from "@react-three/drei";

function MainSphere({ material }) {
  const main = useRef();
  // main sphere rotates following the mouse position
  useFrame(({ clock, mouse }) => {
    main.current.rotation.z = clock.getElapsedTime();
    main.current.rotation.y = THREE.MathUtils.lerp(
      main.current.rotation.y,
      mouse.x * Math.PI,
      0.1
    );
    main.current.rotation.x = THREE.MathUtils.lerp(
      main.current.rotation.x,
      mouse.y * Math.PI,
      0.1
    );
  });
  return (
    <Icosahedron
      args={[1, 4]}
      ref={main}
      material={material}
      position={[0, 0, 0]}
    />
  );
}

function Instances({ material }) {
  // we use this array ref to store the spheres after creating them
  const [sphereRefs] = useState(() => []);
  // we use this array to initialize the background spheres
  const initialPositions = [
    [-4, 20, -12],
    [-10, 12, -4],
    [-11, -12, -23],
    [-16, -6, -10],
    [12, -2, -3],
    [13, 4, -12],
    [14, -2, -23],
    [8, 10, -20]
  ];
  // smaller spheres movement
  useFrame(() => {
    // animate each sphere in the array
    sphereRefs.forEach((el) => {
      el.position.y += 0.02;
      if (el.position.y > 19) el.position.y = -18;
      el.rotation.x += 0.06;
      el.rotation.y += 0.06;
      el.rotation.z += 0.02;
    });
  });
  return (
    <>
      <MainSphere material={material} />
      {initialPositions.map((pos, i) => (
        <Icosahedron
          args={[1, 4]}
          position={[pos[0], pos[1], pos[2]]}
          material={material}
          key={i}
          ref={(ref) => (sphereRefs[i] = ref)}
        />
      ))}
    </>
  );
}

function Scene() {
  const bumpMap = useTexture("/bump.jpg");
  const envMap = useCubeTexture(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    { path: "/cube/" }
  );
  // We use `useResource` to be able to delay rendering the spheres until the material is ready
  const [material, set] = useState();

  return (
    <>
      <MeshDistortMaterial
        ref={set}
        envMap={envMap}
        bumpMap={bumpMap}
        color={"#010101"}
        roughness={0.1}
        metalness={1}
        bumpScale={0.005}
        clearcoat={1}
        clearcoatRoughness={1}
        radius={1}
        distort={0.4}
      />
      {material && <Instances material={material} />}
    </>
  );
}

export default function AppCanvas() {
  const [gpuTier, setGPUTier] = useState(null);

  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const fetchGPUTier = async () => {
      const tier = await getGPUTier();
      setGPUTier(tier);
    };

    fetchGPUTier();
  }, []);


  useEffect(() => {
    const handleLoad = () => {
      console.log('Component has loaded');
      setLoading(true);
    };

    // Check if the 'load' event has already fired
    if (document.readyState === 'complete') {
      console.log('Component complete');

      handleLoad();
    } else {
      console.log('waiting event');

      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);


  console.log(gpuTier?.tier, 'gpuTier');
  if(!loading) return <div style={{width:500, height: 500, background:'red'}}></div>

  if (gpuTier?.tier === Number(2)) {
    return (
      <Counter/>
    )
  }

  return (
    <Canvas
      style={{height:1000}}
      // colorManagement
      camera={{ position: [0, 0, 3] }}
      gl={{
        powerPreference: "high-performance",
        alpha: false,
        antialias: false,
        stencil: false,
        depth: false
      }}
    >
      <color attach="background" args={["#050505"]} />
      <fog color="#161616" attach="fog" near={8} far={30} />
      <Suspense fallback={<Html center>Loading.</Html>}>
        <Scene />
      </Suspense>
      <EffectComposer multisampling={0} disableNormalPass={true}>
        <DepthOfField
          focusDistance={0}
          focalLength={0.02}
          bokehScale={2}
          height={480}
        />
        <Bloom
          luminanceThreshold={0}
          luminanceSmoothing={0.9}
          height={300}
          opacity={3}
        />
        <Noise opacity={0.025} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    
    </Canvas>
  );
}

  

export function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef()
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (ref.current.rotation.x += delta))
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
}

export  function Counter() {
  return (
    <Canvas>
    <ambientLight />
    <pointLight position={[10, 10, 10]} />
    <Box position={[-1.2, 0, 0]} />
    <Box position={[1.2, 0, 0]} />
  </Canvas>
  )
}
