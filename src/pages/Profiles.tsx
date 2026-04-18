import {useNavigate} from "react-router-dom";
import {useAuth} from "../auth/AuthContext.tsx";
import Profile from "../components/Profile.tsx";

export default function Profiles() {
	const { accounts, switchAccount } = useAuth();
	const navigate = useNavigate();

	const doSwitch = async (id: string) => {
		try {
			await switchAccount(id)
			navigate("/", { replace: true });
		} catch (error) {
			console.error("Login failed:", error);
		}
	};

	return (<>
		{accounts.map((account) => (<Profile
			user={account.user}
			onClick={doSwitch}
		/>))}
		<button onClick={() => navigate("/login")}>Login</button>
	</>);
}