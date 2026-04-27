import "./Users.css"
import {useEffect, useState} from "react";
import {client} from "../../api/api.ts";
import type {User} from "../../api/types.ts";
import {NavLink, useNavigate} from "react-router-dom";
import {User as UserIcon} from "react-feather";
import {AddButton} from "./SharedInputs.tsx";

export default function UsersSettings() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigation = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setUsers(await client.getUsers());
			} catch (err) {
				setError("Failed to load users: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!users) return <div>config is null!</div>;

	return (<div>
		<h2>Users</h2>
		<AddButton onClick={() => {navigation("new")}}/>
		<div className={"userList"}>
			{users.map(user => {
				let permissions = user.permissions;
				if (permissions.length == 0)
					permissions = ["User"];
				if (permissions.includes("Owner"))
					permissions = ["Owner"];
				if (permissions.includes("Admin"))
					permissions = ["Admin"];
				return (
					<NavLink key={user.id} to={user.id} className={"userRow"}>
						<UserIcon/>
						<div className={"userRow-info"}>
							<span className={"userRow-name"}>{user.username}</span>
							<span className={"userRow-permissions"}>{permissions.join(", ")}</span>
						</div>
					</NavLink>
				);
			})}
		</div>
	</div>)
}