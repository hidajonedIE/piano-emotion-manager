import { protectedProcedure, router } from "../trpc";
import { z } from "zod";
import { pianos } from "../db/schema";

export const testPianoRouter = router({
  createTestPiano: protectedProcedure
    .input(z.object({}))
    .mutation(async ({ ctx }) => {
      const { db, auth } = ctx;
      const { userId, orgId } = auth;

      if (!userId || !orgId) {
        throw new Error("User or organization not found");
      }

      console.log(`Creating test piano for user: ${userId} in org: ${orgId}`);

      const newPiano = await db.insert(pianos).values({
        brand: "PRUEBA REAL",
        model: "Test Model",
        serialNumber: `TEST-${Date.now()}`,
        year: 2024,
        odId: userId,
        partnerId: orgId, // Assuming partnerId is the same as orgId for this test
        organizationId: orgId,
        status: 'active',
        clientId: 1, // Assigning to a default client for now
      }).returning();

      console.log("New piano created:", newPiano);

      return newPiano;
    }),
});
