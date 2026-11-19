import "./Settings.css";
import {NavLink, Outlet} from "react-router-dom";
import {
	BlocksIcon,
	CpuIcon,
	FileVideoCameraIcon,
	FileVideoIcon,
	FolderIcon,
	FolderInputIcon,
	GpuIcon,
	UsersIcon,
	WebhookIcon
} from "lucide-react";
import {useAuth} from "../auth/AuthContext.tsx";
import type {ReactElement} from "react";


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
				{hasPermissions(["ReadSettings", "WriteSettings"]) && <PageLink to={"transcode"} icon={<FileVideoCameraIcon/>} label="Transcoding"/>}
				{hasPermissions(["Admin"]) && <PageLink to={"benchmark"} icon={<GpuIcon/>} label="Benchmark"/>}
				{hasPermissions(["ReadAllUsers", "WriteUsers"]) && <PageLink to={"users"} icon={<UsersIcon/>} label="Users"/>}
				{hasPermissions(["WriteLibraries"]) && <PageLink to={"libraries"} icon={<FolderIcon/>} label="Transcode Libraries"/>}
				{hasPermissions(["WriteLibraries"]) && <PageLink to={"inputLibraries"} icon={<FolderInputIcon/>} label="Input Libraries"/>}
				{hasPermissions(["ReadWebhooks", "WriteWebhooks"]) && <PageLink to={"webhooks"} icon={<WebhookIcon/>} label="Webhooks"/>}
				{hasPermissions(["ReadJobs", "WriteJobs"]) && <PageLink to={"jobs"} icon={<CpuIcon/>} label="Jobs"/>}
				{hasPermissions(["WriteVideos"]) && <PageLink to={"orphanVideos"} icon={<FileVideoIcon/>} label="Orphaned Videos"/>}
				{hasPermissions(["Admin"]) && <PageLink to={"plugins"} icon={<BlocksIcon/>} label="Plugins"/>}
			</div>
			<div className={"settingsItems"}>
				<Outlet/>
			</div>
		</div>
	);
}

function PageLink({to, icon, label}: {to: string, icon: ReactElement, label: string}) {
	return <NavLink to={to} className={"settingsCategory"}>{icon}<span>{label}</span></NavLink>
}