import {CheckboxInput, EnumInput, StringInput} from "./SharedInputs.tsx";
import {useEffect, useState} from "react";
import BackButton from "../../components/BackButton.tsx";
import {client} from "../../api/api.ts";
import {useNavigate} from "react-router-dom";
import {FolderPlusIcon} from "lucide-react";
import type {Library} from "../../api/types.ts";

export default function CreateWebhook() {
	const [name, setName] = useState('');
	const [authentication, setAuthentication] = useState('');
	const [libraries, setLibraries] = useState<Library[]>([]);
	const [libraryId, setLibraryId] = useState('');
	const [deleteOnConvert, setDeleteOnConvert] = useState(false);
	const [error, setError] = useState<string | undefined>(undefined);
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				const libraries = await client.getLibraries();
				setLibraries(libraries);
				setLibraryId(libraries[0].id);
			} catch (err) {
				setError("Failed to load libraries: " + err);
			}
		})();
	}, []);

	return (<>
		<BackButton to={"/serverSettings/webhooks"}/>
		<h2>Create Webhook</h2>
		<StringInput value={name} onChange={setName} label={"Name"}/>
		<StringInput value={authentication} onChange={setAuthentication} label={"Authentication"}/>
		<p className={"settingsInput-info"}>
			Value of the expected Authentication header. If left empty, anyone can send requests to this webhook
		</p>
		<CheckboxInput checked={deleteOnConvert} onChange={setDeleteOnConvert} label={"Delete media on import"}/>
		<p className={"settingsInput-info"}>
			Deletes the input files after OwnStream finishes transcoding & imports it into its own library.
		</p>
		<EnumInput value={libraryId} values={libraries.reduce((r, l) => {
			r[l.id] = l.name;
			return r;
		}, {} as Record<string, string>)} onChange={setLibraryId} label={"Library"}/>
		<p className={"settingsInput-info"}>
			Received media will be stored in this library.
		</p>
		{error && <p>Error: {error}</p>}
		<button onClick={async () => {
			setError(undefined);
			const result = await client.createWebhook(name, authentication, deleteOnConvert, libraryId);
			if (!result.success) {
				setError(result.message);
			} else navigate(`/serverSettings/webhooks/${result.data?.id}`);
		}} className={"settingsInput-button settingsInput-save"} disabled={libraries.length == 0 || libraryId == ''}>
			<FolderPlusIcon/>
			<span>Create Library</span>
		</button>
	</>);
}