import "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { User } from "./index";

declare module "@fastify/jwt" {
	interface FastifyJWT {
		payload: { user: User };
		user: User;
	}
}

declare module "fastify" {
	interface FastifyInstance {
		authenticate: (
			request: FastifyRequest,
			reply: FastifyReply,
		) => Promise<void>;
	}

	interface FastifyRequest {
		user?: User;
	}
}
