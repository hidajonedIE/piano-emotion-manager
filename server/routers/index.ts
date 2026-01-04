/**
 * Exportación de Routers
 * Piano Emotion Manager
 */

// Routers de entidades principales
export { clientsRouter } from './clients.router';
export { pianosRouter } from './pianos.router';
export { servicesRouter } from './services.router';
export { inventoryRouter } from './inventory.router';
export { appointmentsRouter } from './appointments.router';
export { invoicesRouter } from './invoices.router';
export { quotesRouter } from './quotes.router';
export { quoteTemplatesRouter } from './quote-templates.router';
export { remindersRouter } from './reminders.router';

// Routers de configuración
export { authRouter } from './auth.router';
export { testAuthRouter } from './test-auth.router';
export { businessInfoRouter } from './business-info.router';
export { serviceRatesRouter } from './service-rates.router';
export { modulesRouter } from './modules.router';
export { invitationsRouter } from './invitations.router';

// Routers avanzados
export { advancedRouter } from './advanced.router';
export { seedRouter } from './seed.router';
export { usageRouter } from './usage.router';

// Routers de equipos (existentes)
export { teamRouter, organizationsRouter, membersRouter, workAssignmentsRouter } from './team.router';
export { teamExtendedRouter, absencesRouter, metricsRouter, zonesRouter } from './team-extended.router';
