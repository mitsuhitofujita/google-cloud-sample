import { GoogleOAuthProvider } from "@react-oauth/google";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/Auth";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import "./App.css";

function App() {
	const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

	if (!clientId) {
		return (
			<div>
				Error: VITE_GOOGLE_CLIENT_ID is not set in environment variables
			</div>
		);
	}
	console.log("Current Origin:", window.location.origin);
	console.log("Google Client ID:", clientId);

	return (
		<GoogleOAuthProvider clientId={clientId}>
			<AuthProvider>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>
				</Routes>
			</AuthProvider>
		</GoogleOAuthProvider>
	);
}

export default App;
