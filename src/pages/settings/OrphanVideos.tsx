import "./VideoGrid.css"
import {useEffect, useState} from "react";
import {client} from "../../api/api.ts";
import type {Video} from "../../api/types.ts";
import CircleButton from "../../components/CircleButton.tsx";
import {PlayIcon} from "lucide-react";
import {NavLink} from "react-router-dom";

export default function OrphanVideos() {
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setVideos(await client.getOrphanVideos());
			} catch (err) {
				setError("Failed to load orphan videos: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!videos) return <div>videos is null!</div>;

	return (<div>
		<h2>Orphaned Videos</h2>
		<p>
			These are videos that have no parent movie/episode attached to them. It's usually OK to delete these.<br/>As
			they do not have any parent content, it is not possible to show any metadata about them, other than the
			preview file.
		</p>
		<div className={"videoList"}>
			{videos.map(video => {
				const thumbnailFile = video.previewFiles?.find(f => f.template === "small.png");

				return (
					<div key={video.id} className={"videoList-item"}>
						<div className={"videoList-item-thumbnail"}>
							{thumbnailFile ?
								<img src={client.getMediaUrl(video.id, "trickplay", thumbnailFile.template)}/>
								: "No thumbnail available."}
						</div>
						<div className={"videoList-item-info"}>
							<div className={"videoList-item-meta"}>
								<div className={"videoList-item-title"}>ID: {video.id}</div>
								<div className={"videoList-item-subtitle"}>{video.width}x{video.height} @ {video.fps} FPS</div>
							</div>
							<div className={"videoList-item-buttons"}>
								<NavLink to={`/watch/${video.id}`}><CircleButton icon={<PlayIcon/>} tooltip={"Watch Video"} onClick={() => {}}/></NavLink>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	</div>)
}