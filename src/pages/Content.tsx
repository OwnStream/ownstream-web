import "./Content.css"
import {NavLink, useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import type {Content, Episode, EpisodeToWatch, Season, ShelfItem} from "../api/types.ts";
import {client} from "../api/api.ts";
import Shelf from "../components/Shelf.tsx";

export default function ContentPage() {
	const {contentId} = useParams();
	const [content, setContent] = useState<Content | null>(null);
	const [upNext, setUpNext] = useState<EpisodeToWatch | null>(null);
	const [seasons, setSeasons] = useState<Season[]>([]);
	const [seasonEpisodes, setSeasonEpisodes] = useState<Record<number, Episode[]>>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	// Load content
	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				const c = await client.getContentDetails(contentId!);
				const un = await client.upNext(c.id);
				const s = c.type == "Tv" ? await client.getContentSeasons(c.id) : [];
				setContent(c);
				setUpNext(un);
				setSeasons(s);
			} catch (e) {
				setError(e as Error);
			} finally {
				setLoading(false);
			}
		})();
	}, [contentId]);

	// Load episodes
	useEffect(() => {
		if (content == null) return;
		if (content.type == "Movie") return;
		(async () => {
			const episodes: Record<number, Episode[]> = {};
			for (const s of seasons) {
				try {
					episodes[s.index] = await client.getContentEpisodes(content.id, s.index);
				} catch (e) {
					console.error(`Failed to load episodes for season ${s.index}`, e);
				}
			}
			setSeasonEpisodes(episodes);
		})();
	}, [seasons, content]);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error.message}</div>;
	if (content == null) return <div>content is null!</div>;

	const title = content.translatedTitle === content.originalTitle ? content.originalTitle
		: content.translatedTitle || content.originalTitle;
	const subtitle = content.translatedTitle !== content.originalTitle && content.translatedTitle != null
		? content.originalTitle : null;
	const description = content.translatedDescription || content.originalDescription;
	const year = content.type == "Movie" ? content.releasedAt.substring(0, 4) : `${content.releasedAt.substring(0, 4)}–${content.lastAiredAt?.substring(0, 4)}`;
	const tagline = content.translatedTagline || content.translatedTagline;

	const episode = upNext?.continueWatching || upNext?.upNext;
	const video = episode?.videos?.length ? episode?.videos[0] : null;
	const isContinue = upNext?.continueWatching != null;

	return <div className={`contentPage ${content.type.toLowerCase()}`}>
		{content.images.backdrop && <img className={"backdrop"} src={content.images.backdrop} alt={"Backdrop"}/>}
		<div className={"contentPage-info"}>
			<img className={"contentPage-poster"} alt={`Poster for ${title}`} src={content.images.poster ?? ""}/>
			<div className={"contentPage-strip"}>
				{!episode && <a>Video unavailable</a>}
				{video && episode &&
					<NavLink to={`/watch/${video.id}`}>{isContinue ? "Continue Watching" : "Watch"}
						{content.type == "Movie" ? <></> : (<><br/>S{episode.seasonNumber} E{episode.episodeNumber}</>)}
					</NavLink>}
				{Object.entries(content.externalIds)
					.map(([type, id]) => {
							switch (type) {
								case "imdb":
									return (<a href={`https://imdb.com/title/${id}/`}>Open in: iMDB</a>);
								case "tmdb":
									return (
										<a href={`https://www.themoviedb.org/${content.type == "Movie" ? "movie" : "tv"}/${id}`}>Open
											in: TMDB</a>);
								case "tvdb":
									return (
										<a href={`https://www.thetvdb.com/dereferrer/${content.type == "Movie" ? "movie" : "series"}/${id}`}>Open
											in: The TVDB</a>);
								case "tvMaze":
									return (<a href={`https://www.tvmaze.com/shows/${id}/_`}>Open in: TVmaze</a>);
								default:
									return (<></>);
							}
						}
					)}
			</div>
			<div className={"contentPage-meta"}>
				<h1 className={"title"}>{title} ({year})</h1>
				{subtitle && <div className={"subtitle"}>{subtitle}</div>}
				<div className={"tagline"}>{tagline}</div>
				<p className={"description"}>{description}</p>
				<table>
					<tbody>
					<tr>
						<td>Created at</td>
						<td>{content.createdAt}</td>
					</tr>
					<tr>
						<td>Updated at</td>
						<td>{content.updatedAt}</td>
					</tr>
					<tr>
						<td>Released at</td>
						<td>{content.releasedAt}</td>
					</tr>
					{content.type == "Tv" && <tr>
						<td>Last episode aired at</td>
						<td>{content.lastAiredAt}</td>
					</tr>}
					{content.type == "Tv" && <tr>
						<td>Seasons</td>
						<td>{content.seasonCount}</td>
					</tr>}
					{content.type == "Tv" && <tr>
						<td>Episodes</td>
						<td>{content.episodeCount}</td>
					</tr>}
					{content.type == "Movie" && <tr>
						<td>Runtime</td>
						<td>{content.runtime}</td>
					</tr>}
					</tbody>
				</table>
			</div>
		</div>
		{Object.entries(seasonEpisodes).map(([index, episodes]) =>
			(<Shelf shelf={{
				title: `Season ${index}`,
				description: null,
				icon: null,
				type: "season",
				items: episodes.map(e => ({
					id: content.id,
					episodeId: e.id,
					videoId: e.videos.length > 0 ? e.videos[0].id : null,
					type: "episode",
					title: `E ${e.episodeNumber}: ${e.translatedTitle || e.originalTitle}`,
					subtitle: [e.runtime, e.translatedSummary || e.originalSummary].filter(x => x?.length > 0),
					image: e.thumbnail,
					watchProgress: e.progress
				} as ShelfItem))
			}}/>)
		)}
	</div>;
}