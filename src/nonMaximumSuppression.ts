import {
	SoundSourceLocalizationWithDate,
	SoundSourceLocalizationWithoutDate,
} from './types';

function indexOfMaximum(localizations: SoundSourceLocalizationWithoutDate[]) {
	let max = 0;
	let maxIndex = 0;
	for (let i = 0; i < localizations.length; i++) {
		if (localizations[i].E > max) {
			max = localizations[i].E;
			maxIndex = i;
		}
	}
	return maxIndex;
}

function suppressWithinRadius(
	origin: SoundSourceLocalizationWithDate,
	localizations: SoundSourceLocalizationWithDate[],
	radius: number
) {
	const survived = [];
	const suppressed = [];
	for (const localization of localizations) {
		const { x, y, z } = localization;
		const distance = Math.sqrt(
			(x - origin.x) ** 2 + (y - origin.y) ** 2 + (z - origin.z) ** 2
		);
		if (distance > radius) {
			survived.push(localization);
		} else {
			suppressed.push(localization);
		}
	}
	return { survived, suppressed };
}

export default function nonMaximumSuppression(
	localizations: SoundSourceLocalizationWithDate[],
	suppressionRadius: number
) {
	const filtered: SoundSourceLocalizationWithDate[] = [];
	while (localizations.length > 0) {
		const max = localizations[indexOfMaximum(localizations)];
		const { survived, suppressed } = suppressWithinRadius(
			max,
			localizations,
			suppressionRadius
		);
		localizations = survived;

		let latestDate = 0;
		for (const localization of suppressed) {
			if (localization.date > latestDate) {
				latestDate = localization.date;
			}
		}

		filtered.push({ ...max, date: latestDate });
	}
	return filtered;
}
