import "./App.css";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {AuthProvider, useAuth} from "./auth/AuthContext.tsx";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SplashScreen from "./pages/SplashScreen.tsx";
import Profiles from "./pages/Profiles.tsx";

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
			<Route path="/login" element={<Login/>}/>
			<Route path="/profiles" element={<Profiles/>}/>
		</Routes>
	);
}

function ProtectedRoute({children}: { children: React.ReactNode }) {
	const {status} = useAuth();

	if (status === "loading") return <SplashScreen/>;
	if (status === "loggedOut") return <Navigate to="/profiles" replace/>;

	return <>{children}</>;
}