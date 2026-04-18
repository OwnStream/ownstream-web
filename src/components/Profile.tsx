import "./Profile.css";
import type {User} from "../api/types.ts";
import {Trash, User as UserIcon} from "react-feather";

type ProfileProps = {
	user: User;
	select: (id: string) => void;
	remove: (id: string) => void;
};

export default function Profile({user, select, remove}: ProfileProps) {
	return (
		<div onClick={() => {
			select(user.id)
		}} className={"profile"}>
			<div className={"profile-image"}>
				<UserIcon/>
			</div>
			<div className={"profile-username"}>{user.username}</div>
			<button className={"profile-delete"} onClick={(event) => {
				event.stopPropagation();
				remove(user.id);
			}}>
				<Trash/>
			</button>
		</div>
	)
}