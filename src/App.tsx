import "./App.css";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {AuthProvider, useAuth} from "./auth/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SplashScreen from "./pages/SplashScreen";
import Profiles from "./pages/Profiles";
import Shell from "./layouts/Shell";
import type {ReactNode} from "react";
import Settings from "./pages/Settings.tsx";
import BenchmarkTab from "./pages/settings/Benchmark.tsx";
import TranscodingSettings from "./pages/settings/Transcoding.tsx";
import UsersSettings from "./pages/settings/Users.tsx";
import CreateUser from "./pages/settings/NewUser.tsx";
import EditUser from "./pages/settings/EditUser.tsx";
import WatchScreen from "./pages/WatchScreen.tsx";
import LibrariesSettings from "./pages/settings/Libraries.tsx";
import CreateLibrary from "./pages/settings/NewLibrary.tsx";
import EditLibrary from "./pages/settings/EditLibrary.tsx";
import WebhooksSettings from "./pages/settings/Webhooks.tsx";
import CreateWebhook from "./pages/settings/NewWebhook.tsx";
import EditWebhook from "./pages/settings/EditWebhook.tsx";
import JobsTab from "./pages/settings/Jobs.tsx";
import ContentPage from "./pages/Content.tsx";

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
				<Route path="/content/:contentId" element={<ContentPage/>}/>
				<Route path="/watch/:videoId" element={<WatchScreen/>}/>
				<Route path="/serverSettings" element={<Settings/>}>
					<Route path="transcode" element={<TranscodingSettings/>}/>
					<Route path="benchmark" element={<BenchmarkTab/>}/>
					<Route path="users" element={<UsersSettings/>}/>
					<Route path="users/new" element={<CreateUser/>}/>
					<Route path="users/:id" element={<EditUser/>}/>
					<Route path="libraries" element={<LibrariesSettings/>}/>
					<Route path="libraries/new" element={<CreateLibrary/>}/>
					<Route path="libraries/:id" element={<EditLibrary/>}/>
					<Route path="webhooks" element={<WebhooksSettings/>}/>
					<Route path="webhooks/new" element={<CreateWebhook/>}/>
					<Route path="webhooks/:id" element={<EditWebhook/>}/>
					<Route path="jobs" element={<JobsTab/>}/>
				</Route>
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