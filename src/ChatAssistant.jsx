import React, { useState } from "react";
import "./ChatAssistant.css";

function ChatAssistant({ currentAQI, pm25, location, aqiStatus, dataSource, dataType, readingTime }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm AirCare AI 🌿 Ask me anything about air pollution, AQI, masks, indoor air or how to protect yourself.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e) {
    e.preventDefault();

    const text = input.trim();
    if (!text || loading) return;

    const updatedMessages = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          context: {
            currentAQI,
            pm25,
            location,
            aqiStatus,
            dataSource, dataType, readingTime,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to connect to AirCare AI server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-assistant">
      <div className="chat-header">
        <div className="chat-header-icon">🌿</div>
        <div>
          <h2>AirCare AI</h2>
          <p>Your personal air quality assistant</p>
        </div>
      </div>

      <div className="chat-context-bar">
        <span>📍 {location || "Unknown"}</span>
        <span>AQI: {currentAQI ?? "--"}</span>
        <span>PM2.5: {pm25 ?? "--"}</span>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${
              message.role === "user"
                ? "user-message"
                : "assistant-message"
            }`}
          >
            {message.role === "assistant" && (
              <div className="chat-avatar">🌿</div>
            )}

            <div className="chat-message-content">
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant-message">
            <div className="chat-avatar">🌿</div>
            <div className="chat-message-content">
              AirCare AI is thinking...
            </div>
          </div>
        )}
      </div>

      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about AQI, pollution or health..."
          disabled={loading}
        />

        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "..." : "Send"}
        </button>
      </form>

      <div className="chat-disclaimer">
        AI-generated advice is informational and not a substitute for medical care.
      </div>
    </div>
  );
}

export default ChatAssistant;