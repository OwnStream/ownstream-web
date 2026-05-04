import "./ItemList.css"
import {useEffect, useState} from "react";
import {client} from "../../api/api.ts";
import type {Library} from "../../api/types.ts";
import {NavLink, useNavigate} from "react-router-dom";
import {AddButton} from "./SharedInputs.tsx";
import {FolderIcon} from "lucide-react";

export default function LibrariesSettings() {
	const [libraries, setLibraries] = useState<Library[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigation = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setLibraries(await client.getLibraries());
			} catch (err) {
				setError("Failed to load libraries: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!libraries) return <div>libraries is null!</div>;

	return (<div>
		<h2>Libraries</h2>
		<AddButton onClick={() => {
			navigation("new")
		}}/>
		<div className={"itemList"}>
			{libraries.map(library => {
				return (
					<NavLink key={library.id} to={library.id} className={"itemRow"}>
						<FolderIcon/>
						<div className={"itemRow-info"}>
							<span className={"itemRow-title"}>{library.name}</span>
							<span className={"itemRow-description"}>{library.path}</span>
						</div>
					</NavLink>
				);
			})}
		</div>
	</div>)
}