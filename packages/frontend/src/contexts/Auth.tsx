import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
	id: string;
	email: string;
	name: string;
	picture?: string;
}

interface AuthContextType {
	user: User | null;
	isVerifying: boolean;
	signIn: (userData: User) => void;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isVerifying, setIsVerifying] = useState(true);

	useEffect(() => {
		// Check if user is already authenticated on app load
		const verifyAuth = async () => {
			try {
				// Verify token with backend (cookie will be sent automatically)
				const response = await fetch("/api/auth/verify", {
					credentials: "include",
				});

				if (response.ok) {
					const userData = await response.json();
					// The backend returns the user object directly
					if (userData) {
						setUser(userData);
					}
				}
			} catch (error) {
				console.error("Auth verification failed:", error);
			} finally {
				setIsVerifying(false);
			}
		};

		verifyAuth();
	}, []);

	const signIn = (userData: User) => {
		setUser(userData);
	};

	const signOut = async () => {
		// Clear local state immediately for better UX
		setUser(null);

		// Call server sign out endpoint
		try {
			await fetch("/api/auth/sign-out", {
				method: "POST",
				credentials: "include",
			});
		} catch (error) {
			// Log error but don't throw - user is already signed out locally
			console.error("Server sign out error:", error);
		}
	};

	return (
		<AuthContext.Provider value={{ user, isVerifying, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
