import type {
	Content,
	Episode,
	EpisodeToWatch, InputLibrary,
	InstanceInfo,
	Job,
	Library,
	LoginResponse,
	PagedResponse,
	QuickLoginAuthorizeResponse,
	QuickLoginCheckResponse,
	QuickLoginSession,
	QuickLoginStartResponse,
	SearchResponse,
	Season,
	ShelfItem,
	SuccessResponse,
	User,
	Video,
	WatchProgress,
	Webhook
} from './types';
import type {Configuration} from "./configTypes.ts";

class ApiError implements Error {
	status: number;
	data: string | object;
	message: string;
	name: string;

	constructor(message: string, status: number, data: string | object) {
		this.message = message;
		this.name = "ApiError";
		this.status = status;
		this.data = data;
	}
}

// noinspection JSUnusedGlobalSymbols
class OwnStreamApiClient {
	baseUrl: string;
	token: string | null;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.replace(/\/+$/, '');
		this.token = null;
	}

	private async request<T>(url: string, body?: object, method?: string): Promise<T> {
		const headers: Record<string, string> = {};
		if (this.token) headers["Authorization"] = "Bearer " + this.token;
		if (body) headers["Content-Type"] = "application/json";
		const response = await fetch(`${this.baseUrl}/${url}`, {
			headers,
			method: method ? method : body ? "POST" : "GET",
			body: body ? JSON.stringify(body) : undefined,
		});
		if (response.status >= 200 && response.status < 300) {
			const r = await response.text()
			try {
				return JSON.parse(r);
			} catch (e) {
				return {} as T;
			}
		} else {
			const resp = await response.text();
			let data;
			try {
				data = JSON.parse(resp);
			} catch (e) {
				data = resp;
			}
			throw new ApiError(`[${response.status}] ${resp}`, response.status, data);
		}
	}

	setToken(token: string | null) {
		this.token = token;
	}

	async login(username: string, password: string): Promise<LoginResponse> {
		return await this.request<LoginResponse>("api/auth/login", {username, password});
	}

	async whoAmI(): Promise<User> {
		return await this.request<User>("api/auth/whoami");
	}

	async getInfo(): Promise<InstanceInfo> {
		return await this.request<InstanceInfo>("api/info");
	}

	async getHomeShelfById(id: string): Promise<ShelfItem[]> {
		return await this.request<ShelfItem[]>(`api/home/${id}`);
	}

	async getContentDetails(id: string): Promise<Content> {
		return await this.request<Content>(`api/content/${id}/details`);
	}

	async getContentSeasons(id: string): Promise<Season[]> {
		return await this.request<Season[]>(`api/content/${id}/seasons`);
	}

	async getContentEpisodes(id: string, season: number): Promise<Episode[]> {
		return await this.request<Episode[]>(`api/content/${id}/seasons/${season}/episodes`);
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

	async requeueJob(id: string): Promise<SuccessResponse<Job>> {
		return await this.request<SuccessResponse<Job>>(`api/jobs/${id}/requeue`);
	}

	async stopJob(id: string): Promise<SuccessResponse<Job>> {
		return await this.request<SuccessResponse<Job>>(`api/jobs/${id}/stop`);
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
		return await this.request<EpisodeToWatch>(`api/progress/upNext/${id}`);
	}

	async getConfig(): Promise<Configuration> {
		return await this.request<Configuration>(`api/settings/get`);
	}

	async updateConfig(config: Configuration): Promise<Configuration> {
		return await this.request<Configuration>(`api/settings/update`, config);
	}

	async benchmark(): Promise<void> {
		return await this.request<void>(`api/settings/benchmark`);
	}

	async getUsers(): Promise<User[]> {
		return await this.request<User[]>(`api/manage/users/list`);
	}

	async createUser(username: string, password: string): Promise<User> {
		return await this.request<User>(`api/manage/users/new`, {username, password});
	}

	async createSetupUser(username: string, password: string): Promise<User> {
		return await this.request<User>(`api/manage/users/setupNew`, {username, password});
	}

	async getUser(id: string): Promise<User> {
		return await this.request<User>(`api/manage/users/${id}`);
	}

	async modifyUser(id: string, username: string, password?: string, permissions?: string[]) {
		return await this.request<User>(`api/manage/users/${id}`, {username, password, permissions});
	}

	async deleteUser(id: string) {
		return await this.request<void>(`api/manage/users/${id}`, undefined, "DELETE");
	}

	async getLibraries(): Promise<Library[]> {
		return await this.request<Library[]>(`api/manage/libraries/list`);
	}

	async createLibrary(name: string, path: string): Promise<SuccessResponse<Library>> {
		return await this.request<SuccessResponse<Library>>(`api/manage/libraries/new`, {name, path});
	}

	async getLibrary(id: string): Promise<Library> {
		return await this.request<Library>(`api/manage/libraries/${id}`);
	}

	async modifyLibrary(id: string, name: string) {
		return await this.request<Library>(`api/manage/libraries/${id}`, {name}, "PATCH");
	}

	async deleteLibrary(id: string, deleteMedia: boolean = false): Promise<SuccessResponse<void>> {
		return await this.request<SuccessResponse<void>>(`api/manage/libraries/${id}?deleteMedia=${deleteMedia}`, undefined, "DELETE");
	}

	async getInputLibraries(): Promise<InputLibrary[]> {
		return await this.request<InputLibrary[]>(`api/manage/inputLibraries/list`);
	}

	async createInputLibrary(name: string, path: string, type: string, transcodeLibraryId: string): Promise<SuccessResponse<InputLibrary>> {
		return await this.request<SuccessResponse<InputLibrary>>(`api/manage/inputLibraries/new`, {name, path, type, transcodeLibraryId});
	}

	async getInputLibrary(id: string): Promise<InputLibrary> {
		return await this.request<InputLibrary>(`api/manage/inputLibraries/${id}`);
	}

	async scanInputLibrary(id: string): Promise<SuccessResponse<void>> {
		return await this.request<SuccessResponse<void>>(`api/manage/inputLibraries/${id}/scan`);
	}

	async modifyInputLibrary(id: string, name: string, type: string, transcodeLibraryId: string) {
		return await this.request<InputLibrary>(`api/manage/inputLibraries/${id}`, {name, type, transcodeLibraryId}, "PATCH");
	}

	async deleteInputLibrary(id: string, deleteMedia: boolean = false): Promise<SuccessResponse<void>> {
		return await this.request<SuccessResponse<void>>(`api/manage/inputLibraries/${id}?deleteMedia=${deleteMedia}`, undefined, "DELETE");
	}

	async getWebhooks(): Promise<Webhook[]> {
		return await this.request<Webhook[]>(`api/manage/webhooks/list`);
	}

	async createWebhook(name: string, authentication: string, deleteOnConvert: boolean, libraryId: string): Promise<SuccessResponse<Webhook>> {
		return await this.request<SuccessResponse<Webhook>>(`api/manage/webhooks/new`, {
			name,
			authentication,
			deleteOnConvert,
			libraryId
		});
	}

	async getWebhook(id: string): Promise<Webhook> {
		return await this.request<Webhook>(`api/manage/webhooks/${id}`);
	}

	async modifyWebhook(id: string, name?: string, authentication?: string, deleteOnConvert?: boolean, libraryId?: string): Promise<SuccessResponse<Webhook>> {
		return await this.request<SuccessResponse<Webhook>>(`api/manage/webhooks/${id}`, {
			name,
			authentication,
			deleteOnConvert,
			libraryId
		}, "PATCH");
	}

	async deleteWebhook(id: string): Promise<SuccessResponse<void>> {
		return await this.request<SuccessResponse<void>>(`api/manage/webhooks/${id}`, undefined, "DELETE");
	}

	async getOrphanVideos(): Promise<Video[]> {
		return await this.request<Video[]>(`api/video/orphaned`);
	}

	async getContentLibraries(): Promise<Library[]> {
		return await this.request<Library[]>(`api/content/library`);
	}

	async getLibraryContents(libraryId: string | undefined, contentType: "Movie" | "Tv" | undefined, page: number = 0, limit: number = 40): Promise<PagedResponse<Content>> {
		const query = new URLSearchParams();
		if (contentType)
			query.set("typeFilter", contentType);
		query.set("page", page.toString());
		query.set("limit", limit.toString());
		return await this.request<PagedResponse<Content>>(`api/content/library/${libraryId || "00000000-0000-0000-0000-000000000000"}?${query}`);
	}

	async quickLoginStart(deviceName: string = "OwnStream Web"): Promise<QuickLoginStartResponse> {
		const query = new URLSearchParams();
		query.set("deviceName", deviceName);
		return await this.request<QuickLoginStartResponse>(`api/auth/remote/start?${query}`);
	}

	async quickLoginCheck(token: string): Promise<QuickLoginCheckResponse> {
		const query = new URLSearchParams();
		query.set("token", token);
		return await this.request<QuickLoginCheckResponse>(`api/auth/remote/check?${query}`);
	}

	async quickLoginAuthorize(code: string, deviceNameHash?: string, asUser?: string): Promise<QuickLoginAuthorizeResponse> {
		const query = new URLSearchParams();
		query.set("code", code);
		if (deviceNameHash)
			query.set("deviceNameHash", deviceNameHash);
		if (asUser)
			query.set("asUser", asUser);
		return await this.request<QuickLoginAuthorizeResponse>(`api/auth/remote/authorize?${query}`);
	}

	async quickLoginSessions(): Promise<QuickLoginSession[]> {
		return await this.request<QuickLoginSession[]>(`api/auth/remote/sessions`);
	}

	async search(query: string, type: "all" | "content" | "movie" | "tv" | "episode" = "all", offset: number = 0, limit: number = 20, libraryId?: string): Promise<SearchResponse> {
		const q = new URLSearchParams();
		q.set("q", query);
		q.set("type", type);
		q.set("offset", offset.toString());
		q.set("limit", limit.toString());
		if (libraryId)
			q.set("libraryId", libraryId);
		return await this.request<SearchResponse>(`api/search?${q}`);
	}

	getMediaUrl(id: string, dir?: string, file: string = "master.m3u8"): string {
		if (dir)
			return `${this.baseUrl}/Media/${id}/${dir}/${file}`;
		else
			return `${this.baseUrl}/Media/${id}/${file}`;
	}
}

export {OwnStreamApiClient, ApiError};
// @ts-expect-error idk how to fix this one :(
export const client = new OwnStreamApiClient(window["instanceBase"] || "/");