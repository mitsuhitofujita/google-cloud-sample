import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/Auth";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { user, isVerifying } = useAuth();

	if (isVerifying) {
		return <div>Loading...</div>;
	}

	if (!user) {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
}

export default ProtectedRoute;
