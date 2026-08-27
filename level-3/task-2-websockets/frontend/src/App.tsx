import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { socket } from "./socket";
import "./App.css";

type User = {
  id: number;
  name: string;
  email: string;
};

type AuthResponse = {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
  };
};

type ChatMessage = {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
};

type NotificationMessage = {
  id?: number;
  userId?: number;
  type?: string;
  message: string;
  isRead?: boolean;
  timestamp: string;
};

type PrivateMessage = {
  id?: number;
  conversationId?: number;
  senderId: number;
  receiverId?: number;
  message: string;
  timestamp: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4004";

function App() {
  /* =====================================================
     Authentication
  ===================================================== */

  const [user, setUser] = useState<User | null>(null);

  const [authMode, setAuthMode] = useState<
    "login" | "register"
  >("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [authLoading, setAuthLoading] =
    useState(false);

  const [authError, setAuthError] =
    useState("");

  /* =====================================================
     Socket state
  ===================================================== */

  const [connected, setConnected] =
    useState(socket.connected);

  const [socketId, setSocketId] =
    useState("");

  const [socketError, setSocketError] =
    useState("");

  /* =====================================================
     Chat state
  ===================================================== */

  const [targetUserId, setTargetUserId] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  /* =====================================================
     Notification state
  ===================================================== */

  const [notification, setNotification] =
    useState<NotificationMessage | null>(null);

  const [notificationStatus, setNotificationStatus] =
    useState("");

  /* =====================================================
     Private message state
  ===================================================== */

  const [privateMessage, setPrivateMessage] =
    useState<PrivateMessage | null>(null);

  const [privateMessageStatus, setPrivateMessageStatus] =
    useState("");

  /* =====================================================
     Check existing login
  ===================================================== */

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    const token =
      localStorage.getItem("accessToken");

    if (!storedUser || !token) {
      return;
    }

    try {
      const parsedUser: User =
        JSON.parse(storedUser);

      setUser(parsedUser);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem(
        "accessToken"
      );
    }
  }, []);

  /* =====================================================
     Socket events
  ===================================================== */

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleConnect = () => {
      setConnected(true);
      setSocketId(socket.id ?? "");
      setSocketError("");

      console.log(
        "Authenticated socket connected:",
        socket.id
      );
    };

    const handleDisconnect = () => {
      setConnected(false);
      setSocketId("");

      console.log(
        "Socket disconnected"
      );
    };

    const handleConnectError = (
      error: Error
    ) => {
      console.error(
        "Socket authentication error:",
        error.message
      );

      setConnected(false);
      setSocketError(error.message);
    };

    /* =================================================
       Socket authentication confirmation
    ================================================= */

    const handleSocketAuthenticated = (
      data: {
        success: boolean;
        userId: number;
        socketId: string;
        room: string;
      }
    ) => {
      console.log(
        "Socket authenticated:",
        data
      );

      setSocketId(data.socketId);
      setSocketError("");
    };

    /* =================================================
       Public message
    ================================================= */

    const handleReceiveMessage = (
      newMessage: ChatMessage
    ) => {
      console.log(
        "Public message received:",
        newMessage
      );

      setMessages(
        (previousMessages) => [
          ...previousMessages,
          newMessage,
        ]
      );
    };

    /* =================================================
       Private message received
    ================================================= */

    const handlePrivateMessage = (
      newPrivateMessage: PrivateMessage
    ) => {
      console.log(
        "Private message received:",
        newPrivateMessage
      );

      setPrivateMessage(
        newPrivateMessage
      );

      setPrivateMessageStatus(
        "New private message received."
      );
    };

    /* =================================================
       Private message sent confirmation
    ================================================= */

    const handlePrivateMessageSent = (
      sentMessage: PrivateMessage
    ) => {
      console.log(
        "Private message sent successfully:",
        sentMessage
      );

      setPrivateMessage(
        sentMessage
      );

      setPrivateMessageStatus(
        `Private message sent to user ${sentMessage.receiverId}.`
      );
    };

    /* =================================================
       Private message error
    ================================================= */

    const handlePrivateMessageError = (
      data: {
        message: string;
      }
    ) => {
      console.error(
        "Private message error:",
        data
      );

      setPrivateMessageStatus(
        data.message ||
          "Failed to send private message."
      );
    };

    /* =================================================
       Notification received
    ================================================= */

    const handleNotification = (
      newNotification: NotificationMessage
    ) => {
      console.log(
        "Personal notification received:",
        newNotification
      );

      setNotification(
        newNotification
      );

      setNotificationStatus(
        "New personal notification received."
      );
    };

    /* =================================================
       Notification sent confirmation
    ================================================= */

    const handleNotificationSent = (
      sentNotification: {
        id: number;
        userId: number;
        message: string;
      }
    ) => {
      console.log(
        "Notification sent successfully:",
        sentNotification
      );

      setNotificationStatus(
        `Notification sent successfully to user ${sentNotification.userId}.`
      );
    };

    /* =================================================
       Notification error
    ================================================= */

    const handleNotificationError = (
      data: {
        message: string;
      }
    ) => {
      console.error(
        "Notification error:",
        data
      );

      setNotificationStatus(
        data.message ||
          "Failed to send notification."
      );
    };

    /* =================================================
       Register listeners
    ================================================= */

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "connect_error",
      handleConnectError
    );

    socket.on(
      "socket_authenticated",
      handleSocketAuthenticated
    );

    socket.on(
      "receive_message",
      handleReceiveMessage
    );

    socket.on(
      "private_message",
      handlePrivateMessage
    );

    socket.on(
      "private_message_sent",
      handlePrivateMessageSent
    );

    socket.on(
      "private_message_error",
      handlePrivateMessageError
    );

    socket.on(
      "notification",
      handleNotification
    );

    socket.on(
      "notification_sent",
      handleNotificationSent
    );

    socket.on(
      "notification_error",
      handleNotificationError
    );

    /* =================================================
       Connect socket
    ================================================= */

    if (!socket.connected) {
      socket.connect();
    }

    /* =================================================
       Cleanup
    ================================================= */

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "connect_error",
        handleConnectError
      );

      socket.off(
        "socket_authenticated",
        handleSocketAuthenticated
      );

      socket.off(
        "receive_message",
        handleReceiveMessage
      );

      socket.off(
        "private_message",
        handlePrivateMessage
      );

      socket.off(
        "private_message_sent",
        handlePrivateMessageSent
      );

      socket.off(
        "private_message_error",
        handlePrivateMessageError
      );

      socket.off(
        "notification",
        handleNotification
      );

      socket.off(
        "notification_sent",
        handleNotificationSent
      );

      socket.off(
        "notification_error",
        handleNotificationError
      );
    };
  }, [user]);

  /* =====================================================
     Authentication
  ===================================================== */

  const handleAuth = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setAuthError("");
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";

      const body =
        authMode === "login"
          ? {
              email,
              password,
            }
          : {
              name,
              email,
              password,
            };

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const result: AuthResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Authentication failed."
        );
      }

      const authenticatedUser =
        result.data.user;

      const accessToken =
        result.data.accessToken;

      /* ---------------------------------------------
         Store JWT
      --------------------------------------------- */

      localStorage.setItem(
        "accessToken",
        accessToken
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          authenticatedUser
        )
      );

      setUser(authenticatedUser);

      setName("");
      setEmail("");
      setPassword("");

      /* ---------------------------------------------
         Reconnect socket using new JWT
      --------------------------------------------- */

      if (socket.connected) {
        socket.disconnect();
      }

      socket.connect();
    } catch (error) {
      console.error(
        "Authentication error:",
        error
      );

      setAuthError(
        error instanceof Error
          ? error.message
          : "Authentication failed."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  /* =====================================================
     Logout
  ===================================================== */

  const handleLogout = () => {
    socket.disconnect();

    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "user"
    );

    setUser(null);

    setConnected(false);
    setSocketId("");

    setMessages([]);

    setNotification(null);
    setNotificationStatus("");

    setPrivateMessage(null);
    setPrivateMessageStatus("");

    setTargetUserId("");
    setMessage("");

    setSocketError("");
  };

  /* =====================================================
     Public message
  ===================================================== */

  const handleSendMessage = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage ||
      !connected
    ) {
      return;
    }

    const newMessage: ChatMessage = {
      id:
        `${Date.now()}-${Math.random()}`,
      text: trimmedMessage,
      sender:
        user?.name ||
        String(user?.id) ||
        "User",
      timestamp:
        new Date().toISOString(),
    };

    socket.emit(
      "send_message",
      newMessage
    );

    setMessage("");
  };

  /* =====================================================
     Private message
  ===================================================== */

  const handleSendPrivateMessage = () => {
    const trimmedTargetUserId =
      targetUserId.trim();

    const trimmedMessage =
      message.trim();

    const receiverId =
      Number(trimmedTargetUserId);

    if (
      !trimmedTargetUserId ||
      !trimmedMessage ||
      !connected ||
      !Number.isInteger(receiverId) ||
      receiverId <= 0
    ) {
      setPrivateMessageStatus(
        "Enter a valid target user ID and message."
      );

      return;
    }

    if (
      user &&
      receiverId === user.id
    ) {
      setPrivateMessageStatus(
        "You cannot send a private message to yourself."
      );

      return;
    }

    setPrivateMessageStatus(
      "Sending private message..."
    );

    socket.emit(
      "send_private_message",
      {
        receiverId,
        message: trimmedMessage,
      }
    );

    console.log(
      `Private message sent: ${user?.id} -> ${receiverId}`
    );

    setMessage("");
  };

  /* =====================================================
     Personal notification
  ===================================================== */

  const handleSendNotification = () => {
    const trimmedTargetUserId =
      targetUserId.trim();

    const trimmedMessage =
      message.trim();

    const targetId =
      Number(trimmedTargetUserId);

    if (
      !trimmedTargetUserId ||
      !trimmedMessage ||
      !connected ||
      !Number.isInteger(targetId) ||
      targetId <= 0
    ) {
      setNotificationStatus(
        "Enter a valid target user ID and message."
      );

      return;
    }

    if (
      user &&
      targetId === user.id
    ) {
      setNotificationStatus(
        "You cannot send a notification to yourself."
      );

      return;
    }

    setNotificationStatus(
      "Sending notification..."
    );

    socket.emit(
      "send_notification",
      {
        userId: targetId,
        message: trimmedMessage,
      }
    );

    console.log(
      `Notification sent: ${user?.id} -> ${targetId}`
    );

    setMessage("");
  };

  /* =====================================================
     Login / Register screen
  ===================================================== */

  if (!user) {
    return (
      <main className="app-container">
        <section className="chat-card auth-card">
          <header className="chat-header">
            <div>
              <h1>
                TaskFlow Live
              </h1>

              <p>
                Real-Time WebSocket
                Communication
              </p>
            </div>
          </header>

          <div className="auth-tabs">
            <button
              type="button"
              className={
                authMode === "login"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={
                authMode === "register"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setAuthMode(
                  "register"
                );
                setAuthError("");
              }}
            >
              Register
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={handleAuth}
          >
            {authMode ===
              "register" && (
              <div className="user-control">
                <label htmlFor="name">
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div className="user-control">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="user-control">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>

            {authError && (
              <div className="error-box">
                {authError}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                ? "Login"
                : "Create Account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  /* =====================================================
     Authenticated application
  ===================================================== */

  return (
    <main className="app-container">
      <section className="chat-card">
        {/* ===============================================
            Header
        =============================================== */}

        <header className="chat-header">
          <div>
            <h1>
              TaskFlow Live
            </h1>

            <p>
              Real-Time WebSocket
              Communication
            </p>
          </div>

          <div>
            <span
              className={
                connected
                  ? "status connected"
                  : "status"
              }
            >
              {connected
                ? "Connected"
                : "Disconnected"}
            </span>

            <button
              type="button"
              className="logout-button"
              onClick={
                handleLogout
              }
            >
              Logout
            </button>
          </div>
        </header>

        {/* ===============================================
            Connection Information
        =============================================== */}

        <div className="connection-info">
          <div>
            <strong>
              Logged in as:
            </strong>{" "}
            {user.name}
          </div>

          <div>
            <strong>
              User ID:
            </strong>{" "}
            {user.id}
          </div>

          <div>
            <strong>
              Email:
            </strong>{" "}
            {user.email}
          </div>

          <div>
            <strong>
              Socket Status:
            </strong>{" "}
            {connected
              ? "Connected"
              : "Disconnected"}
          </div>

          {socketId && (
            <div>
              <strong>
                Socket ID:
              </strong>{" "}
              {socketId}
            </div>
          )}

          {socketError && (
            <div className="error-box">
              <strong>
                Socket Error:
              </strong>{" "}
              {socketError}
            </div>
          )}
        </div>

        {/* ===============================================
            Notification Status
        =============================================== */}

        {notificationStatus && (
          <div className="notification-status">
            {notificationStatus}
          </div>
        )}

        {/* ===============================================
            Notification Received
        =============================================== */}

        {notification && (
          <div className="notification-box">
            <strong>
              Personal Notification
            </strong>

            <p>
              {notification.message}
            </p>

            <small>
              {new Date(
                notification.timestamp
              ).toLocaleTimeString()}
            </small>
          </div>
        )}

        {/* ===============================================
            Private Message Status
        =============================================== */}

        {privateMessageStatus && (
          <div className="private-message-status">
            {privateMessageStatus}
          </div>
        )}

        {/* ===============================================
            Private Message
        =============================================== */}

        {privateMessage && (
          <div className="private-message-box">
            <strong>
              Private Message
            </strong>

            <p>
              {privateMessage.message}
            </p>

            <small>
              From User{" "}
              {privateMessage.senderId}

              {" • "}

              {new Date(
                privateMessage.timestamp
              ).toLocaleTimeString()}
            </small>
          </div>
        )}

        {/* ===============================================
            Target User
        =============================================== */}

        <div className="user-control">
          <label htmlFor="targetUserId">
            Target User ID
          </label>

          <input
            id="targetUserId"
            type="number"
            value={targetUserId}
            onChange={(event) =>
              setTargetUserId(
                event.target.value
              )
            }
            placeholder="Enter another user's ID"
            min="1"
          />
        </div>

        {/* ===============================================
            Public Messages
        =============================================== */}

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-message">
              No public messages yet.
            </div>
          ) : (
            messages.map(
              (item) => (
                <div
                  className="message-item"
                  key={item.id}
                >
                  <div className="message-top">
                    <strong>
                      {item.sender}
                    </strong>

                    <span>
                      {new Date(
                        item.timestamp
                      ).toLocaleTimeString()}
                    </span>
                  </div>

                  <p>
                    {item.text}
                  </p>
                </div>
              )
            )
          )}
        </div>

        {/* ===============================================
            Message Input
        =============================================== */}

        <form
          className="message-form"
          onSubmit={
            handleSendMessage
          }
        >
          <input
            type="text"
            value={message}
            onChange={(event) =>
              setMessage(
                event.target.value
              )
            }
            placeholder="Type a message..."
            disabled={!connected}
          />

          <button
            type="submit"
            disabled={
              !connected ||
              !message.trim()
            }
          >
            Public Message
          </button>
        </form>

        {/* ===============================================
            Action Buttons
        =============================================== */}

        <div className="action-buttons">
          <button
            type="button"
            onClick={
              handleSendPrivateMessage
            }
            disabled={
              !connected ||
              !message.trim() ||
              !targetUserId.trim()
            }
          >
            Private Message
          </button>

          <button
            type="button"
            onClick={
              handleSendNotification
            }
            disabled={
              !connected ||
              !message.trim() ||
              !targetUserId.trim()
            }
          >
            Send Notification
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;