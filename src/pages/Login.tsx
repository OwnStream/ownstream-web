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

	return (<>
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
		<button onClick={handleSubmit}>Login</button>
	</>);
}