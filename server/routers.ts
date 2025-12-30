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
  advancedRouter,
  seedRouter,
} from "./routers/index.js";
import { licenseRouter } from "./routers/license/index.js";

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
  
  // Funcionalidades avanzadas
  advanced: advancedRouter,
  
  // Seed de datos de prueba
  seed: seedRouter,
  
  // Sistema de licencias
  license: licenseRouter,
});

export type AppRouter = typeof appRouter;
