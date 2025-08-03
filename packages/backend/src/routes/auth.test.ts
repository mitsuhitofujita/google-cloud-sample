import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";
import fastify from "fastify";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import jwtPlugin from "../plugins/jwt";
import authRoutes from "./auth";

// Create mock functions
const mockVerifyIdToken = vi.fn();

// Mock google-auth-library
vi.mock("google-auth-library", () => ({
	OAuth2Client: vi.fn().mockImplementation(() => ({
		verifyIdToken: mockVerifyIdToken,
	})),
}));

// Mock firestore service
vi.mock("../services/firestore", () => ({
	firestoreService: {
		createOrUpdateUser: vi.fn(),
	},
}));

// Import mocked modules
import { firestoreService } from "../services/firestore";

let server: FastifyInstance;

beforeAll(async () => {
	// Set environment variables
	process.env.JWT_SECRET = "test-secret-key";
	process.env.GOOGLE_CLIENT_ID = "test-client-id";

	server = fastify();
	await server.register(cookie);
	await server.register(jwtPlugin);
	await server.register(authRoutes, { prefix: "/api" });
	await server.listen({ port: 0, host: "127.0.0.1" });
});

afterAll(async () => {
	await server.close();
	vi.clearAllMocks();
});

describe("/api/auth/google", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should authenticate successfully with valid Google ID token", async () => {
		const mockPayload = {
			sub: "123456789",
			email: "test@example.com",
			name: "Test User",
			picture: "https://example.com/avatar.jpg",
			iss: "https://accounts.google.com",
			aud: "test-client-id",
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		};

		const mockLoginTicket = {
			getPayload: () => mockPayload,
			getEnvelope: () => "",
			getUserId: () => "123456789",
			getAttributes: () => ({}),
		};

		mockVerifyIdToken.mockResolvedValueOnce(mockLoginTicket);

		vi.mocked(firestoreService.createOrUpdateUser).mockResolvedValueOnce(
			undefined,
		);

		const res = await server.inject({
			method: "POST",
			url: "/api/auth/google",
			payload: {
				idToken: "valid-google-id-token",
			},
		});

		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({
			user: {
				id: "123456789",
				email: "test@example.com",
				name: "Test User",
				picture: "https://example.com/avatar.jpg",
			},
		});

		// Check if cookie was set
		const cookies = res.cookies;
		expect(cookies).toHaveLength(1);
		expect(cookies[0].name).toBe("authToken");
		expect(cookies[0].httpOnly).toBe(true);
		expect(cookies[0].sameSite).toBe("Strict");

		// Check if Firestore was called
		expect(firestoreService.createOrUpdateUser).toHaveBeenCalledWith({
			id: "123456789",
			email: "test@example.com",
			name: "Test User",
			picture: "https://example.com/avatar.jpg",
		});
	});

	it("should return 400 when idToken is missing", async () => {
		const res = await server.inject({
			method: "POST",
			url: "/api/auth/google",
			payload: {},
		});

		expect(res.statusCode).toBe(400);
		expect(res.json()).toEqual({
			error: "ID token is required",
		});
	});

	it("should return 401 when token verification fails", async () => {
		mockVerifyIdToken.mockRejectedValueOnce(new Error("Invalid token"));

		const res = await server.inject({
			method: "POST",
			url: "/api/auth/google",
			payload: {
				idToken: "invalid-token",
			},
		});

		expect(res.statusCode).toBe(401);
		expect(res.json()).toEqual({
			error: "Authentication failed",
		});
	});

	it("should return 401 when payload is null", async () => {
		const mockLoginTicket = {
			getPayload: () => null,
			getEnvelope: () => "",
			getUserId: () => null,
			getAttributes: () => ({}),
		};

		mockVerifyIdToken.mockResolvedValueOnce(mockLoginTicket);

		const res = await server.inject({
			method: "POST",
			url: "/api/auth/google",
			payload: {
				idToken: "token-with-null-payload",
			},
		});

		expect(res.statusCode).toBe(401);
		expect(res.json()).toEqual({
			error: "Invalid token",
		});
	});

	it("should handle missing optional fields in Google payload", async () => {
		const mockPayload = {
			sub: "123456789",
			// email and name could be undefined
			iss: "https://accounts.google.com",
			aud: "test-client-id",
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		};

		const mockLoginTicket = {
			getPayload: () => mockPayload,
			getEnvelope: () => "",
			getUserId: () => "123456789",
			getAttributes: () => ({}),
		};

		mockVerifyIdToken.mockResolvedValueOnce(mockLoginTicket);

		vi.mocked(firestoreService.createOrUpdateUser).mockResolvedValueOnce(
			undefined,
		);

		const res = await server.inject({
			method: "POST",
			url: "/api/auth/google",
			payload: {
				idToken: "valid-token-minimal-payload",
			},
		});

		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({
			user: {
				id: "123456789",
				email: "",
				name: "",
				picture: undefined,
			},
		});
	});

	it("should handle Firestore service errors", async () => {
		const mockPayload = {
			sub: "123456789",
			email: "test@example.com",
			name: "Test User",
			iss: "https://accounts.google.com",
			aud: "test-client-id",
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + 3600,
		};

		const mockLoginTicket = {
			getPayload: () => mockPayload,
			getEnvelope: () => "",
			getUserId: () => "123456789",
			getAttributes: () => ({}),
		};

		mockVerifyIdToken.mockResolvedValueOnce(mockLoginTicket);

		vi.mocked(firestoreService.createOrUpdateUser).mockRejectedValueOnce(
			new Error("Firestore error"),
		);

		const res = await server.inject({
			method: "POST",
			url: "/api/auth/google",
			payload: {
				idToken: "valid-token-firestore-error",
			},
		});

		expect(res.statusCode).toBe(401);
		expect(res.json()).toEqual({
			error: "Authentication failed",
		});
	});
});