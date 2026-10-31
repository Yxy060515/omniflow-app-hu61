import { randomUUID } from 'crypto';
import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '../db';
import { crowdFeedback } from '../db/schema';

interface CreateFeedbackInput {
  clientId: string;
  routeId: string;
  level: string;
  busId?: string;
  stopName?: string;
}

export const feedbackRepository = {
  async listSince(since: Date) {
    return db
      .select({ routeId: crowdFeedback.routeId, level: crowdFeedback.level })
      .from(crowdFeedback)
      .where(gte(crowdFeedback.createdAt, since));
  },

  async findRecentByClient(clientId: string, routeId: string, since: Date) {
    return db
      .select()
      .from(crowdFeedback)
      .where(
        and(
          eq(crowdFeedback.clientId, clientId),
          eq(crowdFeedback.routeId, routeId),
          gte(crowdFeedback.createdAt, since),
        ),
      )
      .orderBy(desc(crowdFeedback.createdAt));
  },

  async create(data: CreateFeedbackInput) {
    const [row] = await db
      .insert(crowdFeedback)
      .values({
        id: randomUUID(),
        clientId: data.clientId,
        routeId: data.routeId,
        level: data.level,
        busId: data.busId ?? null,
        stopName: data.stopName ?? null,
      })
      .returning();
    return row;
  },
};
