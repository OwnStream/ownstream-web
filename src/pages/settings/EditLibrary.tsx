import "./ProgressBar.css"
import {StringInput} from "./SharedInputs.tsx";
import {useEffect, useState} from "react";
import BackButton from "../../components/BackButton.tsx";
import {client} from "../../api/api.ts";
import {useNavigate, useParams} from "react-router-dom";
import {DatabaseBackupIcon, FolderCheckIcon, Trash2Icon} from "lucide-react";
import type {Library} from "../../api/types.ts";

export default function EditLibrary() {
	const [library, setLibrary] = useState<Library | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const params = useParams();

	if (!params.id) {
		navigate("/serverSettings/libraries");
	}

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setLibrary(await client.getLibrary(params.id!));
			} catch (err) {
				setError("Failed to load library info: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, [params.id]);

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
		<BackButton to={"/serverSettings/libraries"}/>
		<h2>Edit Library</h2>
		<StringInput value={library.name} onChange={v => setLibrary({...library, name: v})} label={"Name"}/>
		<p>Path: <code>{library.path}</code></p>
		<button onClick={async () => {
			setLibrary(await client.modifyLibrary(library.id, library.name));
		}} className={"settingsInput-button settingsInput-save"}>
			<FolderCheckIcon/>
			<span>Update Library</span>
		</button>
		<button onClick={async () => {
			const success = await client.recalculateLibrarySize(library.id);
			if (success.success)
				navigate("/serverSettings/jobs");
		}} className={"settingsInput-button settingsInput-save"}>
			<DatabaseBackupIcon/>
			<span>Recalculate File Sizes</span>
		</button>
		<button onClick={async () => {
			const result = await client.deleteLibrary(library.id, false);
			if (!result.success) {
				setError(result.message ?? null);
			} else navigate(`/serverSettings/libraries`);
		}} className={"settingsInput-button settingsInput-delete"}>
			<Trash2Icon/>
			<span>Delete Library</span>
		</button>
	{library.diskUsage && (<>
			<h3>Disk Usage</h3>
			<div>
				{formatBytes(library.diskUsage.used)} / {formatBytes(library.diskUsage.total)} used
				({formatBytes(library.diskUsage.available)} available)
			</div>
			<div className={"progressBar"}>
				<div className={"progressBar-bar"}
				     style={{width: (library.diskUsage.used / library.diskUsage.total * 100) + "%"}}></div>
			</div>
		</>
	)}
	</>);
}