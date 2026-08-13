import "./ShelfItem.css";
import type {ShelfItem} from "../api/types.ts";
import {useNavigate, NavLink} from "react-router-dom";

type ShelfItemProps = {
	item: ShelfItem;
	forceLayout?: "portrait" | "landscape";
	href?: string;
};

export default function ShelfItem({item, forceLayout, href}: ShelfItemProps) {
	const navigate = useNavigate();
	let target = href;
	if (!target) {
		switch (item.type) {
			case "episode":
			case "video":
				target = `/watch/${item.videoId}`;
				break;
			case "tv":
			case "movie":
				target = `/content/${item.id}`;
				break;
		}
	}
	return (
		<NavLink tabIndex={0}
		     className={["shelfItem", forceLayout ? `shelfItem-${forceLayout}` : item.type == "episode" ? "shelfItem-landscape" : "shelfItem-portrait"].join(" ")}
		     key={item.id + item.episodeId + item.videoId}
		     to={target}>
			<div className={"shelfItem-thumbnail"}>
				{item.image && (<img src={item.image} alt={item.title}/>)}
				{item.watchProgress !== null && (<div className={"shelfItem-progress"}>
					<div style={{width: (item.watchProgress) + "%"}}/>
				</div>)}
			</div>
			<div className={"shelfItem-details"}>
				<div className={"shelfItem-title"}>{item.title}</div>
				<div className={"shelfItem-subtitle"}>{item.subtitle.map(s => (<span>{s}</span>))}</div>
			</div>
		</NavLink>
	)
}
