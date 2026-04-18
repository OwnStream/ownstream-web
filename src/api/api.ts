import type {
	Content,
	Episode,
	EpisodeToWatch,
	Job,
	LoginResponse,
	PagedResponse,
	Season,
	Shelf,
	User,
	Video,
	WatchProgress
} from './types';

// noinspection JSUnusedGlobalSymbols
class OwnStreamApiClient {
	baseUrl: string;
	private token: string | null;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
		this.token = null;
	}

	private async request<T>(url: string, body: object | undefined = undefined): Promise<T> {
		const headers: Record<string, string> = {};
		if (this.token) headers["Authorization"] = "Bearer " + this.token;
		if (body) headers["Content-Type"] = "application/json";
		const response = await fetch(`${this.baseUrl}/${url}`, {
			headers,
			method: body ? "POST" : "GET",
			body: body ? JSON.stringify(body) : undefined,
		});
		if (response.status === 200) {
			return await response.json();
		} else {
			throw new Error(`[${response.statusText}] ${await response.text()}`);
		}
	}

	setToken(token: string) {
		this.token = token;
	}

	async login(username: string, password: string): Promise<LoginResponse> {
		return await this.request<LoginResponse>("api/auth/login", {username, password});
	}

	async whoAmI(): Promise<User> {
		return await this.request<User>("api/auth/whoami");
	}

	async getHomeShelves(): Promise<Shelf[]> {
		return await this.request<Shelf[]>("api/home/shelves");
	}

	async getContentDetails(id: string): Promise<Content> {
		return await this.request<Content>(`api/content/${id}/details`);
	}

	async getContentSeasons(id: string): Promise<Season[]> {
		return await this.request<Season[]>(`api/content/${id}/seasons`);
	}

	async getContentEpisodes(id: string, seasons: number): Promise<Episode[]> {
		return await this.request<Episode[]>(`api/content/${id}/seasons/${seasons}/episodes`);
	}

	async getEpisode(id: string): Promise<Episode> {
		return await this.request<Episode>(`api/episode/${id}`);
	}

	async getNextEpisode(id: string): Promise<Episode> {
		return await this.request<Episode>(`api/episode/${id}/next`);
	}

	async listJobs(delta: number = 0, page: number = 0, limit: number = 20): Promise<PagedResponse<Job>> {
		return await this.request<PagedResponse<Job>>(`api/jobs/list?delta=${delta}&page=${page}&limit=${limit}`);
	}

	async getVideo(id: string): Promise<Video> {
		return await this.request<Video>(`api/video/${id}`);
	}

	async updateWatchProgress(videoId: string, videoLength: number | null, watchedMilliseconds: number | null, markAsWatched: boolean | null): Promise<unknown> {
		return await this.request<unknown>(`api/progress/update`, {
			videoId,
			videoLength,
			watchedMilliseconds,
			markAsWatched
		});
	}

	async updateWatchProgressWithTime(videoId: string, videoLength: number, watchedMilliseconds: number): Promise<unknown> {
		return await this.updateWatchProgress(videoId, videoLength, watchedMilliseconds, null);
	}

	async updateWatchProgressAsWatched(videoId: string, markAsWatched: boolean): Promise<unknown> {
		return await this.updateWatchProgress(videoId, null, null, markAsWatched);
	}

	async getProgress(videoOrEpisodeId: string): Promise<WatchProgress> {
		return await this.request<WatchProgress>(`api/progress/${videoOrEpisodeId}`);
	}

	async upNext(id: string): Promise<EpisodeToWatch> {
		return await this.request<EpisodeToWatch>(`api/progress/${id}/upNext`);
	}
}

export {OwnStreamApiClient};