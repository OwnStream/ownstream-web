import "./Shelf.css";
import type {Shelf} from "../api/types.ts";
import ShelfItem from "./ShelfItem.tsx";

type ShelfProps = {
	shelf: Shelf;
};

export default function Shelf({shelf}: ShelfProps) {
	return (
		<div className={"shelf"} key={shelf.type + "-" + shelf.title}>
			<div className={"shelf-header"}>
				{shelf.icon ? (
					<div className={"shelf-header-icon"}>
						<img src={shelf.icon}/>
					</div>
				) : null}
				<div className={"shelf-header-text"}>
					<div className={"shelf-header-title"}>{shelf.title}</div>
					{shelf.description ? (<div className={"shelf-header-description"}>{shelf.description}</div>) : null}
				</div>
			</div>
			<div className={"shelf-items"}>
				{shelf.items.map((item) => (
					<ShelfItem item={item}/>
				))}
			</div>
		</div>
	)
}