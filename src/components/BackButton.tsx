import "./BackButton.css"
import {NavLink, type To} from "react-router-dom";
import {ChevronLeft} from "react-feather";

export default function BackButton(props: { to: To }) {
	return (
		<NavLink to={props.to} className={"back-button"}>
			<ChevronLeft/> Back
		</NavLink>
	);
}