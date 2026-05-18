import "./CircleButton.css"
import type {JSX} from "react";

export default function CircleButton({icon, tooltip, onClick}: {
	icon: JSX.Element,
	tooltip: string,
	onClick: () => void
}) {
	return (<button onClick={onClick} title={tooltip} className={"btn-circle"}>
		{icon}
	</button>);
}