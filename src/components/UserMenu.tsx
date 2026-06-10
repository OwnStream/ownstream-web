import "./UserMenu.css";
import type {QuickLoginAuthorizeResponse, User} from "../api/types.ts";
import {UserIcon} from "lucide-react";
import {NavLink} from "react-router-dom";
import {useState} from "react";
import {client} from "../api/api.ts";
import SparkMD5 from "spark-md5";

export interface UserMenuProps {
	setUserMenuOpen: (open: boolean) => void,
	profiles: User[],
	currentProfile?: User | null,
	switchProfile: (id: string) => Promise<void>,
}

function QuickLogin() {
	const [quickLoginState, setQuickLoginState] = useState<QuickLoginAuthorizeResponse | null>(null);
	const [code, setCode] = useState<string>("");
	const [errorMessage, setErrorMessage] = useState<string | null>("");

	const loginWithCode = async () => {
		setErrorMessage("");
		try {
			const newState = await client.quickLoginAuthorize(code);
			setQuickLoginState(newState);
			if (!newState.tokenValid)
				setErrorMessage("Invalid code");
		} catch (e) {
			setErrorMessage(e instanceof Error ? e.message : String(e));
		}
	};

	const authorizeLogin = async () => {
		setErrorMessage("");
		try {
			const hash = SparkMD5.hash(quickLoginState?.deviceName || "");
			const newState = await client.quickLoginAuthorize(code, hash);
			setQuickLoginState(newState);
			if (!newState.tokenValid)
				setErrorMessage("Invalid code");
		} catch (e) {
			setErrorMessage(e instanceof Error ? e.message : String(e));
		}
	};

	if (quickLoginState?.signedIn) {
		return <div className={"quickLogin"}>
			<div className={"quickLogin__text"}>Successfully signed in to <b>{quickLoginState.deviceName}</b>!</div>
			<button className={"authorize"} onClick={() => setQuickLoginState(null)}>Go back</button>
		</div>
	}

	if (quickLoginState?.deviceName != undefined) {
		return <div className={"quickLogin"}>
			<div className={"quickLogin__text"}>Sign in to <b>{quickLoginState.deviceName}</b>?</div>
			<button className={"authorize"} onClick={authorizeLogin}>Authorize</button>
			{errorMessage && <div className={"quickLogin__text error"}>{errorMessage}</div>}
		</div>
	}

	return <div className={"quickLogin"}>
		<input type={"text"} placeholder={"6-digit quick login code"} value={code}
		       onChange={(e) => setCode(e.target.value.replace(/\D/g, "").substring(0, 6))}/>
		<button className={"login"} onClick={loginWithCode}>Log in</button>
		{errorMessage && <div className={"quickLogin__text error"}>{errorMessage}</div>}
	</div>
}

export default function UserMenu(props: UserMenuProps) {
	const [quickLoginOpen, setQuickLoginOpen] = useState(false);

	return (<>
		<div className={"usermenu_bg"} onClick={() => props.setUserMenuOpen(false)}/>
		<div className={"app-root__header__usermenu"}>
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
			{!quickLoginOpen &&
				<button className={"usermenu__profiles__link"} onClick={() => setQuickLoginOpen(true)}>Quick
					Login</button>}
			{quickLoginOpen && <QuickLogin/>}
			<NavLink className={"usermenu__profiles__link"} to={"/preferences"}>User Settings</NavLink>
			<NavLink className={"usermenu__profiles__link"} to={"/login"}>Log into another profile</NavLink>
			<NavLink className={"usermenu__profiles__link"} to={"/logout"}>Log Out</NavLink>
		</div>
	</>);
}