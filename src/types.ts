export type SoundSourceLocalizationWithoutDate = {
	x: number;
	y: number;
	z: number;
	E: number;
};

export type SoundSourceLocalizationWithDate =
	SoundSourceLocalizationWithoutDate & { date: number };

export type SoundSourceLocalizationPacket = {
	timeStamp: number;
	src: SoundSourceLocalizationWithoutDate[];
};

export type SoundSourceLocalizationEvent = {
	localizations: SoundSourceLocalizationWithoutDate[];
	date: number;
};
