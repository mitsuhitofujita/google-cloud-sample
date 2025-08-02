import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import jwtPlugin from "./plugins/jwt";
import authRoutes from "./routes/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = fastify({
	logger: {
		level: "info",
	},
});

// Get port from environment variable or use default
const port = Number(process.env.PORT) || 8080;

// Register CORS
server.register(fastifyCors, {
	origin: process.env.FRONTEND_URL || "http://localhost:8080",
	credentials: true,
});

// Register JWT plugin
server.register(jwtPlugin);

server.addHook("onSend", async (_request, reply) => {
	// Google OAuth用にCOOPヘッダーを削除または調整
	reply.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
	// または完全に削除
	// reply.removeHeader("Cross-Origin-Opener-Policy");
});

// Serve static files from the React build directory
server.register(fastifyStatic, {
	root: path.join(__dirname, "../../frontend/dist"),
	prefix: "/",
});

// API routes
server.get("/api/ping", async (_request, _reply) => {
	return "pong\n";
});

// Register auth routes
server.register(authRoutes, { prefix: "/api" });

// Serve the React app for all non-API routes
server.setNotFoundHandler(async (request, reply) => {
	if (request.url.startsWith("/api/")) {
		reply.code(404).send({
			message: `Route ${request.method}:${request.url} not found`,
			error: "Not Found",
			statusCode: 404,
		});
	} else {
		return reply.sendFile("index.html");
	}
});

server.listen({ port, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server listening at ${address}`);
});
