import "./ItemList.css"
import {useEffect, useRef, useState} from "react";
import {client} from "../../api/api.ts";
import type {PluginItem} from "../../api/types.ts";
import {BlocksIcon, PlayIcon, PlusIcon, RefreshCwIcon, SquareIcon, TrashIcon} from "lucide-react";
import CircleButton from "../../components/CircleButton.tsx";

export default function ListPlugins() {
	const [plugins, setPlugins] = useState<PluginItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setPlugins(await client.listPlugins());
			} catch (err) {
				setError("Failed to load plugins: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!plugins) return <div>plugins is null!</div>;

	return (<div>
		<h2>Plugins</h2>
		<div>
			<input type={"file"} style={{visibility: "hidden"}} ref={inputRef} onChange={e => {
				const input = e.target;
				if (input.files?.length != 1) {
					alert("Please select a file!")
					return;
				}
				setLoading(true);
				const file = input.files!.item(0)!;
				file.arrayBuffer().then((buffer) => {
					const blob = new Blob([buffer], {type: "application/zip"});
					client.installPlugin(blob).then(p => {
						if (p.success) {
							const data = p.data!
							alert(`Installed ${data.name} (${data.version.name})`);
						} else {
							alert(p.message);
						}
						client.listPlugins().then(x => {
							setPlugins(x);
							setLoading(false);
						});
					});
				})
			}}/>
			<button onClick={() => {
				inputRef.current!.click();
			}} className={"settingsInput-button settingsInput-save"}>
				<PlusIcon/>
				<span>Install</span>
			</button>
		</div>
		<div className={"itemList"}>
			{plugins.sort((a,b) => a.id.localeCompare(b.id)).map(plugin => {
				return (
					<div key={plugin.id} className={"itemRow"}>
						<BlocksIcon/>
						<div className={"itemRow-info"}>
							<span className={"itemRow-title"}>{plugin.id}</span>
							<span className={"itemRow-description"}>{plugin.state} - {plugin.version}</span>
						</div>
						<div className={"itemRow-buttons"}>
							{plugin.state == "Loaded" ?
								<CircleButton icon={<RefreshCwIcon/>} tooltip={"Reload Plugin"} onClick={() => {
									setLoading(true);
									client.reloadPlugin(plugin.path).then(r => {
										if (!r.success) {
											alert(r.message)
										}
										client.listPlugins().then(x => {
											setPlugins(x);
											setLoading(false);
										});
									});
								}}/> :
								<CircleButton icon={<TrashIcon/>} tooltip={"Delete Plugin"} onClick={() => {
									setLoading(true);
									client.deletePlugin(plugin.path).then(r => {
										if (!r.success) {
											alert(r.message)
										}
										client.listPlugins().then(x => {
											setPlugins(x);
											setLoading(false);
										});
									});
								}}/>}
							{plugin.state == "Disabled" ?
								<CircleButton icon={<PlayIcon/>} tooltip={"Enable Plugin"} onClick={() => {
									setLoading(true);
									client.enablePlugin(plugin.path).then(r => {
										if (!r.success) {
											alert(r.message)
										}
										client.listPlugins().then(x => {
											setPlugins(x);
											setLoading(false);
										});
									});
								}}/> :
								<CircleButton icon={<SquareIcon/>} tooltip={"Disable Plugin"} onClick={() => {
									setLoading(true);
									client.disablePlugin(plugin.path).then(r => {
										if (!r.success) {
											alert(r.message)
										}
										client.listPlugins().then(x => {
											setPlugins(x);
											setLoading(false);
										});
									});
								}}/>}
						</div>
					</div>
				);
			})}
		</div>
	</div>)
}