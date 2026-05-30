import "./SetupScreen.css";
import {useState} from "react";
import {client} from "../api/api.ts";
import {useAuth} from "../auth/AuthContext.tsx";
import {useNavigate} from "react-router-dom";

function StartScreen(props: { setStep: (step: number) => void }) {
	return (<>
		<h1>Welcome to OwnStream!</h1>
		<p>Let's get you set up.</p>
		<button onClick={() => props.setStep(1)}>Continue</button>
	</>);
}

function CreateAdminScreen(props: { setStep: (step: number) => void }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const auth = useAuth();

	const createAccount = async () => {
		try {
			await client.createSetupUser(username, password);
		} catch (e) {
			alert("Error creating setup account. Please check the instance logs.");
			return;
		}

		try {
			await auth.login(username, password);
		} catch (e) {
			alert("Error logging in as admin. Please check the instance logs.");
		}
		props.setStep(2);
	};

	return (<>
		<h1>Admin Account</h1>
		<p>Create the first account. Since this is the admin account, try to not share the credentials with others.</p>
		<input type={"text"} placeholder={"Username"} value={username}
		       onChange={(e) => setUsername(e.target.value)}/>
		<input type={"password"} placeholder={"Password"} value={password}
		       onChange={(e) => setPassword(e.target.value)}/>
		<button onClick={createAccount}>Create</button>
	</>);
}

function ReadyScreen() {
	const navigate = useNavigate();

	return (<>
		<h1>All set!</h1>
		<p>You can now head to the server settings to create your first library and start uploading your media.</p>
		<p>Enjoy using OwnStream!</p>
		<button onClick={() => navigate("/")}>Finish Setup</button>
	</>);
}

export default function SetupScreen() {
	const [step, setStep] = useState(0);
	const auth = useAuth();
	const navigate = useNavigate();
	if (auth.status !== "requireSetup") {
		navigate("/");
		return <></>;
	}
	let child = <></>;
	switch (step) {
		case 0:
			child = <StartScreen setStep={setStep}/>;
			break;
		case 1:
			child = <CreateAdminScreen setStep={setStep}/>;
			break;
		case 2:
			child = <ReadyScreen/>;
			break;
		default:
			setStep(0);
			break;
	}

	return (<div className={"setupScreen"}>
		<div className={"setupModal"}>
			{child}
		</div>
	</div>);
}