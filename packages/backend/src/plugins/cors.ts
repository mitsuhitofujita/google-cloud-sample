import fastifyCors from "@fastify/cors";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import fp from "fastify-plugin";

async function corsPlugin(
	fastify: FastifyInstance,
	_options: FastifyPluginOptions,
) {
	// Register CORS
	const corsOrigin =
		process.env.NODE_ENV === "production"
			? true // Allow same origin in production
			: process.env.FRONTEND_URL || "http://localhost:8080";

	await fastify.register(fastifyCors, {
		origin: corsOrigin,
		credentials: true,
	});
}

export default fp(corsPlugin);
