import "./MetadataEditor.css"
import {NavLink, Outlet, useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import type {Content, Episode, Library, Season} from "../../api/types.ts";
import {client} from "../../api/api.ts";
import {ClapperboardIcon, FolderIcon, ListVideoIcon, TvIcon, VideoIcon} from "lucide-react";

function LibraryNode({library, selectedLibraryId, selectedContentId, selectedSeasonIndex}: {
	library: Library,
	selectedLibraryId?: string,
	selectedContentId?: string,
	selectedSeasonIndex?: string
}) {
	const [contents, setContents] = useState<Content[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadContents = async () => {
		if (loaded || loading)
			return;

		try {
			setLoading(true);
			setError(null);

			const response = await client.getLibraryContents(library.id, undefined, 0, 100);
			setContents(response.items.toSorted((a, b) => a.originalTitle.localeCompare(b.originalTitle)));
			setLoaded(true);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	};

	const shouldOpen = selectedLibraryId === library.id;
	const detailsRef = useRef<HTMLDetailsElement>(null);
	useEffect(() => {
		if (shouldOpen) {
			loadContents();
			if (detailsRef.current)
				detailsRef.current.open = true
		}
	}, [shouldOpen, detailsRef, loadContents]);

	return (
		<details open={shouldOpen} onToggle={(event) => {
			if (event.currentTarget.open)
				loadContents();
		}} ref={detailsRef}>

			<summary className={"treeItem depth-1"}>
				<NavLink to={`/metadataEditor/${library.id}`}>
					<FolderIcon/> {library.name}
				</NavLink>
			</summary>

			{loading && <div>Loading...</div>}
			{error && <div className={"contentTree-error"}>{error}</div>}

			{contents.filter(x => !x.originalTitle.includes("Stranger")).map(content => (
				<ContentNode
					key={content.id}
					library={library}
					content={content}
					selectedContentId={selectedContentId}
					selectedSeasonIndex={selectedSeasonIndex}
				/>
			))}
		</details>
	);
}

function ContentNode({library, content, selectedContentId, selectedSeasonIndex}: {
	library: Library,
	content: Content,
	selectedContentId?: string,
	selectedSeasonIndex?: string
}) {
	const [seasons, setSeasons] = useState<Season[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadContents = async () => {
		if (loaded || loading)
			return;

		try {
			setLoading(true);
			setError(null);

			const response = await client.getContentSeasons(content.id);
			setSeasons(response);
			setLoaded(true);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	};

	const shouldOpen = selectedContentId === content.id && content.type != "Movie";
	const detailsRef = useRef<HTMLDetailsElement>(null);
	useEffect(() => {
		if (shouldOpen) {
			loadContents();
			if (detailsRef.current)
				detailsRef.current.open = true
		}
	}, [shouldOpen, detailsRef, loadContents]);

	if (content.type == "Movie") {
		return (
			<div className={"treeItem depth-2 treeItem-movie"}>
				<NavLink to={`/metadataEditor/${library.id}/${content.id}`}>
					<ClapperboardIcon/>
					{content.originalTitle}
				</NavLink>
			</div>
		);
	}
	return (
		<details open={shouldOpen} onToggle={(event) => {
			if (event.currentTarget.open)
				loadContents();
		}}>
			<summary className={"treeItem depth-2"}>
				<NavLink to={`/metadataEditor/${library.id}/${content.id}`}>
					<TvIcon/>
					{content.originalTitle}
				</NavLink>
			</summary>

			{loading && <div>Loading...</div>}
			{error && <div className={"contentTree-error"}>{error}</div>}

			{seasons.map(season => (
				<SeasonNode key={content.id} library={library} content={content} season={season}
							selectedContentId={selectedContentId}
							selectedSeasonIndex={selectedSeasonIndex ? Number.parseInt(selectedSeasonIndex) : undefined}/>
			))}
		</details>
	);
}

function SeasonNode({library, content, season, selectedContentId, selectedSeasonIndex}: {
	library: Library,
	content: Content,
	season: Season,
	selectedContentId?: string,
	selectedSeasonIndex?: number
}) {
	const [episodes, setEpisodes] = useState<Episode[]>([]);
	const [loaded, setLoaded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadContents = async () => {
		if (loaded || loading)
			return;

		try {
			setLoading(true);
			setError(null);

			const response = await client.getContentEpisodes(content.id, season.index);
			setEpisodes(response);
			setLoaded(true);
		} catch (e) {
			setError(String(e));
		} finally {
			setLoading(false);
		}
	};

	const shouldOpen = selectedContentId === content.id && selectedSeasonIndex === season.index;
	const detailsRef = useRef<HTMLDetailsElement>(null);
	useEffect(() => {
		if (shouldOpen) {
			loadContents();
			if (detailsRef.current)
				detailsRef.current.open = true
		}
	}, [shouldOpen, detailsRef, loadContents]);

	return (
		<details open={shouldOpen} onToggle={(event) => {
			if (event.currentTarget.open)
				loadContents();
		}}>
			<summary className={"treeItem depth-3"}>
				<NavLink to={`/metadataEditor/${library.id}/${content.id}/${season.index}`}>
					<ListVideoIcon/> Season {season.index}
				</NavLink>
			</summary>

			{loading && <div>Loading...</div>}
			{error && <div className={"contentTree-error"}>{error}</div>}

			{episodes.map(episode => (
				<div className={"treeItem depth-5"} key={episode.id}>
					<NavLink to={`/metadataEditor/${library.id}/${content.id}/${season.index}/${episode.id}`}>
						<VideoIcon/> {episode.episodeNumber}. {episode.originalTitle}
					</NavLink>
				</div>
			))}
		</details>
	);
}

export default function MetadataEditorPage() {
	const [libraries, setLibraries] = useState<Library[]>([]);
	const {
		library: selectedLibraryId,
		content: selectedContentId,
		season: selectedSeasonIndex
	} = useParams();

	useEffect(() => {
		let ignore = false;
		try {
			client.getContentLibraries().then(l => {
				if (!ignore)
					setLibraries(l);
			});
		} catch (e) {
			alert(e)
		}
		return () => {
			ignore = true;
		}
	}, []);

	return (
		<div className={"metadataEditor"}>
			<div className={"contentPane"}>
				<ul className={"contentTree"}>
					{libraries.map((library: Library) => (
						<LibraryNode
							library={library}
							key={library.id}
							selectedLibraryId={selectedLibraryId}
							selectedContentId={selectedContentId}
							selectedSeasonIndex={selectedSeasonIndex}
						/>
					))}
				</ul>
			</div>
			<div className={"editorPane"}>
				<Outlet/>
			</div>
		</div>);
}