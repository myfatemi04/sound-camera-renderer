import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { Canvas } from 'react-three-fiber';

function App() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const rotationTimerId = setInterval(() => {
      setRotation(r => r + 0.01);
    }, 10);

    return () => clearInterval(rotationTimerId)
  }, [])

  return (
    <div className="App">
      <Canvas style={{ height: 600, backgroundColor: "black" }}>
        <pointLight position={[10, 10, 10]} />
        <ambientLight />
        <mesh rotation={[rotation, rotation, 0]}>
          <meshStandardMaterial color="red" />
          <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
        </mesh>
      </Canvas>
    </div>
  );
}

export default App;
