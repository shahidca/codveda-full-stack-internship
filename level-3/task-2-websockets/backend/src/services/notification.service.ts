import { pool } from "../config/database.js";

export type CreateNotificationInput = {
  userId: number;
  type: string;
  message: string;
};

export type Notification = {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

/**
 * Save a notification to PostgreSQL.
 */
export const createNotification = async (
  input: CreateNotificationInput
): Promise<Notification> => {
  const {
    userId,
    type,
    message,
  } = input;

  const result = await pool.query<Notification>(
    `
      INSERT INTO notifications (
        user_id,
        type,
        message
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        user_id AS "userId",
        type,
        message,
        is_read AS "isRead",
        created_at AS "createdAt"
    `,
    [
      userId,
      type,
      message,
    ]
  );

  return result.rows[0];
};

/**
 * Get notifications for a user.
 */
export const getUserNotifications = async (
  userId: number
): Promise<Notification[]> => {
  const result = await pool.query<Notification>(
    `
      SELECT
        id,
        user_id AS "userId",
        type,
        message,
        is_read AS "isRead",
        created_at AS "createdAt"
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
};

/**
 * Mark one notification as read.
 */
export const markNotificationAsRead = async (
  notificationId: number,
  userId: number
): Promise<Notification | null> => {
  const result = await pool.query<Notification>(
    `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
        AND user_id = $2
      RETURNING
        id,
        user_id AS "userId",
        type,
        message,
        is_read AS "isRead",
        created_at AS "createdAt"
    `,
    [
      notificationId,
      userId,
    ]
  );

  return result.rows[0] ?? null;
};