
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:4004";

const getAccessToken = (): string | null => {
  return localStorage.getItem(
    "accessToken"
  );
};

export const socket = io(
  SOCKET_URL,
  {
    autoConnect: false,

    auth: (callback) => {
      const token =
        getAccessToken();

      callback({
        token,
      });
    },

    transports: [
      "websocket",
      "polling",
    ],
  }
);

