import { pool } from "../config/database.js";

export type CreateMessageInput = {
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
};

export type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: Date;
};

/**
 * Find an existing conversation between two users
 * or create a new one.
 */
export const getOrCreateConversation = async (
  userOneId: number,
  userTwoId: number
): Promise<number> => {
  const firstUserId = Math.min(userOneId, userTwoId);
  const secondUserId = Math.max(userOneId, userTwoId);

  const existingConversation = await pool.query<{
    id: number;
  }>(
    `
      SELECT id
      FROM conversations
      WHERE user_one_id = $1
        AND user_two_id = $2
      LIMIT 1
    `,
    [firstUserId, secondUserId]
  );

  if (existingConversation.rows.length > 0) {
    return existingConversation.rows[0].id;
  }

  const newConversation = await pool.query<{
    id: number;
  }>(
    `
      INSERT INTO conversations (
        user_one_id,
        user_two_id
      )
      VALUES ($1, $2)
      RETURNING id
    `,
    [firstUserId, secondUserId]
  );

  return newConversation.rows[0].id;
};

/**
 * Save a message to PostgreSQL.
 */
export const createMessage = async (
  input: CreateMessageInput
): Promise<Message> => {
  const {
    conversationId,
    senderId,
    receiverId,
    content,
  } = input;

  const result = await pool.query<Message>(
    `
      INSERT INTO messages (
        conversation_id,
        sender_id,
        receiver_id,
        content
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        conversation_id AS "conversationId",
        sender_id AS "senderId",
        receiver_id AS "receiverId",
        content,
        created_at AS "createdAt"
    `,
    [
      conversationId,
      senderId,
      receiverId,
      content,
    ]
  );

  return result.rows[0];
};

/**
 * Get messages for a conversation.
 */
export const getConversationMessages = async (
  conversationId: number
): Promise<Message[]> => {
  const result = await pool.query<Message>(
    `
      SELECT
        id,
        conversation_id AS "conversationId",
        sender_id AS "senderId",
        receiver_id AS "receiverId",
        content,
        created_at AS "createdAt"
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `,
    [conversationId]
  );

  return result.rows;
};