// frontend/src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import socket from "../socket"; // Assurez-vous que le chemin vers votre socket est correct
import { Send, XCircle, ChevronDown, Paperclip, FileText, Check, CheckCheck, Loader2 } from "lucide-react"; // Importation d'icônes Lucide, Loader2 ajouté

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace(/\/api\/?$/, ""); // => http://localhost:5000

const ChatWindow = ({ conversationId, currentUserId, chatPartnerName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null); // Référence pour défiler jusqu'au bas des messages
  const messageContainerRef = useRef(null); // Référence pour le conteneur des messages (pour le scroll)
  const [isUserNearBottom, setIsUserNearBottom] = useState(true); // État pour savoir si l'utilisateur est près du bas du scroll
  const [showScrollToBottom, setShowScrollToBottom] = useState(false); // État pour afficher le bouton "défiler vers le bas"

  // New state for file upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null); // For image previews
  const fileInputRef = useRef(null); // Ref for the hidden file input

  // Ref to store IntersectionObserver for messages
  const messageObserver = useRef(null);
  // Ref to store DOM nodes of messages to observe
  const messageRefs = useRef({});

  // Gère le défilement pour déterminer si l'utilisateur est près du bas
  const handleScroll = () => {
    const el = messageContainerRef.current;
    if (el) {
      const threshold = 100; // Seuil en pixels du bas
      const isNearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + threshold;
      setIsUserNearBottom(isNearBottom);
      setShowScrollToBottom(!isNearBottom); // Afficher le bouton si pas près du bas
    }
  };

  // Défile vers le bas des messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Utility to clear messages after a timeout
  const clearMessages = (setter) => {
    setTimeout(() => setter(null), 5000); // Clear after 5 seconds
  };

  // Function to mark a message as read
  const markMessageAsRead = useCallback(async (messageId) => {
    if (!currentUserId) return; // Ensure user is logged in

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found, cannot mark message as read.");
        return;
      }

      await axios.put(
        `${API_URL}/messages/${messageId}/read`, // Correct endpoint from messageRoutes.js
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optimistically update the message in state
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === messageId && (!msg.readBy || !msg.readBy.includes(currentUserId))
            ? { ...msg, readBy: [...(msg.readBy || []), currentUserId] }
            : msg
        )
      );
    } catch (err) {
      console.error("Error marking message as read:", err.response?.data?.message || err.message);
      // Optionally, display an error to the user or retry
    }
  }, [currentUserId]);


  // Encapsuler fetchMessages dans useCallback et ajuster ses dépendances
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
      setError(null);
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
          // Si le message provient de l'utilisateur actuel, il a déjà été ajouté optimistically.
          // Nous ne l'ajoutons pas une deuxième fois via Socket.IO pour éviter les doublons.
          // L'update optimiste se chargera de remplacer le message temporaire par le message réel.
          if (message.senderId?._id === currentUserId) {
            return prev;
          }

          // Pour les messages des autres utilisateurs, ou si le message n'a pas été géré optimistically,
          // vérifier s'il existe déjà par son _id réel pour éviter les doublons.
          if (prev.some((m) => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
        // FIX: La logique de scroll est maintenant gérée par le useEffect dédié à isUserNearBottom
        // et messages, donc pas besoin de l'appeler ici.
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.emit("leaveConversation", conversationId);
      if (messageObserver.current) {
        messageObserver.current.disconnect();
        messageObserver.current = null;
      }
      messageRefs.current = {};
    };
  }, [conversationId, fetchMessages, currentUserId]); // FIX: isUserNearBottom supprimé des dépendances


  useEffect(() => {
    if (!currentUserId || messages.length === 0) return;

    if (messageObserver.current) {
      messageObserver.current.disconnect();
    }

    messageObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            const message = messages.find(m => m._id === messageId);

            if (message && message.senderId?._id !== currentUserId && (!message.readBy || !message.readBy.includes(currentUserId))) {
              markMessageAsRead(messageId);
            }
          }
        });
      },
      { threshold: 0.8 }
    );

    messages.forEach(msg => {
      if (messageRefs.current[msg._id]) {
        messageObserver.current.observe(messageRefs.current[msg._id]);
      }
    });

    return () => {
      if (messageObserver.current) {
        messageObserver.current.disconnect();
      }
    };
  }, [messages, currentUserId, markMessageAsRead]);


  useEffect(() => {
    // Ce useEffect est spécifiquement pour le défilement automatique
    if (isUserNearBottom || messages.length === 0) {
      scrollToBottom();
    }
  }, [messages, isUserNearBottom]);

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
    } else {
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageContent.trim() && !selectedFile) return;

    // Store the temporary URL created by URL.createObjectURL
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
      // Seulement ajouter 'content' si non vide pour éviter les problèmes de validation Mongoose
      if (newMessageContent.trim() !== '') {
        formData.append("content", newMessageContent);
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      // Implémentation de la mise à jour optimiste
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; // ID temporaire unique
      const tempMessage = {
        _id: tempId,
        conversation: conversationId,
        senderId: { _id: currentUserId, username: user?.username || "Vous", profilePicture: user?.profilePicture }, // Simuler l'expéditeur pour l'affichage
        content: newMessageContent.trim(),
        messageType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
        fileUrl: tempFileUrl, // Utiliser l'URL temporaire ici
        createdAt: new Date().toISOString(),
        readBy: [currentUserId], // Marquer comme lu par l'expéditeur
        status: 'sending' // Statut pour indiquer que le message est en cours d'envoi
      };

      // Ajouter le message temporaire à l'état
      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom(); // Défiler vers le bas immédiatement

      const res = await axios.post(
        `${API_URL}/conversations/${conversationId}/messages`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Mettre à jour le message optimiste avec la réponse réelle du serveur
      // Le backend renvoie le message populé avec le vrai _id
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
      // Si erreur, retirer le message optimiste ou marquer comme échoué
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId)); // Retirer le message optimiste en cas d'erreur
      if (axios.isAxiosError(err) && err.response && err.response.status === 400) {
        setError(
          "Erreur lors de l'envoi du message. Le serveur n'a pas pu traiter la requête. " +
          "Vérifiez le type de fichier ou les validations backend."
        );
      } else {
        setError(err.response?.data?.message || "Erreur lors de l'envoi du message.");
      }
      clearMessages(setError);
      // Réinitialiser les champs même en cas d'erreur pour permettre une nouvelle tentative
      setNewMessageContent("");
      setSelectedFile(null);
      setFilePreview(null);
    } finally {
      // Revoke the temporary URL here to prevent memory leaks
      if (tempFileUrl) {
        URL.revokeObjectURL(tempFileUrl);
      }
    }
  };

  const handleClearInput = () => {
    setNewMessageContent("");
  };

  const handleClearFile = () => {
    if (selectedFile && filePreview) {
      // Revoke object URL when clearing the file input
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Récupérer les informations de l'utilisateur connecté pour l'affichage optimiste
  const [user, setUser] = useState(null);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);


  if (!conversationId) {
    return (
      <div className="flex flex-col h-[600px] bg-white shadow-xl rounded-2xl border border-gray-200 justify-center items-center">
        <p className="text-gray-500 text-lg font-medium">
          Sélectionnez une conversation pour commencer à discuter.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white shadow-xl rounded-2xl border border-gray-200 relative">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl flex items-center shadow-sm">
        <h3 className="text-xl font-semibold text-teal-700">
          {chatPartnerName || "Conversation"}
        </h3>
      </div>

      {/* Message Area */}
      <div
        className="flex-1 p-4 overflow-y-auto custom-scrollbar"
        ref={messageContainerRef}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-center text-gray-500 animate-pulse">Chargement des messages...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-center text-red-500 font-medium">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-center text-gray-500 italic">Aucun message pour le moment. Envoyez le premier !</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId && msg.senderId._id === currentUserId;
            // Utiliser l'URL temporaire si le message est en cours d'envoi et a un fileUrl
            const displayedFileUrl = msg.status === 'sending' && msg.fileUrl
              ? msg.fileUrl // Use the temporary URL stored in msg.fileUrl
              : (msg.fileUrl ? `${BASE_URL}/${msg.fileUrl.replace(/^\/+/, "")}` : null);


            const profilePicturePath = msg.senderId?.profilePicture?.replace(/^\/+/, "");
            const profilePictureUrl = profilePicturePath
              ? `${BASE_URL}/${profilePicturePath}`
              : "/default-profile.png";

            // Determine if the message is read by the current user (for incoming messages)
            const isReadByCurrentUser = msg.readBy && msg.readBy.includes(currentUserId);

            // Determine if the message has been read by the recipient (for outgoing messages)
            // This assumes a 1-on-1 chat. If readBy array contains more than just the sender's ID,
            // it implies the other participant has read it.
            const hasBeenReadByRecipient = isMine && msg.readBy && msg.readBy.length > 1;


            return (
              <div
                key={msg._id}
                data-message-id={msg._id}
                ref={el => messageRefs.current[msg._id] = el}
                className={`mb-3 flex ${isMine ? "justify-end" : "justify-start"} group`}
              >
                {!isMine && (
                  <img
                    src={profilePictureUrl}
                    alt={msg.senderId?.username || "Utilisateur"}
                    className="w-8 h-8 rounded-full object-cover mr-2 border-2 border-white shadow-sm flex-shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-profile.png";
                    }}
                  />
                )}
                <div
                  className={`relative max-w-[70%] p-3 shadow-md transition-all duration-300 ease-in-out
                    ${isMine
                      ? "bg-teal-600 text-white rounded-t-xl rounded-bl-xl"
                      : "bg-gray-200 text-gray-800 rounded-t-xl rounded-br-xl"
                    }
                    ${!isMine && !isReadByCurrentUser ? "font-semibold border-2 border-blue-400" : ""}
                    `}
                >
                  {/* Display sender name for incoming messages */}
                  {!isMine && (
                    <span className="font-semibold text-sm block mb-1 text-gray-700">
                      {msg.senderId?.username || "Utilisateur inconnu"}
                    </span>
                  )}

                  {/* Display file if available */}
                  {displayedFileUrl && (
                    <div className="mb-2">
                      {msg.messageType === 'image' ? (
                        <img
                          src={displayedFileUrl}
                          alt="Uploaded file"
                          className="max-w-full h-auto rounded-lg mb-1"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/150x100/eeeeee/cccccc?text=Image+Error";
                          }}
                        />
                      ) : (
                        <div className="flex items-center bg-gray-300 text-gray-800 p-2 rounded-md">
                          <FileText className="w-5 h-5 mr-2" />
                          <a
                            href={displayedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {msg.fileName || selectedFile?.name || "Fichier joint"}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Display message content */}
                  {msg.content && <p className="break-words">{msg.content}</p>}

                  {/* Adjusted timestamp and checkmark display */}
                  <div className="flex items-center justify-end mt-1">
                    <span className={`text-xs ${isMine ? "text-gray-300" : "text-gray-500"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && (
                      <span className="ml-1 flex items-center">
                        {msg.status === 'sending' ? (
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> // Icône d'envoi
                        ) : hasBeenReadByRecipient ? (
                          <CheckCheck className="w-4 h-4 text-blue-300" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-500" />
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
          className="absolute bottom-24 right-6 bg-teal-500 text-white p-3 rounded-full shadow-lg hover:bg-teal-600 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-400 z-10"
          aria-label="Scroll to latest message"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex items-center flex-wrap">
        {selectedFile && (
          <div className="w-full flex items-center justify-between p-2 bg-gray-100 rounded-lg mb-3 shadow-inner">
            <div className="flex items-center">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded mr-2" />
              ) : (
                <FileText className="w-6 h-6 mr-2 text-gray-600" />
              )}
              <span className="text-sm text-gray-700 truncate max-w-[calc(100%-80px)]">{selectedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-1 rounded-full hover:bg-gray-200"
              aria-label="Remove selected file"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="relative flex-1 mr-3 flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-200 transition-colors duration-200 mr-2"
            aria-label="Attach file"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            placeholder="Votre message..."
            className="flex-1 border border-gray-300 rounded-full py-3 px-5 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 shadow-sm"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Clear message"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!newMessageContent.trim() && !selectedFile}
          className={`px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 transform shadow-md
            ${(newMessageContent.trim() || selectedFile)
              ? "bg-teal-600 hover:bg-teal-700 text-white hover:scale-105"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
