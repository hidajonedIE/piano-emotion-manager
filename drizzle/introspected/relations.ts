import { relations } from "drizzle-orm/relations";
import { pianos, alertHistory, clients, partners, alertNotifications, alertSettings, calendarConnections, calendarSyncEvents, helpSections, helpItems, partnerPricing, partnerSettings, partnerUsers, users } from "./schema";

export const alertHistoryRelations = relations(alertHistory, ({one, many}) => ({
	piano: one(pianos, {
		fields: [alertHistory.pianoId],
		references: [pianos.id]
	}),
	client: one(clients, {
		fields: [alertHistory.clientId],
		references: [clients.id]
	}),
	partner: one(partners, {
		fields: [alertHistory.partnerId],
		references: [partners.id]
	}),
	alertNotifications: many(alertNotifications),
}));

export const pianosRelations = relations(pianos, ({many}) => ({
	alertHistories: many(alertHistory),
}));

export const clientsRelations = relations(clients, ({many}) => ({
	alertHistories: many(alertHistory),
}));

export const partnersRelations = relations(partners, ({many}) => ({
	alertHistories: many(alertHistory),
	alertSettings: many(alertSettings),
	partnerPricings: many(partnerPricing),
	partnerSettings: many(partnerSettings),
	partnerUsers: many(partnerUsers),
}));

export const alertNotificationsRelations = relations(alertNotifications, ({one}) => ({
	alertHistory: one(alertHistory, {
		fields: [alertNotifications.alertHistoryId],
		references: [alertHistory.id]
	}),
}));

export const alertSettingsRelations = relations(alertSettings, ({one}) => ({
	partner: one(partners, {
		fields: [alertSettings.partnerId],
		references: [partners.id]
	}),
}));

export const calendarSyncEventsRelations = relations(calendarSyncEvents, ({one}) => ({
	calendarConnection: one(calendarConnections, {
		fields: [calendarSyncEvents.connectionId],
		references: [calendarConnections.id]
	}),
}));

export const calendarConnectionsRelations = relations(calendarConnections, ({many}) => ({
	calendarSyncEvents: many(calendarSyncEvents),
}));

export const helpItemsRelations = relations(helpItems, ({one}) => ({
	helpSection: one(helpSections, {
		fields: [helpItems.sectionId],
		references: [helpSections.id]
	}),
}));

export const helpSectionsRelations = relations(helpSections, ({many}) => ({
	helpItems: many(helpItems),
}));

export const partnerPricingRelations = relations(partnerPricing, ({one}) => ({
	partner: one(partners, {
		fields: [partnerPricing.partnerId],
		references: [partners.id]
	}),
}));

export const partnerSettingsRelations = relations(partnerSettings, ({one}) => ({
	partner: one(partners, {
		fields: [partnerSettings.partnerId],
		references: [partners.id]
	}),
}));

export const partnerUsersRelations = relations(partnerUsers, ({one}) => ({
	partner: one(partners, {
		fields: [partnerUsers.partnerId],
		references: [partners.id]
	}),
	user: one(users, {
		fields: [partnerUsers.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	partnerUsers: many(partnerUsers),
}));