import "./Settings.css";
import {Film, Link2, Users, Video, Zap} from "react-feather";
import {NavLink, Outlet} from "react-router-dom";


export default function Settings() {
	return (
		<div className={"settingsPage"}>
			<div className={"settingsCategories"}>
				<NavLink to={"transcode"} className={"settingsCategory"}><Video/><span>Transcoding</span></NavLink>
				<NavLink to={"benchmark"} className={"settingsCategory"}><Zap/><span>Benchmark</span></NavLink>
				<NavLink to={"users"} className={"settingsCategory"}><Users/><span>Users</span></NavLink>
				<NavLink to={"libraries"} className={"settingsCategory"}><Film/><span>Libraries</span></NavLink>
				<NavLink to={"webhooks"} className={"settingsCategory"}><Link2/><span>Webhooks</span></NavLink>
			</div>
			<div className={"settingsItems"}>
				<Outlet/>
			</div>
		</div>
	);
}