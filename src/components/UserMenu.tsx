import "./UserMenu.css";
import type {User} from "../api/types.ts";
import {UserIcon} from "lucide-react";
import {NavLink} from "react-router-dom";

export interface UserMenuProps {
	userMenuOpen: boolean,
	setUserMenuOpen: (open: boolean) => void,
	profiles: User[],
	currentProfile?: User | null,
	switchProfile: (id: string) => Promise<void>,
}

export default function UserMenu(props: UserMenuProps) {
	if (!props.userMenuOpen) return (<></>);
	return <div className={"app-root__header__usermenu"}>
		{props.profiles.length > 0 &&
			<div className={"usermenu__profiles"}>
				{props.profiles.map(u =>
					<div className={"usermenu__profiles__item"} onClick={async () => {
						props.setUserMenuOpen(false);
						await props.switchProfile(u.id);
						window.location.reload();
					}}>
						<div className={"usermenu__profiles__item__image"}>
							<UserIcon/>
						</div>
						<div className={"usermenu__profiles__item__name"}>
							{u.username}
						</div>
					</div>
				)}
			</div>
		}
		<hr/>
		<NavLink className={"usermenu__profiles__link"} to={"/quickLogin"}>Quick Login</NavLink>
		<NavLink className={"usermenu__profiles__link"} to={"/preferences"}>User Settings</NavLink>
		<NavLink className={"usermenu__profiles__link"} to={"/login"}>Log into another profile</NavLink>
		<NavLink className={"usermenu__profiles__link"} to={"/logout"}>Log Out</NavLink>
	</div>
}