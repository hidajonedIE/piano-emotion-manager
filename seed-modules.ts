import { getDb } from './drizzle/db.js';
import { modules, subscriptionPlans } from './drizzle/modules-schema.js';
import { eq } from 'drizzle-orm';
import { DEFAULT_MODULES, DEFAULT_PLANS } from './server/data/modules-data';

async function seedModules() {
  for (const module of DEFAULT_MODULES) {
    const db = await getDb();
    const existing = await db.query.modules.findFirst({
      where: eq(modules.code, module.code),
    });
    if (!existing) {
      await db.insert(modules).values({
        code: module.code,
        name: module.name,
        description: module.description,
        icon: module.icon,
        color: module.color,
        type: module.type,
        includedInPlans: module.includedInPlans,
      });
    } else {
      // Actualizar módulo existente
      await db.update(modules)
        .set({
          name: module.name,
          description: module.description,
          icon: module.icon,
          color: module.color,
          type: module.type,
          includedInPlans: module.includedInPlans,
        })
        .where(eq(modules.code, module.code));
    }
  }
}

async function seedPlans() {
  const db = await getDb();
  for (const plan of DEFAULT_PLANS) {
    const existing = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.code, plan.code),
    });
    if (!existing) {
      await db.insert(subscriptionPlans).values({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice.toString(),
        yearlyPrice: plan.yearlyPrice.toString(),
        maxUsers: plan.maxUsers,
        maxClients: plan.maxClients,
        maxPianos: plan.maxPianos,
        maxInvoicesPerMonth: plan.maxInvoicesPerMonth,
        maxStorageMb: plan.maxStorageMb,
        features: plan.features,
        isPopular: plan.isPopular,
      });
    } else {
      // Actualizar plan existente
      await db.update(subscriptionPlans)
        .set({
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice.toString(),
          yearlyPrice: plan.yearlyPrice.toString(),
          maxUsers: plan.maxUsers,
          maxClients: plan.maxClients,
          maxPianos: plan.maxPianos,
          maxInvoicesPerMonth: plan.maxInvoicesPerMonth,
          maxStorageMb: plan.maxStorageMb,
          features: plan.features,
          isPopular: plan.isPopular,
        })
        .where(eq(subscriptionPlans.code, plan.code));
    }
  }
}

async function main() {
  try {
    await seedModules();
    await seedPlans();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

main();
