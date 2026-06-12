import "./SearchPage.css";
import "./LibraryPage.css";
import ShelfItem from "../components/ShelfItem.tsx";
import {useEffect, useState} from "react";
import type {Library, SearchResult} from "../api/types.ts";
import {client} from "../api/api.ts";

export default function SearchPage() {
	const [libraryId, setLibraryId] = useState<string | undefined>();
	const [query, setQuery] = useState<string>("");
	const [filterType, setFilterType] = useState<"all" | "content" | "movie" | "tv" | "episode">("all");
	const [libraries, setLibraries] = useState<Library[]>([]);
	const [content, setContent] = useState<SearchResult[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		(async () => {
			setLibraries(await client.getContentLibraries());
			setLoading(false);
		})();
	}, []);

	function toggleLibrary(id: string) {
		if (libraryId == id) setLibraryId(undefined);
		else setLibraryId(id);
		setContent([]);
	}

	function toggleFilter(type: "all" | "content" | "movie" | "tv" | "episode") {
		if (filterType == type) setFilterType("all");
		else setFilterType(type);
		setContent([]);
	}

	useEffect(() => {
		(async () => {
			try {
				const resp = await client.search(query, filterType, 0, 50, libraryId);
				setContent(resp.results);
			} catch (e) {
				console.error("Failed to load jobs", e);
				setError(e as Error)
			}
		})();
	}, [query, libraryId, filterType]);

	const filterPill = (type: "all" | "content" | "movie" | "tv" | "episode", label: string) => {
		return (<div tabIndex={0} className={`libraryPill ${filterType == type && "active"}`}
		             onClick={() => toggleFilter(type)}>
			{label}
		</div>);
	};

	if (loading) return <div>Loading...</div>;

	return (<div className={"searchPage"}>
		<div className={"searchBar"}>
			<input className={"searchPage__input"} placeholder={"Search your media"} type={"text"} value={query} onChange={(e) => setQuery(e.target.value)}/>
		</div>

		<div className={"libraryPills"}>
			{filterPill("content", "All Content")}
			{filterPill("movie", "Movies")}
			{filterPill("tv", "TV Shows")}
			{filterPill("episode", "Episodes")}
			{libraries.length > 1 && (<>
				<div className={"vr"}/>
				{libraries.map((library) => (
					<div key={library.id} tabIndex={0} className={`libraryPill ${libraryId == library.id && "active"}`}
					     onClick={() => toggleLibrary(library.id)}>
						{library.name}
					</div>
				))}
			</>)}
		</div>

		<div className={"libraryContents shelfItem-forceCompact"}>
			{content.map(searchResult => (
				<ShelfItem key={`${searchResult.id}|${searchResult.contentId}`} item={{
					type: searchResult.kind.toLowerCase(),
					id: searchResult.id,
					episodeId: null,
					videoId: null,
					title: searchResult.kind == "episode" && searchResult.contentTitle ? searchResult.contentTitle : searchResult.translatedTitle || searchResult.title,
					subtitle: searchResult.kind == "episode" ? [`S: ${searchResult.season}  E: ${searchResult.episode}`, searchResult.translatedTitle || searchResult.title] : [],
					image: searchResult.images.thumbnail ?? searchResult.images.poster,
					watchProgress: null,
				}} forceLayout={"landscape"}
				           href={`/content/${searchResult.kind == "episode" ? searchResult.contentId : searchResult.id}`}/>
			))}
			{error && <div>{error.message}</div>}
		</div>
	</div>);
}