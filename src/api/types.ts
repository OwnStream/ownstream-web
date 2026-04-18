export type Content = {
	id: string,
	type: string,
	originalTitle: string,
	translatedTitle: string | null,
	originalTagline: string,
	translatedTagline: string | null,
	originalDescription: string,
	translatedDescription: string | null,
	images: ContentImages,
	createdAt: string,
	updatedAt: string,
	releasedAt: string,
	lastAiredAt: string | null,
	seasonCount: number | null,
	episodeCount: number | null,
	videoCount: number | null,
	runtime: string | null,
	ageRatings: Record<string, string>,
	externalIds: Record<string, string>
}
export type ContentImages = {
	poster: string | null,
	banner: string | null,
	logo: string | null,
	backdrop: string | null,
	thumbnail: string | null,
}
export type Episode = {
	id: string,
	seasonNumber: number,
	episodeNumber: number,
	originalTitle: string,
	translatedTitle: string | null,
	originalSummary: string,
	translatedSummary: string,
	thumbnail: string,
	runtime: string,
	createdAt: string,
	updatedAt: string,
	releasedAt: string,
	videos: Video[],
	progress: number | null,
}
export type EpisodeToWatch = {
	continueWatching: Episode | null,
	progress: number | null,
	upNext: number | null
}
export type Job = {
	id: string,
	jobType: string,
	status: string,
	message: string | null,
	progress: number | null,
	progressMax: number | null,
	createdAt: string,
	startedAt: string | null,
	updatedAt: string | null,
	completedAt: string | null,
	relevantVideoId: string | null,
	relevantEpisodeId: string | null,
	relevantContentId: string | null,
	relevantLibraryId: string | null,
	relevantWebhookId: string | null
}
export type LoginResponse = {
	accessToken: string,
	message: string,
	success: boolean,
	username: string,
}
export type PagedResponse<T> = {
	items: T[],
	hasMore: boolean,
	count: number,
	pages: number
}
export type PreviewFile = {
	template: string,
	frameCount: number,
	rows: number,
	columns: number,
	period: number | null
}
export type Season = {
	index: number,
	episodeCount: number
}
export type ShelfItem = {
	type: string,
	id: string,
	episodeId: string | null,
	videoId: string | null,
	title: string,
	subtitle: string[],
	image: string | null,
	watchProgress: number | null,
}
export type Shelf = {
	title: string,
	type: string,
	description: string | null,
	icon: string | null,
	items: ShelfItem[]
}
export type SubtitleFile = {
	id: number,
	files: Record<string, string>,
	default: boolean,
	forced: boolean,
	language: string,
	title: string
}
export type User = {
	id: string,
	username: string,
	permissions: string[]
}
export type Video = {
	id: string,
	encodingSettings: string,
	width: number,
	height: number,
	fps: number,
	language: string,
	subtitles: SubtitleFile[] | null,
	previews: PreviewFile[] | null,
	episode: Episode | null,
	segments: VideoSegment[] | null
}
export type VideoSegment = {
	id: string,
	type: string,
	startMilliseconds: number,
	endMilliseconds: number,
	videoDuration: number
}
export type WatchProgress = {
	id: string,
	position: number,
	duration: number,
	wasMarkedAsWatched: boolean
}