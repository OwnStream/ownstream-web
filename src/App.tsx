import "./App.css";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {AuthProvider, useAuth} from "./auth/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SplashScreen from "./pages/SplashScreen";
import Profiles from "./pages/Profiles";
import Shell from "./layouts/Shell";
import type {ReactNode} from "react";

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
			<Route path="/login" element={<Login/>}/>
			<Route path="/splash" element={<SplashScreen/>}/>
			<Route path="/profiles" element={<Profiles/>}/>

			<Route
				element={
					<ProtectedRoute>
						<Shell/>
					</ProtectedRoute>
				}
			>
				<Route path="/" element={<Home/>}/>
			</Route>
		</Routes>
	);
}

function ProtectedRoute({children}: { children: ReactNode }) {
	const {status} = useAuth();

	if (status === "loading") return <SplashScreen/>;
	if (status === "loggedOut") return <Navigate to="/login" replace/>;

	return <>{children}</>;
}