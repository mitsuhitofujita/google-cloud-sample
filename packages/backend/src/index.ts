import path from "node:path";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";

const server = fastify();

const port = Number(process.env.PORT) || 8080;

// Serve static files from the React build directory
server.register(fastifyStatic, {
	root: path.join(__dirname, "../../frontend/dist"),
	prefix: "/",
});

server.get("/ping", async (_request, _reply) => {
	return "pong\n";
});

server.listen({ port, host: "0.0.0.0" }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server listening at ${address}`);
});
