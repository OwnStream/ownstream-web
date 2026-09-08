import "../settings/ProgressBar.css"
import {useEffect, useState} from "react";
import {client} from "../../api/api.ts";
import {useParams} from "react-router-dom";
import type {Content, Season} from "../../api/types.ts";

export default function MetadataEditorSeasonPage() {
	const [content, setContent] = useState<Content | null>(null);
	const [season, setSeason] = useState<Season | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const {contentId, seasonIndex} = useParams();

	useEffect(() => {
		if (!contentId) return;
		(async () => {
			try {
				setLoading(true);
				setContent(await client.getContentDetails(contentId));
				const seasons = await client.getContentSeasons(contentId);
				setSeason(seasons.filter(x => x.index.toString() == seasonIndex)[0]);
			} catch (err) {
				setError("Failed to load season info: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, [contentId, seasonIndex]);

	if (!contentId || !seasonIndex) {
		return <div>Invalid URL</div>
	}

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!season) return <div>library is null!</div>;

	return (<>
		<h2>Season Information</h2>
		<p><b>Content Name:</b> {content?.translatedTitle ?? content?.originalTitle}</p>
		<p><b>Season Index:</b> {season.index}</p>
		<p>Season metadata is not supported yet.</p>
	</>);
}