import fastifyJwt from "@fastify/jwt";
import type {
	FastifyInstance,
	FastifyPluginOptions,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";
import type { JWTPayload } from "../types/index";

async function jwtPlugin(
	fastify: FastifyInstance,
	_options: FastifyPluginOptions,
) {
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		throw new Error("JWT_SECRET environment variable is required");
	}

	await fastify.register(fastifyJwt, {
		secret: jwtSecret,
		sign: {
			expiresIn: "7d",
		},
	});

	fastify.decorate(
		"authenticate",
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				// First try to get token from cookie
				const token = request.cookies?.authToken;
				if (token) {
					const decoded = fastify.jwt.verify(token) as JWTPayload;
					request.user = decoded.user;
				} else {
					// Fallback to Authorization header for backwards compatibility
					await request.jwtVerify();
				}
			} catch (_err) {
				reply.code(401).send({ error: "Unauthorized" });
			}
		},
	);
}

export default fp(jwtPlugin);
