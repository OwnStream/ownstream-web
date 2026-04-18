import "./Home.css";
import {client} from "../api/api.ts";
import {useEffect, useState} from "react";
import type {Shelf as ApiShelf} from "../api/types.ts";
import Shelf from "../components/Shelf";

export default function Home() {
	const [shelves, setShelves] = useState<ApiShelf[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadShelves = async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await client.getHomeShelves();
				setShelves(data);
			} catch (err) {
				setError("Failed to load shelves: " + err);
			} finally {
				setLoading(false);
			}
		};

		loadShelves();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;

	return (
		<div className={"shelves-container"}>
			{shelves.map((shelf) => (
				<>
					<Shelf shelf={shelf}/>
				</>
			))}
		</div>
	);
}