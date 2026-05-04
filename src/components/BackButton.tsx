import "./BackButton.css"
import {NavLink, type To} from "react-router-dom";
import {ChevronLeftIcon} from "lucide-react";

export default function BackButton(props: { to: To }) {
	return (
		<NavLink to={props.to} className={"back-button"}>
			<ChevronLeftIcon/> Back
		</NavLink>
	);
}