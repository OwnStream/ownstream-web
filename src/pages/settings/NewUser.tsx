import {StringInput} from "./SharedInputs.tsx";
import {useState} from "react";
import BackButton from "../../components/BackButton.tsx";
import {UserPlus} from "react-feather";
import {client} from "../../api/api.ts";
import {useNavigate} from "react-router-dom";

export default function CreateUser() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const navigate = useNavigate();

	return (<>
		<BackButton to={"/serverSettings/users"}/>
		<h2>Create User</h2>
		<StringInput value={username} onChange={setUsername} label={"Username"}/>
		<StringInput value={password} onChange={setPassword} label={"Password"} type={"password"}/>
		<button onClick={async () => {
			const newUser = await client.createUser(username, password);
			navigate(`/serverSettings/users/${newUser.id}`);
		}} className={"settingsInput-button settingsInput-save"}>
			<UserPlus/>
			<span>Create User</span>
		</button>
	</>);
}