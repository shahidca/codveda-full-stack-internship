import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  connectSocket,
  joinConversation,
  leaveConversation,
  sendMessage,
  socket,
} from "../socket/socket";

interface Message {
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

const CONVERSATION_ID = 1;
const CURRENT_USER_ID = 1;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    connectSocket();

    const handleConnect = () => {
      console.log("Frontend connected to Socket.io");
      setConnected(true);

      joinConversation(CONVERSATION_ID);
    };

    const handleDisconnect = () => {
      console.log("Frontend disconnected from Socket.io");
      setConnected(false);
    };

    const handleNewMessage = (newMessage: Message) => {
      console.log("New real-time message:", newMessage);

      setMessages((currentMessages) => [
        ...currentMessages,
        newMessage,
      ]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("message:new", handleNewMessage);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      leaveConversation(CONVERSATION_ID);

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("message:new", handleNewMessage);
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    sendMessage(
      CONVERSATION_ID,
      CURRENT_USER_ID,
      trimmedMessage
    );

    setMessage("");
  };

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>TaskFlow Real-Time Chat</h1>

      <p>
        Status:{" "}
        <strong>
          {connected ? "Connected" : "Disconnected"}
        </strong>
      </p>

      <div
        style={{
          height: "350px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((item, index) => (
            <div
              key={`${item.createdAt}-${index}`}
              style={{
                marginBottom: "12px",
                padding: "10px",
                borderRadius: "8px",
                background:
                  item.senderId === CURRENT_USER_ID
                    ? "#e8f5e9"
                    : "#f1f1f1",
              }}
            >
              <strong>
                User {item.senderId}
              </strong>

              <div>{item.content}</div>

              <small>
                {new Date(item.createdAt).toLocaleTimeString()}
              </small>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />

        <button
          type="submit"
          disabled={!connected}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            cursor: connected ? "pointer" : "not-allowed",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}