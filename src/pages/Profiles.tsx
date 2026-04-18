import "./Profiles.css";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../auth/AuthContext.tsx";
import Profile from "../components/Profile.tsx";

export default function Profiles() {
	const {accounts, switchAccount, removeAccount, user} = useAuth();
	const navigate = useNavigate();

	const doSwitch = async (id: string) => {
		console.log(`Switching to account ${id}`)
		try {
			await switchAccount(id)
			navigate("/", {replace: true});
		} catch (error) {
			console.error("Login failed:", error);
		}
	};

	const doRemove = async (id: string) => {
		console.log(`Removing account ${id}`)
		try {
			removeAccount(id);
		} catch (error) {
			console.error("Remove failed:", error);
		}
	};

	return (<>
		<div className={"profile-route"}>
			<div className={"profile-list"}>
				{accounts.map((account) => (<Profile
					key={account.user.id}
					selected={user?.id == account.user.id}
					user={account.user}
					select={doSwitch}
					remove={doRemove}
				/>))}
			</div>
			<button className={"login-button"} onClick={() => navigate("/login")}>
				Login
			</button>
		</div>
	</>);
}