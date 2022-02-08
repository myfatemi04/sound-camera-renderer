import { useState, useCallback, useMemo } from 'react';

export default function useOrientationPermissionState() {
	const [orientationPermission, setOrientationPermission] =
		useState<'granted' | 'denied' | 'errored' | null>(null);

	const requestOrientation = useCallback(async () => {
		// DeviceOrientationEvent.requestPermission is an experimental feature that is only available
		// on iOS 14.5 and above.
		// @ts-ignore
		if (typeof DeviceOrientationEvent.requestPermission === 'function') {
			try {
				const permissionState =
					// @ts-ignore
					await DeviceOrientationEvent.requestPermission();

				setOrientationPermission(permissionState);
			} catch (e) {
				setOrientationPermission('denied');
			}
		}
	}, []);

	const value = useMemo(() => {
		return {
			orientationPermission,
			requestOrientation,
		};
	}, [orientationPermission, requestOrientation]);

	return value;
}
