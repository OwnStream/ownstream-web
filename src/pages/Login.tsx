import "./Login.css";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../auth/AuthContext.tsx";

export default function Login() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = async () => {
		try {
			await login(username, password);
			navigate("/", { replace: true });
		} catch (error) {
			console.error("Login failed:", error);
		}
	};

	return (<div className={"login-container"}>
		<h1 className={"login-title"}>Log in</h1>
		<label className={"login-input"}>
			Username:
			<input
				type="text"
				id="username"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				required
			/>
		</label>
		<label className={"login-input"}>
			Password:
			<input
				type="password"
				id="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
			/>
		</label>
		<button onClick={handleSubmit} className={"login-submit"}>Login</button>
	</div>);
}