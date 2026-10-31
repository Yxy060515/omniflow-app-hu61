// AUTO-GENERATED: backend/db/schema.ts
// This file is assembled from installed capability schema pieces.

import { pgTable, text, timestamp, index, integer } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const crowdFeedback = pgTable(
  'crowd_feedback',
  {
    id: text('id').primaryKey(),
    clientId: text('client_id').notNull(),
    routeId: text('route_id').notNull(),
    busId: text('bus_id'),
    stopName: text('stop_name'),
    level: text('level').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('crowd_feedback_route_time_idx').on(table.routeId, table.createdAt),
    index('crowd_feedback_client_idx').on(table.clientId, table.createdAt),
  ],
);

export type CrowdFeedbackRow = typeof crowdFeedback.$inferSelect;
export type NewCrowdFeedbackRow = typeof crowdFeedback.$inferInsert;

// ============================================
// Users Table
// ============================================
export const users = pgTable('Users', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Auto-generate insert schema from table, override custom validation only
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Update schema - all fields optional
export const updateUserSchema = insertUserSchema.partial();

// Login schema - define explicitly to avoid brittle pick() masks when user fields change
export const loginUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Signup schema - define explicitly so auth stays stable even if insertUserSchema changes
export const signupUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Confirm password must be at least 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type SignupUserInput = z.infer<typeof signupUserSchema>;
