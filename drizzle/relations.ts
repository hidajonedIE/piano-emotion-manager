/**
 * Drizzle ORM Relations
 * Piano Emotion Manager
 * 
 * Define relationships between tables for better query building
 */

import { relations } from "drizzle-orm";
import {
  users,
  clients,
  pianos,
  services,
  inventory,
  appointments,
  invoices,
  serviceRates,
  businessInfo,
  reminders,
  quotes,
  quoteTemplates,
} from "./schema";

/**
 * User relations
 */
export const usersRelations = relations(users, ({ many, one }) => ({
  // A user owns many clients
  clients: many(clients),
  // A user owns many pianos
  pianos: many(pianos),
  // A user owns many services
  services: many(services),
  // A user owns many inventory items
  inventory: many(inventory),
  // A user owns many appointments
  appointments: many(appointments),
  // A user owns many invoices
  invoices: many(invoices),
  // A user owns many service rates
  serviceRates: many(serviceRates),
  // A user has one business info
  businessInfo: one(businessInfo),
  // A user owns many reminders
  reminders: many(reminders),
  // A user owns many quotes
  quotes: many(quotes),
  // A user owns many quote templates
  quoteTemplates: many(quoteTemplates),
}));

/**
 * Client relations
 */
export const clientsRelations = relations(clients, ({ many }) => ({
  // A client has many pianos
  pianos: many(pianos),
  // A client has many services (through pianos)
  services: many(services),
  // A client has many appointments
  appointments: many(appointments),
  // A client has many invoices
  invoices: many(invoices),
  // A client has many reminders
  reminders: many(reminders),
  // A client has many quotes
  quotes: many(quotes),
}));

/**
 * Piano relations
 */
export const pianosRelations = relations(pianos, ({ one, many }) => ({
  // A piano belongs to one client
  client: one(clients, {
    fields: [pianos.clientId],
    references: [clients.id],
  }),
  // A piano has many services
  services: many(services),
  // A piano has many appointments
  appointments: many(appointments),
  // A piano has many reminders
  reminders: many(reminders),
  // A piano has many quotes
  quotes: many(quotes),
}));

/**
 * Service relations
 */
export const servicesRelations = relations(services, ({ one }) => ({
  // A service belongs to one piano
  piano: one(pianos, {
    fields: [services.pianoId],
    references: [pianos.id],
  }),
  // A service belongs to one client
  client: one(clients, {
    fields: [services.clientId],
    references: [clients.id],
  }),
}));

/**
 * Appointment relations
 */
export const appointmentsRelations = relations(appointments, ({ one }) => ({
  // An appointment belongs to one client
  client: one(clients, {
    fields: [appointments.clientId],
    references: [clients.id],
  }),
  // An appointment may belong to one piano
  piano: one(pianos, {
    fields: [appointments.pianoId],
    references: [pianos.id],
  }),
}));

/**
 * Invoice relations
 */
export const invoicesRelations = relations(invoices, ({ one }) => ({
  // An invoice belongs to one client
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
}));

/**
 * Reminder relations
 */
export const remindersRelations = relations(reminders, ({ one }) => ({
  // A reminder belongs to one client
  client: one(clients, {
    fields: [reminders.clientId],
    references: [clients.id],
  }),
  // A reminder may belong to one piano
  piano: one(pianos, {
    fields: [reminders.pianoId],
    references: [pianos.id],
  }),
}));

/**
 * Quote relations
 */
export const quotesRelations = relations(quotes, ({ one }) => ({
  // A quote belongs to one client
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  // A quote may belong to one piano
  piano: one(pianos, {
    fields: [quotes.pianoId],
    references: [pianos.id],
  }),
}));
