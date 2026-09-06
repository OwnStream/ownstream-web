import "../settings/ProgressBar.css"
import {useEffect, useState} from "react";
import {client} from "../../api/api.ts";
import {useParams} from "react-router-dom";
import type {Library} from "../../api/types.ts";

export default function MetadataEditorLibraryPage() {
	const [library, setLibrary] = useState<Library | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const {libraryId} = useParams();

	useEffect(() => {
		if (!libraryId) return;
		(async () => {
			try {
				setLoading(true);
				setLibrary(await client.getLibrary(libraryId!));
			} catch (err) {
				setError("Failed to load library info: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, [libraryId]);

	if (!libraryId) {
		return <div>Invalid URL</div>
	}

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!library) return <div>library is null!</div>;

	function formatBytes(bytes: number, decimals = 2) {
		if (!+bytes) return '0 Bytes'

		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

		const i = Math.floor(Math.log(bytes) / Math.log(k))

		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
	}

	return (<>
		<h2>Library Information</h2>
		<p><b>Name:</b> {library.name}</p>
		<p><b>Path:</b> <code>{library.path}</code></p>
		{library.diskUsage && (<>
				<h3>Disk Usage</h3>
				<div>
					{formatBytes(library.diskUsage.used)} / {formatBytes(library.diskUsage.total)} used
					({formatBytes(library.diskUsage.available)} available)
				</div>
				<div className={"progressBar"} style={{maxWidth: "700px"}}>
					<div className={"progressBar-bar"}
						 style={{width: (library.diskUsage.used / library.diskUsage.total * 100) + "%"}}></div>
				</div>
			</>
		)}
	</>);
}