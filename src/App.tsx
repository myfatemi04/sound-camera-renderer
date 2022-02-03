import { DeviceOrientationControls } from "@react-three/drei";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Camera, Canvas } from "react-three-fiber";
import { Vector3 } from "three";
import "./App.css";

function Line({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  const ref = useRef<any>();
  useLayoutEffect(() => {
    ref.current.geometry.setFromPoints(
      [start, end].map((point) => new Vector3(...point))
    );
  }, [start, end]);
  return (
    <line ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color="hotpink" />
    </line>
  );
}

function Grid() {
  // This renders a grid on the floor
  const gridSize = 10;
  const gridRadius = gridSize / 2;
  const y = -1;
  return (
    <>
      {/* Horizontal lines */}
      {Array.from({ length: gridSize + 1 }, (_, i) => (
        <Line
          key={i}
          start={[-gridRadius, y, i - gridRadius]}
          end={[gridRadius, y, i - gridRadius]}
        />
      ))}
      {/* Vertical lines */}
      {Array.from({ length: gridSize + 1 }, (_, i) => (
        <Line
          key={i}
          start={[i - gridRadius, y, -gridRadius]}
          end={[i - gridRadius, y, gridRadius]}
        />
      ))}
    </>
  );
}

function App() {
  const [rotation, setRotation] = useState(0);
  const cameraRef = useRef<Camera>();

  useEffect(() => {
    const rotationTimerId = setInterval(() => {
      setRotation((r) => r + 0.01);
    }, 10);

    return () => {
      clearInterval(rotationTimerId);
    };
  }, []);

  useEffect(() => {
    const orientationListener = (e: DeviceOrientationEvent) => {
      const { alpha, beta, gamma } = e;
      document.getElementById(
        "orientation"
      )!.innerHTML = `Orientation: ${alpha} ${beta} ${gamma}`;
    };

    window.addEventListener("deviceorientation", orientationListener);

    return () => {
      window.removeEventListener("deviceorientation", orientationListener);
    };
  }, []);

  const [orientationPermission, setOrientationPermission] = useState<
    boolean | null
  >(null);

  const requestPermission = useCallback(() => {
    // DeviceOrientationEvent.requestPermission is an experimental feature that is only available
    // on iOS 14.5 and above.
    // @ts-ignore
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const result: Promise<"granted" | string> =
        // @ts-ignore
        DeviceOrientationEvent.requestPermission();
      result
        .then((permissionState) => {
          if (permissionState === "granted") {
            setOrientationPermission(true);
          } else {
            // Denied
            document.getElementById("error")!.innerHTML =
              "Orientation permission state: " + permissionState;
            setOrientationPermission(false);
          }
        })
        .catch((e) => {
          // Errored
          setOrientationPermission(false);
        });
    }
  }, []);

  return (
    <div className="App">
      {false && (
        <>
          {orientationPermission == null && (
            <button onClick={requestPermission}>
              Request permission for orientation
            </button>
          )}
          <div id="orientation">Orientation: </div>
        </>
      )}
      <Canvas
        style={{ height: 600, backgroundColor: "black" }}
        camera={cameraRef.current}
      >
        <perspectiveCamera ref={cameraRef} position={[0, 0, 0]} />
        <Grid />
        <DeviceOrientationControls camera={cameraRef.current} />
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
