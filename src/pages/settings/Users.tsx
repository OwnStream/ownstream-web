import "./ItemList.css"
import {useEffect, useState} from "react";
import {client} from "../../api/api.ts";
import type {User} from "../../api/types.ts";
import {NavLink, useNavigate} from "react-router-dom";
import {AddButton} from "./SharedInputs.tsx";
import {UserIcon} from "lucide-react";

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
		<div className={"itemList"}>
			{users.map(user => {
				let permissions = user.permissions;
				if (permissions.length == 0)
					permissions = ["User"];
				if (permissions.includes("Owner"))
					permissions = ["Owner"];
				if (permissions.includes("Admin"))
					permissions = ["Admin"];
				return (
					<NavLink key={user.id} to={user.id} className={"itemRow"}>
						<UserIcon/>
						<div className={"itemRow-info"}>
							<span className={"itemRow-title"}>{user.username}</span>
							<span className={"itemRow-description"}>{permissions.join(", ")}</span>
						</div>
					</NavLink>
				);
			})}
		</div>
	</div>)
}