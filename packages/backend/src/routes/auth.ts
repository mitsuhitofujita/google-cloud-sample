import type { FastifyInstance } from "fastify";
import { OAuth2Client } from "google-auth-library";
import { firestoreService } from "../services/firestore";
import type { JWTPayload, User } from "../types/index";

const googleClientId = process.env.GOOGLE_CLIENT_ID;

export default async function authRoutes(fastify: FastifyInstance) {
	const oAuth2Client = new OAuth2Client(googleClientId);

	// Verify Google ID token from frontend
	fastify.post("/auth/google", async (request, reply) => {
		fastify.log.error(request.body);
		const { idToken } = request.body as { idToken: string };

		fastify.log.error(idToken);

		if (!idToken) {
			return reply.code(400).send({ error: "ID token is required" });
		}

		fastify.log.info(`Received idToken length: ${idToken.length}`);
		fastify.log.info(`Using Google Client ID: ${googleClientId}`);
		fastify.log.info(
			`GOOGLE_CLIENT_ID env var: ${process.env.GOOGLE_CLIENT_ID}`,
		);

		try {
			const ticket = await oAuth2Client.verifyIdToken({
				idToken,
				audience: googleClientId,
			});
			fastify.log.error({ ticket: ticket });

			const payload = ticket.getPayload();
			if (!payload) {
				return reply.code(401).send({ error: "Invalid token" });
			}
			fastify.log.error({ payload: payload });

			const user: User = {
				id: payload.sub,
				email: payload.email || "",
				name: payload.name || "",
				picture: payload.picture,
			};

			// Persist user to Firestore
			await firestoreService.createOrUpdateUser(user);

			// Generate JWT token
			const token = fastify.jwt.sign({ user } as JWTPayload);

			// Set httpOnly cookie
			reply.setCookie("authToken", token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 24 * 7, // 7 days
			});

			return reply.send({
				user,
			});
		} catch (error) {
			fastify.log.error("Google auth error:", error);
			return reply.code(401).send({ error: "Authentication failed" });
		}
	});

	// Verify JWT token endpoint
	fastify.get(
		"/auth/verify",
		{
			preHandler: [fastify.authenticate],
		},
		async (request, reply) => {
			fastify.log.info("Verify endpoint called");
			fastify.log.info("Request cookies:", request.cookies);
			fastify.log.info("Request user:", request.user);
			return reply.send(request.user);
		},
	);

	// Sign out endpoint
	fastify.post("/auth/sign-out", async (_request, reply) => {
		// Clear the httpOnly cookie
		reply.clearCookie("authToken", {
			path: "/",
		});
		return reply.send({ message: "Sign out successfully" });
	});
}
