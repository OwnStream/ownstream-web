import "./ServerInaccessibleScreen.css";
import {useState} from "react";
import {useAuth} from "../auth/AuthContext.tsx";

export default function ServerInaccessibleScreen(){
	const [loading, setLoading] = useState(false);
	const auth = useAuth();

	const retryConnection = async () => {
		setLoading(true);
		try {
			await auth.retry();
		} catch (e) {
			// pause for a second
			await new Promise(resolve => setTimeout(resolve, 1000));
		} finally {
			setLoading(false);
		}
	};
	return (<div className={"server-error"}>
		<h1>Server Inaccessible</h1>
		<p>Failed to connect to your server. Make sure it's up and running.</p>
		<button onClick={retryConnection} disabled={loading}>Retry</button>
	</div>);
}