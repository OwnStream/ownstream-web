import {StringInput} from "./SharedInputs.tsx";
import {useState} from "react";
import BackButton from "../../components/BackButton.tsx";
import {client} from "../../api/api.ts";
import {useNavigate} from "react-router-dom";
import {FolderPlusIcon} from "lucide-react";

export default function CreateLibrary() {
	const [name, setName] = useState('');
	const [path, setPath] = useState('');
	const [error, setError] = useState<string | undefined>(undefined);
	const navigate = useNavigate();

	return (<>
		<BackButton to={"/serverSettings/libraries"}/>
		<h2>Create Library</h2>
		<StringInput value={name} onChange={setName} label={"Name"}/>
		<StringInput value={path} onChange={setPath} label={"Path"}/>
		{error && <p>Error: {error}</p>}
		<button onClick={async () => {
			setError(undefined);
			const result = await client.createLibrary(name, path);
			if (!result.success) {
				setError(result.message);
			} else navigate(`/serverSettings/libraries/${result.data?.id}`);
		}} className={"settingsInput-button settingsInput-save"}>
			<FolderPlusIcon/>
			<span>Create Library</span>
		</button>
	</>);
}