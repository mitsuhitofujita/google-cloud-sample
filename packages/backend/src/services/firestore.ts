import { Firestore } from "@google-cloud/firestore";
import type { User } from "../types/index";

const firestore = new Firestore({
	projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
	keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const usersCollection = "users";

export class FirestoreService {
	async createOrUpdateUser(user: User): Promise<void> {
		try {
			const userRef = firestore.collection(usersCollection).doc(user.id);

			await userRef.set(
				{
					id: user.id,
					email: user.email,
					name: user.name,
					picture: user.picture,
					updatedAt: new Date(),
					createdAt: new Date(),
				},
				{ merge: true },
			);
		} catch (error) {
			console.error("Error creating/updating user in Firestore:", error);
			throw error;
		}
	}

	async getUser(userId: string): Promise<User | null> {
		try {
			const userDoc = await firestore
				.collection(usersCollection)
				.doc(userId)
				.get();

			if (!userDoc.exists) {
				return null;
			}

			const userData = userDoc.data();
			return {
				id: userData?.id,
				email: userData?.email,
				name: userData?.name,
				picture: userData?.picture,
			};
		} catch (error) {
			console.error("Error getting user from Firestore:", error);
			throw error;
		}
	}
}

export const firestoreService = new FirestoreService();
