import "./Shell.css";
import {NavLink, Outlet, useLocation} from "react-router-dom";
import FlexDivider from "../components/FlexDivider.tsx";
import {useAuth} from "../auth/AuthContext.tsx";
import UserIndicator from "../components/UserIndicator.tsx";
import {type ReactNode, useState} from "react";
import {HomeIcon, LibraryIcon, SettingsIcon} from "lucide-react";
import UserMenu from "../components/UserMenu.tsx";

function NavButton({to, label, icon}: { to: string, label: string, icon: ReactNode }) {
	return (<NavLink className={"app-root__nav__link"} to={to}>{icon}<span>{label}</span></NavLink>);
}

export default function Shell() {
	const auth = useAuth();
	const user = auth.user;
	const location = useLocation();
	const showNavigation = ["", "library", "serverSettings"].includes(location.pathname.split('/').slice(1)[0]);
	const [userMenuOpen, setUserMenuOpen] = useState(false);

	return (
		<div className={"app-root"}>
			<header className={"app-root__header"}>
				<div className={"app-root__header__logo"}>OwnStream</div>
				<FlexDivider/>
				<UserIndicator user={user} onClick={() => setUserMenuOpen(!userMenuOpen)}/>
				{userMenuOpen && <UserMenu setUserMenuOpen={setUserMenuOpen}
				                           profiles={auth.accounts.filter(x => x.user.id !== auth.user?.id).map(x => x.user)}
				                           currentProfile={auth.user}
				                           switchProfile={auth.switchAccount}/>}
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