import "./Shell.css";
import {NavLink, Outlet, useLocation, useNavigate} from "react-router-dom";
import FlexDivider from "../components/FlexDivider.tsx";
import {useAuth} from "../auth/AuthContext.tsx";
import UserIndicator from "../components/UserIndicator.tsx";
import type {ReactNode} from "react";
import {HomeIcon, LibraryIcon, SettingsIcon} from "lucide-react";

function NavButton({to, label, icon}: { to: string, label: string, icon: ReactNode }) {
	return (<NavLink className={"app-root__nav__link"} to={to}>{icon}<span>{label}</span></NavLink>);
}

export default function Shell() {
	const auth = useAuth();
	const user = auth.user;
	const navigate = useNavigate();
	const location = useLocation();
	const showNavigation = ["", "library", "serverSettings"].includes(location.pathname.split('/').slice(1)[0]);

	return (
		<div className={"app-root"}>
			<header className={"app-root__header"}>
				<div className={"app-root__header__logo"}>OwnStream</div>
				<FlexDivider/>
				<UserIndicator user={user} onClick={() => navigate("/profiles")}/>
			</header>
			{showNavigation &&
				<nav className={"app-root__nav"}>
					<NavButton to={"/"} label={"Home"} icon={<HomeIcon/>}/>
					<NavButton to={"/library"} label={"Library"} icon={<LibraryIcon/>}/>
					{auth.showSettings() &&
						<NavButton to={"/serverSettings"} label={"Settings"} icon={<SettingsIcon/>}/>}
				</nav>}
			<main className={`app-root__main ${showNavigation && "hasNav"}`}>
				<Outlet/>
			</main>
		</div>
	);
}