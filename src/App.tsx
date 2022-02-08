import { DeviceOrientationControls, OrbitControls } from '@react-three/drei';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from 'react-three-fiber';
import { PerspectiveCamera } from 'three';
import './App.css';
import Gate from './Gate';
import Grid from './Grid';
import isMobileDevice from './isMobileDevice';

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
	const [camera] = useState(() => new PerspectiveCamera());

	const [ip, setIp] = useState<string>('');
	const websocketRef = useRef<WebSocket>();

	type SoundSourceLocalizationEvent = {
		localizations: SoundSourceLocation[];
		date: number;
	};

	const [soundSourceLocalizationEvents, setSoundSourceLocalizations] = useState<
		(SoundSourceLocalizationEvent | null)[]
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

				const energySquared = json.src.map(src => src.E * src.E);
				if (Math.max(...energySquared) > 0.1) {
					setSoundSourceLocalizationEventCounter(counter => {
						setSoundSourceLocalizations(localizations => {
							const clone = [...localizations];
							clone[counter] = { localizations: json.src, date };
							return clone;
						});
						return (counter + 1) % maxSoundSourceLocalizationEvents;
					});
				}
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

	// Orientation listener
	useEffect(() => {
		const listener = ({ alpha, beta, gamma }: DeviceOrientationEvent) => {
			const el = document.getElementById('orientation')!;
			if (alpha !== null) {
				el.innerHTML = `Orientation: ${alpha} ${beta} ${gamma}`;
			} else {
				el.innerHTML = `No orientation data available`;
			}
		};

		window.addEventListener('deviceorientation', listener);
		return () => {
			window.removeEventListener('deviceorientation', listener);
		};
	}, []);

	const [orientationPermission, setOrientationPermission] =
		useState<boolean | null>(null);

	const requestPermission = useCallback(async () => {
		// DeviceOrientationEvent.requestPermission is an experimental feature that is only available
		// on iOS 14.5 and above.
		// @ts-ignore
		if (typeof DeviceOrientationEvent.requestPermission === 'function') {
			try {
				const permissionState =
					// @ts-ignore
					await DeviceOrientationEvent.requestPermission();

				if (permissionState === 'granted') {
					setOrientationPermission(true);
				} else {
					// Denied
					const el = document.getElementById('error')!;
					el.innerHTML = `Orientation permission state: ${permissionState}`;
					setOrientationPermission(false);
				}
			} catch (e) {
				setOrientationPermission(false);
			}
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

	const timestamps = soundSourceLocalizationEvents
		.filter(e => e !== null)
		.map(e => e!.date);

	const oldestTimestamp = Math.min(...timestamps);
	const newestTimestamp = Math.max(...timestamps);
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
			</Canvas>
		</div>
	);
}

export default App;
