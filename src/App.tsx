import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Camera, Canvas } from 'react-three-fiber';
import { Vector3 } from 'three';
import './App.css';

function Line({ start, end }: { start: [number, number, number], end: [number, number, number] }) {
  const ref = useRef<any>();
  useLayoutEffect(() => {
    ref.current.geometry.setFromPoints([start, end].map((point) => new Vector3(...point)))
  }, [start, end])
  return (
    <line ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color="hotpink" />
    </line>
  )
}

function Grid() {
  // This renders a grid on the floor
  const gridSize = 10;
  return <>
    {/* Horizontal lines */}
    {Array.from({ length: gridSize + 1 }, (_, i) => (
      <Line start={[-gridSize / 2, -1, i - gridSize / 2]} end={[gridSize / 2, -1, i - gridSize / 2]} />
    ))}
    {/* Vertical lines */}
    {Array.from({ length: gridSize + 1 }, (_, i) => (
      <Line start={[i - gridSize / 2, -1, -gridSize / 2]} end={[i - gridSize / 2, -1, gridSize / 2]} />
    ))}
  </>
}

function App() {
  const [rotation, setRotation] = useState(0);
  const cameraRef = useRef<Camera>();

  useEffect(() => {
    const rotationTimerId = setInterval(() => {
      setRotation(r => r + 0.01);
    }, 10);

    return () => clearInterval(rotationTimerId)
  }, [])

  return (
    <div className="App">
      <Canvas style={{ height: 600, backgroundColor: "black" }} camera={cameraRef.current}>
        <perspectiveCamera ref={cameraRef} position={[0, 0, 0]} />
        <Grid />
        {/* @ts-ignore */}
        {/* <DeviceOrientationControls camera={cameraRef.current} /> */}
        {/* <OrbitControls camera={cameraRef.current} onChange={console.log} /> */}
        <pointLight position={[10, 10, 10]} />
        <ambientLight />
        <mesh rotation={[rotation, rotation, 0]} position={[0, -1, 0]}>
          <meshStandardMaterial color="red" />
          <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
        </mesh>
      </Canvas>
    </div>
  );
}

export default App;
