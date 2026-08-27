import { pool } from "../config/database.js";

export type Conversation = {
  id: number;
  userOneId: number;
  userTwoId: number;
  createdAt: Date;
};

/**
 * Find an existing conversation between two users.
 */
export const findConversation = async (
  userOneId: number,
  userTwoId: number
): Promise<Conversation | null> => {
  const result = await pool.query<Conversation>(
    `
      SELECT
        id,
        user_one_id AS "userOneId",
        user_two_id AS "userTwoId",
        created_at AS "createdAt"
      FROM conversations
      WHERE
        (user_one_id = $1 AND user_two_id = $2)
        OR
        (user_one_id = $2 AND user_two_id = $1)
      LIMIT 1
    `,
    [userOneId, userTwoId]
  );

  return result.rows[0] ?? null;
};

/**
 * Create a new conversation between two users.
 */
export const createConversation = async (
  userOneId: number,
  userTwoId: number
): Promise<Conversation> => {
  if (userOneId === userTwoId) {
    throw new Error(
      "A user cannot create a conversation with themselves"
    );
  }

  const result = await pool.query<Conversation>(
    `
      INSERT INTO conversations (
        user_one_id,
        user_two_id
      )
      VALUES ($1, $2)
      RETURNING
        id,
        user_one_id AS "userOneId",
        user_two_id AS "userTwoId",
        created_at AS "createdAt"
    `,
    [userOneId, userTwoId]
  );

  return result.rows[0];
};

/**
 * Find an existing conversation or create one.
 */
export const getOrCreateConversation = async (
  userOneId: number,
  userTwoId: number
): Promise<Conversation> => {
  if (userOneId === userTwoId) {
    throw new Error(
      "A user cannot create a conversation with themselves"
    );
  }

  const existingConversation =
    await findConversation(
      userOneId,
      userTwoId
    );

  if (existingConversation) {
    return existingConversation;
  }

  return createConversation(
    userOneId,
    userTwoId
  );
};