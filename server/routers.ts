/**
 * App Router Principal
 * Piano Emotion Manager
 * 
 * Este archivo importa y combina todos los routers modulares.
 * Cada dominio tiene su propio archivo en server/routers/
 */
import { router } from "./_core/trpc.js";
import { systemRouter } from "./_core/systemRouter.js";

// Importar routers modulares
import {
  authRouter,
  testAuthRouter,
  clientsRouter,
  pianosRouter,
  servicesRouter,
  inventoryRouter,
  appointmentsRouter,
  invoicesRouter,
  quotesRouter,
  quoteTemplatesRouter,
  remindersRouter,
  businessInfoRouter,
  serviceRatesRouter,
  modulesRouter,
  invitationsRouter,
  partnersRouter,
  onboardingRouter,
  languageRouter,
  advancedRouter,
  seedRouter,
  usageRouter,
  alertsRouter,
} from "./routers/index.js";
import { licenseRouter } from "./routers/license/index.js";
import { aiGenerationRouter } from "./routers/ai-generation.router.js";
import { calendarRouter } from "./routers/calendar.router.js";
import { clientPortalRouter } from "./routers/client-portal.router.js";
import { portalAdminRouter } from "./routers/portal-admin.router.js";
import { timelineRouter } from "./routers/timeline.router.js";
import { exportRouter } from "./routers/export.router.js";

export const appRouter = router({
  // Sistema
  system: systemRouter,
  
  // Autenticación
  auth: authRouter,
  testAuth: testAuthRouter,
  
  // Entidades principales
  clients: clientsRouter,
  pianos: pianosRouter,
  services: servicesRouter,
  inventory: inventoryRouter,
  appointments: appointmentsRouter,
  invoices: invoicesRouter,
  quotes: quotesRouter,
  quoteTemplates: quoteTemplatesRouter,
  reminders: remindersRouter,
  
  // Configuración
  businessInfo: businessInfoRouter,
  serviceRates: serviceRatesRouter,
  modules: modulesRouter,
  invitations: invitationsRouter,
  partners: partnersRouter,
  onboarding: onboardingRouter,
  language: languageRouter,
  
  // Funcionalidades avanzadas
  advanced: advancedRouter,
  
  // Uso y límites de suscripción
  usage: usageRouter,
  
  // Generación de contenido con IA
  aiGeneration: aiGenerationRouter,
  
  // Seed de datos de prueba
  seed: seedRouter,
  
  // Sistema de licencias
  license: licenseRouter,
  
  // Sincronización de calendario
  calendar: calendarRouter,
  
  // Portal de clientes
  clientPortal: clientPortalRouter,
  portalAdmin: portalAdminRouter,
  
  // Timeline de actividad
  timeline: timelineRouter,
  
  // Exportación de datos
  export: exportRouter,
  
  // Sistema de alertas
  alerts: alertsRouter,

});

export type AppRouter = typeof appRouter;
