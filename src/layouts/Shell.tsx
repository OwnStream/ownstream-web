import "./Shell.css";
import {NavLink, Outlet, useNavigate} from "react-router-dom";
import FlexDivider from "../components/FlexDivider.tsx";
import {useAuth} from "../auth/AuthContext.tsx";
import UserIndicator from "../components/UserIndicator.tsx";

export default function Shell() {
	const { user } = useAuth();
	const navigate = useNavigate();

	return (
		<div className={"app-root"}>
			<header className={"app-root__header"}>
				<div className={"app-root__header__logo"}>OwnStream</div>
				<span>&bull;</span>
				<NavLink to={"/"} className={"app-root__header__link"}>Home</NavLink>
				<NavLink to={"/library"} className={"app-root__header__link"}>Library</NavLink>
				<FlexDivider/>
				<UserIndicator user={user} onClick={() => {navigate("/profiles")}}/>
			</header>
			<main className={"app-root__main"}>
				<Outlet />
			</main>
		</div>
	);
}