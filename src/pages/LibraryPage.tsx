import "./LibraryPage.css";
import {useEffect, useState} from "react";
import type {Content, Library} from "../api/types.ts";
import {client} from "../api/api.ts";
import InfiniteScroll from "react-infinite-scroll-component";
import ShelfItem from "../components/ShelfItem.tsx";

export default function LibraryPage() {
	const [libraryId, setLibraryId] = useState<string | undefined>();
	const [filterType, setFilterType] = useState<"Movie" | "Tv" | undefined>();
	const [libraries, setLibraries] = useState<Library[]>([]);
	const [content, setContent] = useState<Content[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [page, setPage] = useState(0);
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
		setHasMore(true);
		setPage(0);
	}

	function toggleFilter(type: "Movie" | "Tv") {
		if (filterType == type) setFilterType(undefined);
		else setFilterType(type);
		setContent([]);
		setHasMore(true);
		setPage(0);
	}

	async function fetchMore() {
		try {
			const resp = await client.getLibraryContents(libraryId, filterType, page);
			setHasMore(resp.hasMore);
			setPage(prevPage => prevPage + 1);
			setContent(prevContent => [...prevContent, ...resp.items]);
		} catch (e) {
			console.error("Failed to load jobs", e);
			setError(e as Error)
		}
	}

	if (loading) return <div>Loading...</div>;

	return (<div className={"libraryPage"}>
		<div className={"libraryPills"}>
			<div tabIndex={0} className={`libraryPill ${filterType == "Movie" && "active"}`}
			     onClick={() => toggleFilter("Movie")}>
				Movies
			</div>
			<div tabIndex={0} className={`libraryPill ${filterType == "Tv" && "active"}`}
			     onClick={() => toggleFilter("Tv")}>
				TV Shows
			</div>
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

		<InfiniteScroll
			className={"libraryContents"}
			dataLength={content.length}
			next={fetchMore}
			hasMore={hasMore}
			loader={<p>Loading...</p>}
		>
			{content.map(content => (
				<ShelfItem key={content.id} item={{
					type: content.type.toLowerCase(),
					id: content.id,
					episodeId: null,
					videoId: null,
					title: content.translatedTitle || content.originalTitle,
					subtitle: [content.releasedAt.substring(0,4)],
					image: content.images.poster,
					watchProgress: null,
				}}/>
			))}
			{error && <div>{error.message}</div>}
		</InfiniteScroll>
	</div>)
}