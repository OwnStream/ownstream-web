import "./ProgressBar.css"
import {EnumInput, StringInput} from "./SharedInputs.tsx";
import {useEffect, useState} from "react";
import BackButton from "../../components/BackButton.tsx";
import {client} from "../../api/api.ts";
import {useNavigate, useParams} from "react-router-dom";
import {FolderCheckIcon, RefreshCwIcon, Trash2Icon} from "lucide-react";
import type {InputLibrary} from "../../api/types.ts";

export default function EditInputLibrary() {
	const [inputLibrary, setInputLibrary] = useState<InputLibrary | null>(null);
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
				setInputLibrary(await client.getInputLibrary(params.id!));
			} catch (err) {
				setError("Failed to load inputLibrary info: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, [params.id]);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!inputLibrary) return <div>inputLibrary is null!</div>;

	return (<>
		<BackButton to={"/serverSettings/inputLibraries"}/>
		<h2>Edit Input Library</h2>
		<StringInput value={inputLibrary.name} onChange={v => setInputLibrary({...inputLibrary, name: v})}
		             label={"Name"}/>
		<EnumInput value={inputLibrary.type} onChange={v => setInputLibrary({...inputLibrary, type: v})}
		           label={"Type"}
		           values={{
					   "Tv": "TV Shows",
					   "Movie": "Movies"
				   }}/>
		<p>Path: <code>{inputLibrary.path}</code></p>
		<button onClick={async () => {
			await client.scanInputLibrary(inputLibrary.id);
			navigate("/serverSettings/jobs");
		}} className={"settingsInput-button settingsInput-save"}>
			<RefreshCwIcon/>
			<span>Rescan Input Library</span>
		</button>
		<button onClick={async () => {
			setInputLibrary(await client.modifyInputLibrary(inputLibrary.id, inputLibrary.name, inputLibrary.type, inputLibrary.transcodeLibraryId));
		}} className={"settingsInput-button settingsInput-save"}>
			<FolderCheckIcon/>
			<span>Update Input Library</span>
		</button>
		<button onClick={async () => {
			const result = await client.deleteInputLibrary(inputLibrary.id, false);
			if (!result.success) {
				setError(result.message ?? null);
			} else navigate(`/serverSettings/libraries`);
		}} className={"settingsInput-button settingsInput-delete"}>
			<Trash2Icon/>
			<span>Delete Input Library</span>
		</button>
	</>);
}