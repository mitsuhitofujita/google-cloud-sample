import type { CredentialResponse } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/Auth";

function Home() {
	const { user, isVerifying, signIn, signOut } = useAuth();
	const navigate = useNavigate();

	const handleSignInSuccess = async (
		credentialResponse: CredentialResponse,
	) => {
		console.log("Credential Response:", credentialResponse);
		if (credentialResponse.credential) {
			try {
				const requestBody = {
					idToken: credentialResponse.credential,
				};
				console.log("Sending request to /auth/google with body:", requestBody);
				// Send ID token to backend for verification
				const response = await fetch("/api/auth/google", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						idToken: credentialResponse.credential,
					}),
				});
				console.log("Response status:", response.status);
				console.log("Response headers:", response.headers);

				if (!response.ok) {
					const responseText = await response.text();
					console.log("Response text:", responseText);
					throw new Error("Authentication failed");
				}

				const { user, token } = await response.json();

				// Store JWT token in localStorage
				localStorage.setItem("authToken", token);

				// Update auth context
				signIn(user);
				navigate("/dashboard");
			} catch (error) {
				console.error("Sign in error:", error);
				handleSignInError();
			}
		}
	};

	const handleSignInError = () => {
		console.error("Sign in failed");
		// Optionally show user-friendly error message
	};

	const handleSignOut = async () => {
		try {
			// Call sign out endpoint
			await fetch("/api/auth/sign-out", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("authToken")}`,
				},
			});

			// Clear local storage
			localStorage.removeItem("authToken");

			// Update auth context
			signOut();
		} catch (error) {
			console.error("Sign out error:", error);
		}
	};

	if (isVerifying) {
		return (
			<div>
				<h1>ホーム</h1>
				<p>検証中...</p>
			</div>
		);
	}

	return (
		<div>
			<h1>ホーム</h1>
			{user ? (
				<div>
					<p>名前: {user.name}</p>
					<p>メール: {user.email}</p>
					{user.picture && (
						<img
							src={user.picture}
							alt="Profile"
							style={{ width: 50, height: 50, borderRadius: "50%" }}
						/>
					)}
					<br />
					<button type="button" onClick={handleSignOut}>
						サインアウト
					</button>
					<br />
					<Link to="/dashboard">ダッシュボード</Link>
				</div>
			) : (
				<div>
					<p>サインインしてください</p>
					<GoogleLogin
						onSuccess={handleSignInSuccess}
						onError={handleSignInError}
					/>
				</div>
			)}
		</div>
	);
}

export default Home;
