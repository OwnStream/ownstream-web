import {client} from "../api/api.ts";
import {useEffect, useState} from "react";
import type {Shelf} from "../api/types.ts";
import {NavLink} from "react-router-dom";
import {useAuth} from "../auth/AuthContext.tsx";

export default function Home() {
	const { user } = useAuth();
	const [shelves, setShelves] = useState<Shelf[]>([]);
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
		<div>
			<div>Currently logged in as <b>{user!.username}</b></div>
			<NavLink to={"/profiles"}>Profiles</NavLink>
			{shelves.map((shelf) => (
				<div key={shelf.type + "-" + shelf.title}>
					<b>{shelf.title}</b>
					<div>
						{shelf.items.map((item) => (
							<div key={item.id}>{item.title}</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}