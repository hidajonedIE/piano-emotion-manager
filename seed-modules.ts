import { db } from './drizzle/db';
import { modules, subscriptionPlans } from './drizzle/modules-schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_MODULES, DEFAULT_PLANS } from './server/data/modules-data';

async function seedModules() {
  console.log('Seeding modules...');
  for (const module of DEFAULT_MODULES) {
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
      console.log(`  - Created module: ${module.name}`);
    } else {
      console.log(`  - Module already exists: ${module.name}`);
    }
  }
}

async function seedPlans() {
  console.log('Seeding plans...');
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
      console.log(`  - Created plan: ${plan.name}`);
    } else {
      console.log(`  - Plan already exists: ${plan.name}`);
    }
  }
}

async function main() {
  try {
    await seedModules();
    await seedPlans();
    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

main();
