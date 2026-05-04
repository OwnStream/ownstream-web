import "./UserIndicator.css";
import type {User} from "../api/types.ts";
import {UserIcon} from "lucide-react";

type UserIndicatorProps = {
	user: User | null;
	onClick?: () => void;
};

export default function UserIndicator({user, onClick}: UserIndicatorProps) {
	if (user == null) {
		return (
			<div className={"userIndicator"}>
				<div className={"userIndicator-image"}>
					<UserIcon/>
				</div>
			</div>
		)
	}
	return (
		<div onClick={onClick} className={"userIndicator"}>
			<div className={"userIndicator-image"}>
				<UserIcon/>
			</div>
			<div className={"userIndicator-username"}>{user.username}</div>
		</div>
	)
}