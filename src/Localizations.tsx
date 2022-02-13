import nonMaximumSuppression from './nonMaximumSuppression';
import { SoundSourceLocalizationWithDate } from './types';

function sigmoid(x: number) {
	return 1 / (1 + Math.exp(-x));
}

export default function Localizations({
	localizations,
}: {
	localizations: SoundSourceLocalizationWithDate[];
}) {
	const timestamps = localizations.filter(e => e !== null).map(e => e!.date);

	const oldestTimestamp = Math.min(...timestamps);
	const newestTimestamp = Math.max(...timestamps);
	const elapsedTime = newestTimestamp - oldestTimestamp;
	const suppressedItems = nonMaximumSuppression(localizations, 1);

	return (
		<>
			{suppressedItems.map(
				({ x, y, z, E, date }, idx) =>
					E * E > 0.02 && (
						<mesh position={[x * 2, y * 2, z * 2]} key={idx}>
							<meshStandardMaterial
								transparent
								opacity={
									// Fade out the sound source after a certain amount of time
									(date - oldestTimestamp) / elapsedTime
								}
								color={`rgb(${Math.min(255, Math.floor(E * 255 * 3))}, 0, 255)`}
							/>
							{/* sphereBufferGeometry args: [radius, widthSegments, heightSegments] */}
							<sphereBufferGeometry
								attach='geometry'
								args={[sigmoid(E - 0.5) * 0.15, 32, 32]}
							/>
						</mesh>
					)
			)}
		</>
	);
}
