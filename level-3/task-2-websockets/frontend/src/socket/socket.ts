import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:4004";

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export const connectSocket = (): void => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinConversation = (
  conversationId: number
): void => {
  socket.emit("conversation:join", {
    conversationId,
  });
};

export const leaveConversation = (
  conversationId: number
): void => {
  socket.emit("conversation:leave", {
    conversationId,
  });
};

export const sendMessage = (
  conversationId: number,
  senderId: number,
  content: string
): void => {
  socket.emit("message:send", {
    conversationId,
    senderId,
    content,
  });
};

export const startTyping = (
  conversationId: number,
  userId: number
): void => {
  socket.emit("typing:start", {
    conversationId,
    userId,
  });
};

export const stopTyping = (
  conversationId: number,
  userId: number
): void => {
  socket.emit("typing:stop", {
    conversationId,
    userId,
  });
};