import "./ShelfItem.css";
import type {ShelfItem} from "../api/types.ts";
import {useNavigate} from "react-router-dom";

type ShelfItemProps = {
	item: ShelfItem;
};

export default function ShelfItem({item}: ShelfItemProps) {
	const navigate = useNavigate();
	return (
		<div className={["shelfItem", item.type == "episode" ? "shelfItem-landscape" : "shelfItem-portrait"].join(" ")}
		     key={item.id + item.episodeId + item.videoId}
		onClick={() => {
			switch (item.type) {
				case "episode":
				case "video":
					navigate(`/watch/${item.videoId}`);
					break;
				case "tv":
				case "movie":
					navigate(`/content/${item.id}`);
					break;
			}
		}}>
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
		</div>
	)
}