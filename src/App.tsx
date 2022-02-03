import { DeviceOrientationControls, OrbitControls } from '@react-three/drei';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { Camera, Canvas } from 'react-three-fiber';
import { Euler, Vector3 } from 'three';
import './App.css';
import Gate from './Gate';
import isMobileDevice from './isMobileDevice';

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
			[start, end].map(point => new Vector3(...point))
		);
	}, [start, end]);
	return (
		<line ref={ref}>
			<bufferGeometry />
			<lineBasicMaterial color='hotpink' />
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

type SoundSourceLocation = {
	x: number;
	y: number;
	z: number;
	E: number;
};

type SoundSourceLocalizationPacket = {
	timeStamp: number;
	src: SoundSourceLocation[];
};

const mobile = isMobileDevice();

function App() {
	const [rotation, setRotation] = useState(0);
	const cameraRef = useRef<Camera>();

	const [ip, setIp] = useState<string>('');
	const websocketRef = useRef<WebSocket>();

	const [soundSourceLocalizations, setSoundSourceLocalizations] = useState<
		SoundSourceLocation[]
	>([]);

	const confirmIp = useCallback(() => {
		if (websocketRef.current) {
			websocketRef.current.close();
		}
		let didError = false;
		websocketRef.current = new WebSocket(`ws://${ip}`);
		websocketRef.current.onmessage = event => {
			try {
				const json = JSON.parse(event.data) as SoundSourceLocalizationPacket;

				setSoundSourceLocalizations(json.src);
			} catch (e) {
				if (!didError) {
					console.error('Error encountered while parsing JSON.');
					console.error('Future errors will be ignored.');
					console.error('Text:');
					console.error(event.data);
					console.error();
					console.error('Error:');
					console.error(e);
					didError = true;
				}
			}
		};
	}, [ip]);

	// Rotation timer
	useEffect(() => {
		const rotationTimerId = setInterval(() => {
			setRotation(r => r + 0.01);
		}, 10);

		return () => {
			clearInterval(rotationTimerId);
		};
	}, []);

	// Orientation listener
	useEffect(() => {
		const listener = (e: DeviceOrientationEvent) => {
			const { alpha, beta, gamma } = e;
			if (alpha && beta && gamma) {
				cameraRef.current?.setRotationFromEuler(new Euler(alpha, beta, gamma));
			}
			const orientationElement = document.getElementById('orientation')!;

			if (alpha !== null) {
				orientationElement.innerHTML = `Orientation: ${alpha} ${beta} ${gamma}`;
			} else {
				orientationElement.innerHTML = `No orientation data available`;
			}
		};

		window.addEventListener('deviceorientation', listener);

		return () => {
			window.removeEventListener('deviceorientation', listener);
		};
	}, []);

	const [orientationPermission, setOrientationPermission] =
		useState<boolean | null>(null);

	const requestPermission = useCallback(() => {
		// DeviceOrientationEvent.requestPermission is an experimental feature that is only available
		// on iOS 14.5 and above.
		// @ts-ignore
		if (typeof DeviceOrientationEvent.requestPermission === 'function') {
			const result: Promise<'granted' | string> =
				// @ts-ignore
				DeviceOrientationEvent.requestPermission();
			result
				.then(permissionState => {
					if (permissionState === 'granted') {
						setOrientationPermission(true);
					} else {
						// Denied
						document.getElementById('error')!.innerHTML =
							'Orientation permission state: ' + permissionState;
						setOrientationPermission(false);
					}
				})
				.catch(e => {
					// Errored
					setOrientationPermission(false);
				});
		}
	}, []);

	return (
		<div className='App'>
			<div style={{ display: 'flex' }}>
				<input type='text' onChange={e => setIp(e.target.value)} />
				<button onClick={confirmIp}>Confirm IP</button>
			</div>
			<Gate active>
				{orientationPermission == null && (
					<button onClick={requestPermission}>
						Request permission for orientation
					</button>
				)}
				<div id='orientation'>Orientation: </div>
			</Gate>
			<Canvas
				style={{ height: 600, backgroundColor: 'black' }}
				camera={cameraRef.current}
			>
				<perspectiveCamera ref={cameraRef} position={[0, 0, 0]} />
				<Grid />

				{soundSourceLocalizations.map(
					({ x, y, z, E }, idx) =>
						E > 0.2 && (
							<mesh position={[x, y, z]} key={idx}>
								<meshStandardMaterial color={`rgba(255, 255, 255, ${E})`} />
								{/* sphereBufferGeometry args: [radius, widthSegments, heightSegments] */}
								<sphereBufferGeometry attach='geometry' args={[0.1, 32, 32]} />
							</mesh>
						)
				)}

				<Gate active={mobile}>
					<DeviceOrientationControls camera={cameraRef.current} />
				</Gate>
				<Gate active={!mobile}>
					<OrbitControls camera={cameraRef.current} />
				</Gate>

				<pointLight position={[10, 10, 10]} />
				<ambientLight />
				<mesh rotation={[rotation, rotation, 0]} position={[0, -1, 0]}>
					<meshStandardMaterial color='red' />
					<boxBufferGeometry attach='geometry' args={[1, 1, 1]} />
				</mesh>
			</Canvas>
		</div>
	);
}

export default App;
