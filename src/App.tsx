import "./App.css";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {AuthProvider, useAuth} from "./auth/AuthContext.tsx";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SplashScreen from "./pages/SplashScreen.tsx";


export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<AppRoutes/>
			</BrowserRouter>
		</AuthProvider>
	);
}

function AppRoutes() {
	const {status} = useAuth();

	if (status === "loading") {
		return <SplashScreen/>;
	}

	return (
		<Routes>
			<Route
				path="/"
				element={
					<ProtectedRoute>
						<Home/>
					</ProtectedRoute>
				}
			/>
			<Route path="/login" element={<LoginRoute/>}/>
		</Routes>
	);
}

function ProtectedRoute({children}: { children: React.ReactNode }) {
	const {status} = useAuth();

	if (status === "loading") return <SplashScreen/>;
	if (status === "loggedOut") return <Navigate to="/login" replace/>;

	return <>{children}</>;
}

function LoginRoute() {
	const {status} = useAuth();

	if (status === "loading") return <SplashScreen/>;
	if (status === "loggedIn") return <Navigate to="/" replace/>;

	return <Login/>;
}