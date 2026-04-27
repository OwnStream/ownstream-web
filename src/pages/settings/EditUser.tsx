import {CheckboxInput, DeleteButton, StringInput} from "./SharedInputs.tsx";
import {useEffect, useState} from "react";
import BackButton from "../../components/BackButton.tsx";
import {Save} from "react-feather";
import {client} from "../../api/api.ts";
import {useNavigate, useParams} from "react-router-dom";
import type {User} from "../../api/types.ts";

export default function EditUser() {
	const [user, setUser] = useState<User | null>(null);
	const [password, setPassword] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const params = useParams();

	if (!params.id) {
		navigate("/serverSettings/users");
	}

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				setUser(await client.getUser(params.id!));
			} catch (err) {
				setError("Failed to load shelves: " + err);
			} finally {
				setLoading(false);
			}
		})();
	}, [params.id]);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!user) return <div>user is null!</div>;

	return (<>
		<BackButton to={"/serverSettings/users"}/>
		<h2>Edit User</h2>
		<StringInput value={user.username} onChange={value => setUser({...user, username: value})} label={"Username"}/>
		<StringInput value={password} onChange={setPassword} label={"Change Password"} type={"password"}/>
		<p className={"settingsInput-info"}>Leave blank to leave the password as-is.</p>

		<h3>Permissions</h3>

		<CheckboxInput
			label={"Read Jobs"}
			checked={user.permissions.includes("ReadJobs") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "ReadJobs"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "ReadJobs")})
			}}/>
		<CheckboxInput
			label={"Write Jobs"}
			checked={user.permissions.includes("WriteJobs") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "WriteJobs"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "WriteJobs")})
			}}/>
		<CheckboxInput
			label={"Read Webhooks"}
			checked={user.permissions.includes("ReadWebhooks") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "ReadWebhooks"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "ReadWebhooks")})
			}}/>
		<CheckboxInput
			label={"Write Webhooks"}
			checked={user.permissions.includes("WriteWebhooks") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "WriteWebhooks"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "WriteWebhooks")})
			}}/>
		<CheckboxInput
			label={"Write Content"}
			checked={user.permissions.includes("WriteContent") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "WriteContent"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "WriteContent")})
			}}/>
		<CheckboxInput
			label={"Write Libraries"}
			checked={user.permissions.includes("WriteLibraries") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "WriteLibraries"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "WriteLibraries")})
			}}/>
		<CheckboxInput
			label={"Write Videos"}
			checked={user.permissions.includes("WriteVideos") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "WriteVideos"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "WriteVideos")})
			}}/>
		<CheckboxInput
			label={"Read All Users"}
			checked={user.permissions.includes("ReadAllUsers") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "ReadAllUsers"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "ReadAllUsers")})
			}}/>
		<CheckboxInput
			label={"Write Users"}
			checked={user.permissions.includes("WriteUsers") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "WriteUsers"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "WriteUsers")})
			}}/>
		<CheckboxInput
			label={"Read Settings"}
			checked={user.permissions.includes("ReadSettings") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "ReadSettings"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "ReadSettings")})
			}}/>
		<CheckboxInput
			label={"Write Settings"}
			checked={user.permissions.includes("WriteSettings") || user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "WriteSettings"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "WriteSettings")})
			}}/>
		<CheckboxInput
			label={"Admin"}
			checked={user.permissions.includes("Admin") || user.permissions.includes("Owner")}
			disabled={user.permissions.includes("Owner")}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "Admin"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "Admin")})
			}}/>
		<CheckboxInput
			label={"Owner"}
			checked={user.permissions.includes("Owner")}
			disabled={true}
			onChange={value => {
				if (value) setUser({...user, permissions: [...user.permissions, "Owner"]});
				else setUser({...user, permissions: user.permissions.filter(x => x !== "Owner")})
			}}/>

		<button onClick={async () => {
			setUser(await client.modifyUser(params.id!, user.username, password.length > 0 ? password : undefined, user.permissions));
		}} className={"settingsInput-button settingsInput-save"}>
			<Save/>
			<span>Save User</span>
		</button>

		<DeleteButton onClick={async () => {
			await client.deleteUser(params.id!);
			navigate("/serverSettings/users");
		}}/>
	</>);
}