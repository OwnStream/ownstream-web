import "./Home.css";
import {client} from "../api/api.ts";
import {useEffect, useState} from "react";
import type {Shelf as ApiShelf, ShelfItem} from "../api/types.ts";
import Shelf from "../components/Shelf";

export default function Home() {
	const [shelves, setShelves] = useState<ApiShelf[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const makeShelf = (title: string, type: string, items: ShelfItem[]): ApiShelf | null => {
		if (items.length === 0) return null;
		return {
			items,
			title,
			type,
			description: null,
			icon: null
		};
	}

	useEffect(() => {
		const loadShelves = async () => {
			try {
				setLoading(true);
				setError(null);
				const [nextUp, continueShelf, recent, recentMovie, recentTv] = await Promise.all([
					client.getHomeShelfById("nextUp"),
					client.getHomeShelfById("continue"),
					client.getHomeShelfById("recent"),
					client.getHomeShelfById("recentContent/movie"),
					client.getHomeShelfById("recentContent/tv"),
				]);
				const shelves: (ApiShelf | null)[] = [];
				shelves.push(makeShelf("Next Up", "nextUp", nextUp));
				shelves.push(makeShelf("Continue Watching", "continue", continueShelf));
				shelves.push(makeShelf("Recently Added", "recent", recent));
				shelves.push(makeShelf("Movies", "movie", recentMovie));
				shelves.push(makeShelf("TV Shows", "tv", recentTv));
				setShelves(shelves.filter(x => x !== null));
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