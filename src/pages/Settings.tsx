import "./Settings.css";
import {NavLink, Outlet} from "react-router-dom";
import {CpuIcon, FileVideoCameraIcon, FolderIcon, GpuIcon, UsersIcon, WebhookIcon} from "lucide-react";


export default function Settings() {
	return (
		<div className={"settingsPage"}>
			<div className={"settingsCategories"}>
				<NavLink to={"transcode"} className={"settingsCategory"}><FileVideoCameraIcon/><span>Transcoding</span></NavLink>
				<NavLink to={"benchmark"} className={"settingsCategory"}><GpuIcon/><span>Benchmark</span></NavLink>
				<NavLink to={"users"} className={"settingsCategory"}><UsersIcon/><span>Users</span></NavLink>
				<NavLink to={"libraries"} className={"settingsCategory"}><FolderIcon/><span>Libraries</span></NavLink>
				<NavLink to={"webhooks"} className={"settingsCategory"}><WebhookIcon/><span>Webhooks</span></NavLink>
				<NavLink to={"jobs"} className={"settingsCategory"}><CpuIcon/><span>Jobs</span></NavLink>
			</div>
			<div className={"settingsItems"}>
				<Outlet/>
			</div>
		</div>
	);
}