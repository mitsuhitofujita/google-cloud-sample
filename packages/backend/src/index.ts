import path from "node:path";
import fastifyCookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import corsPlugin from "./plugins/cors";
import jwtPlugin from "./plugins/jwt";
import authRoutes from "./routes/auth";

const server = fastify({
	logger: {
		level: "info",
	},
});

// Get port from environment variable or use default
const port = Number(process.env.PORT) || 8080;

// Register Cookie plugin
server.register(fastifyCookie);

// Register CORS
server.register(corsPlugin);

// Register JWT plugin
server.register(jwtPlugin);

server.addHook("onSend", async (_request, reply) => {
	// Google OAuth用にCOOPヘッダーを削除または調整
	reply.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
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
		server.log.error(err);
		process.exit(1);
	}
	server.log.info(`Server listening at ${address}`);
});
