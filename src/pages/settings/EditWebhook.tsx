import "./ProgressBar.css"
import {CheckboxInput, EnumInput, StringInput} from "./SharedInputs.tsx";
import {useEffect, useState} from "react";
import BackButton from "../../components/BackButton.tsx";
import {client} from "../../api/api.ts";
import {useNavigate, useParams} from "react-router-dom";
import {FolderCheckIcon, Trash2Icon} from "lucide-react";
import type {Library, Webhook} from "../../api/types.ts";

export default function EditWebhook() {
	const [webhook, setWebhook] = useState<Webhook | null>(null);
	const [libraries, setLibraries] = useState<Library[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const params = useParams();

	if (!params.id) {
		navigate("/serverSettings/webhooks");
	}

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setWebhook(await client.getWebhook(params.id!));
				setLibraries(await client.getLibraries());
			} catch (err) {
				setError("Failed to load webhook: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, [params.id]);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!webhook) return <div>webhook is null!</div>;

	return (<>
		<BackButton to={"/serverSettings/webhooks"}/>
		<h2>Edit Webhook</h2>
		<StringInput value={webhook.name} onChange={v => setWebhook({...webhook, name: v})} label={"Name"}/>
		<EnumInput value={webhook.libraryId} values={libraries.reduce((r, l) => {
			r[l.id] = l.name;
			return r;
		}, {} as Record<string, string>)} onChange={v => setWebhook({...webhook, libraryId: v})} label={"Library"}/>
		<p className={"settingsInput-info"}>
			Received media will be stored in this library.
		</p>
		<CheckboxInput checked={webhook.deleteOnConvert} onChange={v => setWebhook({...webhook, deleteOnConvert: v})}
		               label={"Delete media on import"}/>
		<p className={"settingsInput-info"}>
			Deletes the input files after OwnStream finishes transcoding & imports it into its own library.
		</p>
		<button onClick={async () => {
			const res = await client.modifyWebhook(webhook.id, webhook.name, undefined, webhook.deleteOnConvert, webhook.id);
			if (!res.success) {
				setError(res.message ?? null);
			} else setWebhook(res.data ?? null);
		}} className={"settingsInput-button settingsInput-save"}>
			<FolderCheckIcon/>
			<span>Update Webhook</span>
		</button>
		<button onClick={async () => {
			const result = await client.deleteWebhook(webhook.id);
			if (!result.success) {
				setError(result.message ?? null);
			} else navigate(`/serverSettings/webhooks`);
		}} className={"settingsInput-button settingsInput-delete"}>
			<Trash2Icon/>
			<span>Delete Webhook</span>
		</button>
	</>);
}