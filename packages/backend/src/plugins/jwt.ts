import fastifyJwt from "@fastify/jwt";
import type {
	FastifyInstance,
	FastifyPluginOptions,
	FastifyReply,
	FastifyRequest,
} from "fastify";
import fp from "fastify-plugin";

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
				await request.jwtVerify();
			} catch (_err) {
				reply.code(401).send({ error: "Unauthorized" });
			}
		},
	);
}

export default fp(jwtPlugin);
