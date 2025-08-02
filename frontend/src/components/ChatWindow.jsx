import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import socket from "../socket";
import { Send, XCircle, ChevronDown, Paperclip, FileText, Check, CheckCheck, Loader2, Image, User as UserIcon } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace(/\/api\/?$/, "");

const ChatWindow = ({ conversationId, currentUserId, chatPartnerName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);

  // Styles réutilisables
  const styles = {
    chatContainer: "flex flex-col h-[600px] bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden",
    chatHeader: "p-5 bg-gradient-to-r from-teal-600 to-teal-500 text-white flex items-center justify-between",
    messageArea: "flex-1 p-5 overflow-y-auto custom-scrollbar bg-gray-50",
    inputContainer: "p-4 bg-white border-t border-gray-200 flex items-center gap-3",
    messageBubble: {
      sent: "bg-gradient-to-r from-teal-500 to-teal-400 text-white rounded-2xl rounded-tr-none shadow-md",
      received: "bg-white text-gray-800 rounded-2xl rounded-tl-none shadow-sm border border-gray-100",
      sending: "bg-teal-300 text-white rounded-2xl rounded-tr-none shadow-md opacity-90"
    },
    button: {
      primary: "bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300",
      secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-300",
      disabled: "bg-gray-300 text-gray-400 cursor-not-allowed"
    }
  };

  const handleScroll = () => {
    const el = messageContainerRef.current;
    if (el) {
      const threshold = 100;
      const isNearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + threshold;
      setIsUserNearBottom(isNearBottom);
      setShowScrollToBottom(!isNearBottom);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const clearMessages = (setter) => {
    setTimeout(() => setter(null), 5000);
  };

  const markMessageAsRead = useCallback(async (messageId) => {
    if (!currentUserId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.put(
        `${API_URL}/messages/${messageId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === messageId && (!msg.readBy || !msg.readBy.includes(currentUserId))
            ? { ...msg, readBy: [...(msg.readBy || []), currentUserId] }
            : msg
        )
      );
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  }, [currentUserId]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      setShowScrollToBottom(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise.");
        clearMessages(setError);
        return;
      }

      const res = await axios.get(
        `${API_URL}/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Erreur chargement messages:", err);
      setError("Erreur lors du chargement des messages.");
      clearMessages(setError);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    socket.emit("joinConversation", conversationId);

    const handleNewMessage = (message) => {
      if (message.conversation.toString() === conversationId) {
        setMessages((prev) => {
          if (message.senderId?._id === currentUserId) return prev;
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.emit("leaveConversation", conversationId);
    };
  }, [conversationId, fetchMessages, currentUserId]);

  useEffect(() => {
    if (isUserNearBottom || messages.length === 0) {
      scrollToBottom();
    }
  }, [messages, isUserNearBottom, scrollToBottom]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageContent.trim() && !selectedFile) return;

    let tempFileUrl = undefined;
    if (selectedFile) {
      tempFileUrl = URL.createObjectURL(selectedFile);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise.");
        clearMessages(setError);
        return;
      }

      const formData = new FormData();
      if (newMessageContent.trim() !== '') {
        formData.append("content", newMessageContent);
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        _id: tempId,
        conversation: conversationId,
        senderId: { _id: currentUserId, username: user?.username || "Vous", profilePicture: user?.profilePicture },
        content: newMessageContent.trim(),
        messageType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
        fileUrl: tempFileUrl,
        createdAt: new Date().toISOString(),
        readBy: [currentUserId],
        status: 'sending'
      };

      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();

      const res = await axios.post(
        `${API_URL}/conversations/${conversationId}/messages`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...res.data, status: 'sent' } : msg
        )
      );

      setNewMessageContent("");
      setSelectedFile(null);
      setFilePreview(null);
      setError(null);

    } catch (err) {
      console.error("Erreur envoi message:", err);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      setError(err.response?.data?.message || "Erreur lors de l'envoi du message.");
      clearMessages(setError);
    } finally {
      if (tempFileUrl) {
        URL.revokeObjectURL(tempFileUrl);
      }
    }
  };

  const handleClearInput = () => {
    setNewMessageContent("");
  };

  const handleClearFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!conversationId) {
    return (
      <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-gray-200 shadow-lg justify-center items-center p-8 text-center">
        <div className="bg-teal-100 p-4 rounded-full mb-4">
          <UserIcon className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune conversation sélectionnée</h3>
        <p className="text-gray-500">
          Sélectionnez une conversation pour commencer à discuter
        </p>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className="flex items-center">
          <div className="bg-white/20 p-1 rounded-full mr-3">
            <UserIcon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold">
            {chatPartnerName || "Conversation"}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-white/80" />
          )}
        </div>
      </div>

      {/* Message Area */}
      <div
        className={styles.messageArea}
        ref={messageContainerRef}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <div className="bg-red-100 text-red-700 p-3 rounded-lg max-w-md text-center">
              {error}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center p-6">
            <Image className="w-12 h-12 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-500 mb-1">
              Aucun message pour le moment
            </h4>
            <p className="text-gray-400">
              Envoyez votre premier message pour commencer la conversation
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId && msg.senderId._id === currentUserId;
            const displayedFileUrl = msg.status === 'sending' && msg.fileUrl
              ? msg.fileUrl
              : (msg.fileUrl ? `${BASE_URL}/${msg.fileUrl.replace(/^\/+/, "")}` : null);

            const profilePictureUrl = msg.senderId?.profilePicture
              ? `${BASE_URL}/${msg.senderId.profilePicture.replace(/^\/+/, "")}`
              : "/default-profile.png";

            const hasBeenReadByRecipient = isMine && msg.readBy && msg.readBy.length > 1;

            return (
              <div
                key={msg._id}
                className={`mb-4 flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                {!isMine && (
                  <img
                    src={profilePictureUrl}
                    alt={msg.senderId?.username || "Utilisateur"}
                    className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-white shadow-md"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-profile.png";
                    }}
                  />
                )}
                <div
                  className={`max-w-[75%] p-4 ${styles.messageBubble[msg.status === 'sending' ? 'sending' : isMine ? 'sent' : 'received']}`}
                >
                  {!isMine && (
                    <span className="font-semibold text-sm block mb-1 text-teal-600">
                      {msg.senderId?.username || "Utilisateur"}
                    </span>
                  )}

                  {displayedFileUrl && (
                    <div className="mb-2 overflow-hidden rounded-lg">
                      {msg.messageType === 'image' ? (
                        <img
                          src={displayedFileUrl}
                          alt="Uploaded file"
                          className="max-w-full max-h-64 object-cover"
                        />
                      ) : (
                        <a
                          href={displayedFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center bg-white/20 p-2 rounded-md hover:bg-white/30 transition"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          <span className="truncate">
                            {msg.fileName || selectedFile?.name || "Fichier"}
                          </span>
                        </a>
                      )}
                    </div>
                  )}

                  {msg.content && <p className="break-words">{msg.content}</p>}

                  <div className="flex items-center justify-end mt-2 space-x-1">
                    <span className={`text-xs ${isMine ? "text-white/80" : "text-gray-500"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && (
                      <span className="ml-1">
                        {msg.status === 'sending' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : hasBeenReadByRecipient ? (
                          <CheckCheck className="w-3 h-3 text-blue-200" />
                        ) : (
                          <Check className="w-3 h-3 text-white/70" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-700 transition-all transform hover:scale-110 z-10"
          aria-label="Scroll to latest message"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className={styles.inputContainer}>
        {selectedFile && (
          <div className="w-full flex items-center justify-between p-3 bg-gray-100 rounded-xl mb-3">
            <div className="flex items-center">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg mr-3" />
              ) : (
                <FileText className="w-6 h-6 mr-3 text-gray-600" />
              )}
              <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                {selectedFile.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="text-gray-500 hover:text-red-500 transition-colors p-1"
              aria-label="Remove selected file"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="relative flex-1 flex items-center bg-gray-100 rounded-full pl-4 pr-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-teal-600 hover:text-teal-700 transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-1 bg-transparent py-3 px-3 text-gray-700 focus:outline-none placeholder-gray-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            autoFocus
          />
          {newMessageContent.length > 0 && (
            <button
              type="button"
              onClick={handleClearInput}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear message"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!newMessageContent.trim() && !selectedFile}
          className={`p-3 rounded-full ${(!newMessageContent.trim() && !selectedFile) 
            ? styles.button.disabled 
            : styles.button.primary}`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;