export type Configuration = {
	transcode: TranscodeConfiguration
}

export type TranscodeConfiguration = {
	maxVideoStreams: number,
	videoPresets: VideoPreset[],
	audioPresets: AudioPreset[],
	audioLanguages: string[],
	subtitleLanguages: string[],
	copyFileToTmp: boolean,
	pixelFormatHandling: number
}

export type VideoPreset = {
	name: string,
	width: number,
	bitrate: number,
	codec: string
}

export type AudioPreset = {
	bitrate: number,
	channels: number,
	codec: string
}