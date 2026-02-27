import { pgTable, serial, text, integer, boolean, timestamp, date, time, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth.schema';

// --- Enums ---
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled']);

// --- availability_slots ---
// One row = one bookable time window on one calendar date
export const availabilitySlots = pgTable('availability_slots', {
	id: serial('id').primaryKey(),
	date: date('date').notNull(),
	startTime: time('start_time').notNull(),
	endTime: time('end_time').notNull(),
	maxCapacity: integer('max_capacity').notNull().default(6),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// --- bookings ---
export const bookings = pgTable('bookings', {
	id: serial('id').primaryKey(),
	bookingRef: text('booking_ref').notNull().unique(),
	slotId: integer('slot_id')
		.notNull()
		.references(() => availabilitySlots.id),
	userId: text('user_id').references(() => user.id),
	name: text('name').notNull(),
	email: text('email').notNull(),
	phone: text('phone').notNull(),
	partySizeAdults: integer('party_size_adults').notNull(),
	partySizeKids: integer('party_size_kids').notNull().default(0),
	status: bookingStatusEnum('status').notNull().default('pending'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// --- Relations ---
export const availabilitySlotsRelations = relations(availabilitySlots, ({ many }) => ({
	bookings: many(bookings)
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
	slot: one(availabilitySlots, {
		fields: [bookings.slotId],
		references: [availabilitySlots.id]
	})
}));

export * from './auth.schema';
