import "./Settings.css";
import {Users, Video, Zap} from "react-feather";
import {NavLink, Outlet} from "react-router-dom";


export default function Settings() {
	return (
		<div className={"settingsPage"}>
			<div className={"settingsCategories"}>
				<NavLink to={"transcode"} className={"settingsCategory"}><Video/><span>Transcoding</span></NavLink>
				<NavLink to={"benchmark"} className={"settingsCategory"}><Zap/><span>Benchmark</span></NavLink>
				<NavLink to={"users"} className={"settingsCategory"}><Users/><span>Users</span></NavLink>
			</div>
			<div className={"settingsItems"}>
				<Outlet/>
			</div>
		</div>
	);
}