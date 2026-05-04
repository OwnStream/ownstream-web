import "./ItemList.css"
import {useEffect, useState} from "react";
import {client} from "../../api/api.ts";
import type {Webhook} from "../../api/types.ts";
import {NavLink, useNavigate} from "react-router-dom";
import {AddButton} from "./SharedInputs.tsx";
import {WebhookIcon} from "lucide-react";

export default function WebhooksSettings() {
	const [webhooks, setWebhooks] = useState<Webhook[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigation = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setWebhooks(await client.getWebhooks());
			} catch (err) {
				setError("Failed to load webhooks: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!webhooks) return <div>webhooks is null!</div>;

	return (<div>
		<h2>Webhooks</h2>
		<AddButton onClick={() => {
			navigation("new")
		}}/>
		<div className={"itemList"}>
			{webhooks.map(webhook => {
				return (
					<NavLink key={webhook.id} to={webhook.id} className={"itemRow"}>
						<WebhookIcon/>
						<div className={"itemRow-info"}>
							<span className={"itemRow-title"}>{webhook.name}</span>
						</div>
					</NavLink>
				);
			})}
		</div>
	</div>)
}