import { DeviceOrientationControls, OrbitControls } from '@react-three/drei';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from 'react-three-fiber';
import { PerspectiveCamera } from 'three';
import './App.css';
import Gate from './Gate';
import Grid from './Grid';
import isMobileDevice from './isMobileDevice';
import nonMaximumSuppression from './nonMaximumSuppression';
import {
	SoundSourceLocalizationPacket,
	SoundSourceLocalizationWithDate,
} from './types';
import useOrientationPermissionState from './useOrientationPermissionState';
import useRollingArray from './useRollingArray';

const mobile = isMobileDevice();
const maxSoundSourceLocalizationEvents = 20;

function App() {
	const [camera] = useState(() => new PerspectiveCamera());

	const [ip, setIp] = useState<string>('');
	const websocketRef = useRef<WebSocket>();

	const localizations = useRollingArray<SoundSourceLocalizationWithDate>(
		maxSoundSourceLocalizationEvents
	);

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
				for (const src of json.src) {
					if (src.E * src.E > 0.1) {
						localizations.addItem({ date, ...src });
					}
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
	}, [ip, localizations]);

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

	const { orientationPermission, requestOrientation } =
		useOrientationPermissionState();

	const canvasRef = useRef<HTMLCanvasElement>(null);

	camera.fov = 135;
	camera.position.set(0, 0, 2);
	if (canvasRef.current) {
		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		camera.aspect = rect.width / rect.height;
		camera.updateProjectionMatrix();
	}

	const timestamps = localizations.items
		.filter(e => e !== null)
		.map(e => e!.date);

	const oldestTimestamp = Math.min(...timestamps);
	const newestTimestamp = Math.max(...timestamps);
	const elapsedTime = newestTimestamp - oldestTimestamp;
	const suppressedItems = nonMaximumSuppression(localizations.items, 0.2);

	return (
		<div className='App'>
			<div style={{ display: 'flex' }}>
				<input type='text' onChange={e => setIp(e.target.value)} />
				<button onClick={confirmIp}>Confirm IP</button>
			</div>
			<Gate active>
				{orientationPermission == null && (
					<button onClick={requestOrientation}>
						Request permission for orientation
					</button>
				)}
				<div id='orientation'>Orientation: Unknown</div>
			</Gate>
			<Canvas
				style={{ height: 600, backgroundColor: 'black' }}
				camera={camera}
				ref={canvasRef}
			>
				<Grid />

				{suppressedItems.map(
					({ x, y, z, E, date }, idx) =>
						E * E > 0.1 && (
							<mesh position={[x * 4, y * 4 - 0.5, 0]} key={idx}>
								<meshStandardMaterial
									transparent
									opacity={
										// Fade out the sound source after a certain amount of time
										(date - oldestTimestamp) / elapsedTime
									}
									color={`rgb(${Math.min(
										255,
										Math.floor(E * 255 * 3)
									)}, 0, 255)`}
								/>
								{/* sphereBufferGeometry args: [radius, widthSegments, heightSegments] */}
								<sphereBufferGeometry
									attach='geometry'
									args={[E * E, 32, 32]}
								/>
							</mesh>
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
