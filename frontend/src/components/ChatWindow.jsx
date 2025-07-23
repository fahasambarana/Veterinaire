import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import socket from "../socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace(/\/api\/?$/, ""); // => http://localhost:5000

const ChatWindow = ({ conversationId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentification requise.");
          return;
        }

        const res = await axios.get(
          `${API_URL}/conversations/${conversationId}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(res.data);
      } catch (err) {
        console.error("Erreur chargement messages:", err);
        setError("Erreur lors du chargement des messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    socket.emit("joinConversation", conversationId);

    const handleNewMessage = (message) => {
      if (message.conversation.toString() === conversationId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);
          return exists ? prev : [...prev, message];
        });
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.emit("leaveConversation", conversationId);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageContent.trim()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise.");
        return;
      }

      await axios.post(
        `${API_URL}/conversations/${conversationId}/messages`,
        { content: newMessageContent },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setNewMessageContent("");
    } catch (err) {
      console.error("Erreur envoi message:", err);
      setError("Erreur lors de l'envoi du message.");
    }
  };

  if (!conversationId) {
    return (
      <p className="text-gray-500 text-center mt-10">
        Sélectionnez une conversation
      </p>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-white shadow rounded-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-500">Chargement...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500">Aucun message pour le moment.</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId && msg.senderId._id === currentUserId;
            const profilePicturePath = msg.senderId?.profilePicture?.replace(/^\/+/, "");

            const profilePictureUrl = profilePicturePath
              ? `${BASE_URL}/${profilePicturePath}`
              : "/default-profile.png";

            return (
              <div
                key={msg._id}
                className={`mb-2 flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    isMine
                      ? "bg-teal-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {!isMine && (
                    <div className="flex items-center mb-1">
                      <img
                        src={profilePictureUrl}
                        alt={msg.senderId?.username || "Utilisateur"}
                        className="w-6 h-6 rounded-full object-cover mr-2"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/default-profile.png";
                        }}
                      />
                      <span className="font-semibold text-sm">
                        {msg.senderId?.username || "Utilisateur inconnu"}
                      </span>
                    </div>
                  )}
                  <p>{msg.content}</p>
                  <span className="block text-xs mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t flex">
        <input
          type="text"
          value={newMessageContent}
          onChange={(e) => setNewMessageContent(e.target.value)}
          placeholder="Votre message..."
          className="flex-1 border rounded-lg p-2 mr-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
