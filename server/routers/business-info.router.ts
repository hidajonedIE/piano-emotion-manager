/**
 * Business Info Router
 * Gestión de información de la empresa
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import * as db from "../db.js";
import { addPartnerToInsert } from "../utils/multi-tenant.js";

export const businessInfoRouter = router({
  get: protectedProcedure.query(({ ctx }) => getDb().getBusinessInfo(ctx.user.email)),
  
  save: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      taxId: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      postalCode: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      bankAccount: z.string().optional().nullable(),
    }))
    .mutation(({ ctx, input }) => getDb().saveBusinessInfo({ ...input, odId: ctx.user.email, partnerId: ctx.partnerId })),
});
