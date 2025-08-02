import { Link } from "react-router-dom";

function Dashboard() {
	return (
		<div>
			<h1>Dashboard</h1>
			<p>This is the dashboard page!</p>
			<Link to="/">Go to Home</Link>
		</div>
	);
}

export default Dashboard;
