import type { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import {
  createMessage,
} from "../services/message.service.js";
import {
  createConversation,
} from "../services/conversation.service.js";
import {
  createNotification,
} from "../services/notification.service.js";

type JwtPayload = {
  userId: number;
};

type AuthenticatedSocket = Socket & {
  userId?: number;
};

type ChatMessageInput = {
  id?: string;
  text: string;
  sender?: string;
  timestamp?: string;
};

type PrivateMessageInput = {
  receiverId: number;
  message: string;
};

type NotificationInput = {
  userId: number;
  message: string;
};

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  "codveda_task2_access_secret_2026";

/**
 * Authenticate a Socket.io connection using JWT.
 */
const authenticateSocket = (
  socket: AuthenticatedSocket
): boolean => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== "string") {
      console.error(
        `Socket authentication failed: ${socket.id} - token missing`
      );

      return false;
    }

    const decoded = jwt.verify(
      token,
      JWT_ACCESS_SECRET
    ) as JwtPayload;

    if (
      typeof decoded.userId !== "number" ||
      !Number.isInteger(decoded.userId)
    ) {
      console.error(
        `Socket authentication failed: ${socket.id} - invalid userId`
      );

      return false;
    }

    socket.userId = decoded.userId;

    return true;
  } catch (error) {
    console.error(
      `Socket authentication failed: ${socket.id}`,
      error
    );

    return false;
  }
};

/**
 * Register all Socket.io event handlers.
 */
export const registerSocketHandlers = (
  io: Server
): void => {
  /**
   * Socket authentication middleware.
   */
  io.use((socket, next) => {
    const authenticatedSocket =
      socket as AuthenticatedSocket;

    const authenticated = authenticateSocket(
      authenticatedSocket
    );

    if (!authenticated) {
      return next(
        new Error("Socket authentication failed")
      );
    }

    next();
  });

  /**
   * Authenticated connection.
   */
  io.on("connection", (socket) => {
    const authenticatedSocket =
      socket as AuthenticatedSocket;

    const userId = authenticatedSocket.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    /**
     * Every authenticated user gets
     * a personal room.
     */
    const userRoom = `user:${userId}`;

    socket.join(userRoom);

    console.log(
      `Authenticated client connected: ${socket.id}`
    );

    console.log(
      `User ${userId} joined room: ${userRoom}`
    );

    /**
     * Tell frontend that authentication
     * was successful.
     */
    socket.emit("socket_authenticated", {
      success: true,
      userId,
      socketId: socket.id,
      room: userRoom,
    });

    /**
     * Public real-time message.
     */
    socket.on(
      "send_message",
      (data: ChatMessageInput) => {
        if (
          !data ||
          typeof data.text !== "string"
        ) {
          return;
        }

        const text = data.text.trim();

        if (!text) {
          return;
        }

        const publicMessage = {
          id:
            data.id ??
            `${Date.now()}-${Math.random()}`,
          text,
          sender:
            data.sender ??
            socket.id,
          timestamp:
            data.timestamp ??
            new Date().toISOString(),
        };

        io.emit(
          "receive_message",
          publicMessage
        );
      }
    );

    /**
     * Private message.
     *
     * Saves the message to PostgreSQL
     * and then delivers it to the receiver.
     */
    socket.on(
      "send_private_message",
      async (
        data: PrivateMessageInput
      ) => {
        try {
          if (
            !data ||
            typeof data.receiverId !==
              "number" ||
            !Number.isInteger(
              data.receiverId
            ) ||
            typeof data.message !==
              "string"
          ) {
            socket.emit(
              "private_message_error",
              {
                message:
                  "Invalid private message data",
              }
            );

            return;
          }

          const message =
            data.message.trim();

          if (!message) {
            return;
          }

          if (
            data.receiverId === userId
          ) {
            socket.emit(
              "private_message_error",
              {
                message:
                  "You cannot send a private message to yourself.",
              }
            );

            return;
          }

          /**
           * Create or find conversation.
           */
          const conversation =
            await createConversation(
              userId,
              data.receiverId
            );

          /**
           * Save message.
           */
          const savedMessage =
            await createMessage({
              conversationId:
                conversation.id,
              senderId: userId,
              receiverId:
                data.receiverId,
              content: message,
            });

          console.log(
            `Private message saved: ${userId} -> ${data.receiverId} | conversation ${conversation.id}`
          );

          /**
           * Deliver to receiver.
           */
          io.to(
            `user:${data.receiverId}`
          ).emit(
            "private_message",
            {
              id: savedMessage.id,
              conversationId:
                savedMessage.conversationId,
              senderId:
                savedMessage.senderId,
              receiverId:
                savedMessage.receiverId,
              message:
                savedMessage.content,
              timestamp:
                savedMessage.createdAt,
            }
          );

          /**
           * Also confirm to sender.
           */
          socket.emit(
            "private_message_sent",
            {
              id: savedMessage.id,
              conversationId:
                savedMessage.conversationId,
              senderId:
                savedMessage.senderId,
              receiverId:
                savedMessage.receiverId,
              message:
                savedMessage.content,
              timestamp:
                savedMessage.createdAt,
            }
          );
        } catch (error) {
          console.error(
            "Failed to send private message:",
            error
          );

          socket.emit(
            "private_message_error",
            {
              message:
                "Failed to send private message.",
            }
          );
        }
      }
    );

    /**
     * Persistent personal notification.
     *
     * Saves notification to PostgreSQL
     * and sends it to the target user's room.
     */
    socket.on(
      "send_notification",
      async (
        data: NotificationInput
      ) => {
        try {
          if (
            !data ||
            typeof data.userId !==
              "number" ||
            !Number.isInteger(
              data.userId
            ) ||
            typeof data.message !==
              "string"
          ) {
            socket.emit(
              "notification_error",
              {
                message:
                  "Invalid notification data.",
              }
            );

            return;
          }

          const message =
            data.message.trim();

          if (!message) {
            socket.emit(
              "notification_error",
              {
                message:
                  "Notification message cannot be empty.",
              }
            );

            return;
          }

          if (
            data.userId === userId
          ) {
            socket.emit(
              "notification_error",
              {
                message:
                  "You cannot send a notification to yourself.",
              }
            );

            return;
          }

          /**
           * Save notification.
           */
          const savedNotification =
            await createNotification({
              userId:
                data.userId,
              type:
                "REAL_TIME_MESSAGE",
              message,
            });

          console.log(
            `Notification saved: ${userId} -> ${data.userId} | notification ${savedNotification.id}`
          );

          /**
           * Deliver notification
           * to the target user.
           */
          io.to(
            `user:${data.userId}`
          ).emit(
            "notification",
            {
              id:
                savedNotification.id,
              userId:
                savedNotification.userId,
              type:
                savedNotification.type,
              message:
                savedNotification.message,
              isRead:
                savedNotification.isRead,
              timestamp:
                savedNotification.createdAt,
            }
          );

          /**
           * Confirm notification to sender.
           */
          socket.emit(
            "notification_sent",
            {
              id:
                savedNotification.id,
              userId:
                savedNotification.userId,
              message:
                savedNotification.message,
            }
          );
        } catch (error) {
          console.error(
            "Failed to send notification:",
            error
          );

          socket.emit(
            "notification_error",
            {
              message:
                "Failed to send notification.",
            }
          );
        }
      }
    );

    /**
     * Disconnect.
     */
    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          `User ${userId} disconnected: ${socket.id}`
        );

        console.log(
          `Reason: ${reason}`
        );
      }
    );
  });
};