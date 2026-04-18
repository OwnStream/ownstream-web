import type {User} from "../api/types.ts";

type ProfileProps = {
	user: User;
	onClick: (id: string) => void;
};

export default function Profile({ user, onClick }: ProfileProps) {
	return (
		<div onClick={() => {onClick(user.id)}}>
			{user.username} - {user.permissions.join(", ")}
		</div>
	)
}