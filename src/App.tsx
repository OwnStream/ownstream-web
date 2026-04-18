import {useState} from 'react';
import {OwnStreamApiClient} from "./api/api.ts";
import './App.css'
import type {Shelf} from "./api/types.ts";

function App() {
	const client = new OwnStreamApiClient("http://localhost:5165");
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [shelves, setShelves] = useState<Shelf[]>([]);

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		try {
			const response = await client.login(username, password);
			if (response.success) {
				alert(`Logged in as ${response.username}`);
				client.setToken(response.accessToken);
			} else {
				alert(`Failed to log in ${response.message}`);
			}
		} catch (error) {
			console.error('Login failed:', error);
		}
	};

	const refreshShelves = async () => {
		setShelves(await client.getHomeShelves());
	};

	return (
		<>
			<form onSubmit={handleSubmit}>
				<label>
					Username:
					<input
						type="text"
						id="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</label>
				<label>
					Password:
					<input
						type="password"
						id="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</label>
				<button type="submit">Login</button>
			</form>

			<button onClick={refreshShelves}>Get shelves</button>
			<div>
				{shelves.map((shelf) => (
					<div>
						<b>{shelf.title}</b>
						<div>
							{shelf.items.map((item) => (
								<div>
									{item.title}
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</>
	)
}

export default App
