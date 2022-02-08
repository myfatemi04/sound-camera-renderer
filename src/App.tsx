import { DeviceOrientationControls, OrbitControls } from '@react-three/drei';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { Canvas } from 'react-three-fiber';
import { PerspectiveCamera, Vector3 } from 'three';
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
	const y = -0.5;
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
const maxSoundSourceLocalizationEvents = 20;

function App() {
	const [rotation, setRotation] = useState(0);
	const [camera] = useState(() => new PerspectiveCamera());

	const [ip, setIp] = useState<string>('');
	const websocketRef = useRef<WebSocket>();

	const [soundSourceLocalizationEvents, setSoundSourceLocalizations] = useState<
		({ localizations: SoundSourceLocation[]; date: number } | null)[]
	>([]);
	const [
		_soundSourceLocalizationEventCounter,
		setSoundSourceLocalizationEventCounter,
	] = useState(0);

	const confirmIp = useCallback(() => {
		if (websocketRef.current) {
			websocketRef.current.close();
		}
		let didError = false;
		websocketRef.current = new WebSocket(`ws://${ip}`);
		websocketRef.current.onmessage = event => {
			try {
				const json = JSON.parse(event.data) as SoundSourceLocalizationPacket;
				const date = Date.now();

				let hasVisibleSoundSource = false;
				json.src.forEach(src => {
					if (src.E * src.E > 0.1) {
						hasVisibleSoundSource = true;
					}
				});

				if (hasVisibleSoundSource)
					setSoundSourceLocalizationEventCounter(counter => {
						setSoundSourceLocalizations(localizations => {
							const clone = [...localizations];
							clone[counter] = { localizations: json.src, date };
							return clone;
						});
						return (counter + 1) % maxSoundSourceLocalizationEvents;
					});
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
			// if (alpha && beta && gamma) {
			// 	camera.setRotationFromEuler(new Euler(alpha, beta, gamma));
			// }
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

	const canvasRef = useRef<HTMLCanvasElement>(null);

	camera.fov = 135;
	camera.position.set(0, 0, 2);
	if (canvasRef.current) {
		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		camera.aspect = rect.width / rect.height;
		camera.updateProjectionMatrix();
	}

	const oldestTimestamp = soundSourceLocalizationEvents.reduce(
		(acc, curr) => (curr ? Math.min(acc, curr.date) : acc),
		Date.now()
	);

	const newestTimestamp = soundSourceLocalizationEvents.reduce(
		(acc, curr) => (curr ? Math.max(acc, curr.date) : acc),
		Date.now()
	);

	const elapsedTime = newestTimestamp - oldestTimestamp;

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
				camera={camera}
				ref={canvasRef}
			>
				<Grid />

				{soundSourceLocalizationEvents.map(event =>
					event?.localizations.map(
						({ x, y, z, E }, idx) =>
							E * E > 0.1 && (
								<mesh position={[x * 4, y * 4 - 0.5, 0]} key={idx}>
									<meshStandardMaterial
										transparent
										opacity={
											// Fade out the sound source after a certain amount of time
											(event.date - oldestTimestamp) / elapsedTime
										}
										color={`rgb(${Math.min(
											255,
											Math.floor(E * 255 * 3)
										)}, 0, 255)`}
										// color={`rgba(${E * 255}, 255, 255, ${E})`}
									/>
									{/* sphereBufferGeometry args: [radius, widthSegments, heightSegments] */}
									<sphereBufferGeometry
										attach='geometry'
										args={[E * E, 32, 32]}
									/>
								</mesh>
							)
					)
				)}

				<Gate active={mobile}>
					<DeviceOrientationControls camera={camera} />
				</Gate>
				<Gate active={!mobile}>
					<OrbitControls camera={camera} />
				</Gate>

				<pointLight position={[10, 10, 10]} />
				<ambientLight />
				<Gate>
					<mesh rotation={[rotation, rotation, 0]} position={[0, 0, 0]}>
						<meshStandardMaterial color='red' />
						<boxBufferGeometry attach='geometry' args={[0.5, 0.5, 0.5]} />
					</mesh>
				</Gate>
			</Canvas>
		</div>
	);
}

export default App;
