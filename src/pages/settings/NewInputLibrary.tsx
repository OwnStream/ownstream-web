import {EnumInput, StringInput} from "./SharedInputs.tsx";
import {useEffect, useState} from "react";
import BackButton from "../../components/BackButton.tsx";
import {client} from "../../api/api.ts";
import {useNavigate} from "react-router-dom";
import {FolderPlusIcon} from "lucide-react";
import type {Library} from "../../api/types.ts";

export default function CreateInputLibrary() {
	const [name, setName] = useState('');
	const [path, setPath] = useState('');
	const [type, setType] = useState('tv');
	const [transcodeLibraryId, setTranscodeLibraryId] = useState('');
	const [transcodeLibraries, setTranscodeLibraries] = useState<Library[]>([]);
	const [error, setError] = useState<string | undefined>(undefined);
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				const libraries = await client.getLibraries();
				setTranscodeLibraries(libraries);
				setTranscodeLibraryId(libraries[0].id)
			} catch (err) {
				setError("Failed to load transcode libraries: " + err);
			}
		})();
	}, []);

	return (<>
		<BackButton to={"/serverSettings/inputLibraries"}/>
		<h2>Create Input Library</h2>
		<StringInput value={name} onChange={setName} label={"Name"}/>
		<StringInput value={path} onChange={setPath} label={"Path"}/>
		<EnumInput value={type} onChange={setType} label={"Type"} values={{
			"tv": "TV Shows",
			"movie": "Movies"
		}}/>
		<EnumInput value={transcodeLibraryId} onChange={setTranscodeLibraryId} label={"Transcode Library"}
		           values={Object.fromEntries((transcodeLibraries || [{
					   id: "0",
					   name: "Loading..."
				   }]).map(x => [x.id, x.name]))}/>
		{error && <p>Error: {error}</p>}
		<button onClick={async () => {
			setError(undefined);
			const result = await client.createInputLibrary(name, path, type, transcodeLibraryId);
			if (!result.success) {
				setError(result.message);
			} else navigate(`/serverSettings/inputLibraries/${result.data?.id}`);
		}} className={"settingsInput-button settingsInput-save"}>
			<FolderPlusIcon/>
			<span>Create Library</span>
		</button>
	</>);
}