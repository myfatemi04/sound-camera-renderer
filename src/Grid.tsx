import { useRef, useLayoutEffect } from 'react';
import { Vector3 } from 'three';

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

export default function Grid() {
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
