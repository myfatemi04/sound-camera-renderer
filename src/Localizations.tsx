import nonMaximumSuppression from './nonMaximumSuppression';
import { SoundSourceLocalizationWithDate } from './types';

export default function Localizations({
	localizations,
}: {
	localizations: SoundSourceLocalizationWithDate[];
}) {
	const timestamps = localizations.filter(e => e !== null).map(e => e!.date);

	const oldestTimestamp = Math.min(...timestamps);
	const newestTimestamp = Math.max(...timestamps);
	const elapsedTime = newestTimestamp - oldestTimestamp;
	const suppressedItems = nonMaximumSuppression(localizations, 0);

	return (
		<>
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
								color={`rgb(${Math.min(255, Math.floor(E * 255 * 3))}, 0, 255)`}
							/>
							{/* sphereBufferGeometry args: [radius, widthSegments, heightSegments] */}
							<sphereBufferGeometry attach='geometry' args={[E * E, 32, 32]} />
						</mesh>
					)
			)}
		</>
	);
}
