import "./Settings.css";
import {NavLink, Outlet} from "react-router-dom";
import {CpuIcon, FileVideoCameraIcon, FileVideoIcon, FolderIcon, GpuIcon, UsersIcon, WebhookIcon} from "lucide-react";
import {useAuth} from "../auth/AuthContext.tsx";


export default function Settings() {
	const {user} = useAuth();
	const hasPermissions = (perms: string[]) => {
		if (user?.permissions?.includes("Admin")) return true;
		let count = 0;
		for (const perm of perms) {
			if (user?.permissions?.includes(perm)) {
				count++;
			}
		}
		return count === perms.length;
	};

	return (
		<div className={"settingsPage"}>
			<div className={"settingsCategories"}>
				{hasPermissions(["ReadSettings", "WriteSettings"]) && <NavLink to={"transcode"} className={"settingsCategory"}><FileVideoCameraIcon/><span>Transcoding</span></NavLink>}
				{hasPermissions(["Admin"]) && <NavLink to={"benchmark"} className={"settingsCategory"}><GpuIcon/><span>Benchmark</span></NavLink>}
				{hasPermissions(["ReadAllUsers", "WriteUsers"]) && <NavLink to={"users"} className={"settingsCategory"}><UsersIcon/><span>Users</span></NavLink>}
				{hasPermissions(["WriteLibraries"]) && <NavLink to={"libraries"} className={"settingsCategory"}><FolderIcon/><span>Libraries</span></NavLink>}
				{hasPermissions(["ReadWebhooks", "WriteWebhooks"]) && <NavLink to={"webhooks"} className={"settingsCategory"}><WebhookIcon/><span>Webhooks</span></NavLink>}
				{hasPermissions(["ReadJobs", "WriteJobs"]) && <NavLink to={"jobs"} className={"settingsCategory"}><CpuIcon/><span>Jobs</span></NavLink>}
				{hasPermissions(["WriteVideos"]) && <NavLink to={"orphanVideos"} className={"settingsCategory"}><FileVideoIcon/><span>Orphaned Videos</span></NavLink>}
			</div>
			<div className={"settingsItems"}>
				<Outlet/>
			</div>
		</div>
	);
}