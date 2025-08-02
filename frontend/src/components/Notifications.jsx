import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, CheckCircle, Trash2, Loader2, XCircle, Calendar, CalendarCheck, CalendarX, AlertTriangle, CheckCircle as CheckCircleIcon, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Spinner = () => (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
  </div>
);

const ConfirmationModal = ({ show, onClose, onConfirm, message }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full mx-4 border border-gray-200">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-red-100 rounded-full mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Confirmation
          </h3>
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>
          <div className="flex justify-center space-x-4 w-full">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-md"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationContent = ({ notif }) => {
  const getIconAndColor = (type) => {
    switch (type) {
      case "appointment_created":
        return { 
          icon: <Calendar className="w-6 h-6 text-blue-600" />, 
          color: "bg-blue-100",
          textColor: "text-blue-700"
        };
      case "appointment_approved":
        return { 
          icon: <CalendarCheck className="w-6 h-6 text-green-600" />, 
          color: "bg-green-100",
          textColor: "text-green-700"
        };
      case "appointment_cancelled":
      case "appointment_rejected":
        return { 
          icon: <CalendarX className="w-6 h-6 text-red-600" />, 
          color: "bg-red-100",
          textColor: "text-red-700"
        };
      case "appointment_completed":
        return { 
          icon: <CheckCircleIcon className="w-6 h-6 text-purple-600" />, 
          color: "bg-purple-100",
          textColor: "text-purple-700"
        };
      default:
        return { 
          icon: <Bell className="w-6 h-6 text-yellow-600" />, 
          color: "bg-yellow-100",
          textColor: "text-yellow-700"
        };
    }
  };

  const { icon, color, textColor } = getIconAndColor(notif.type);
  const isAppointmentNotification = notif.type && notif.type.startsWith("appointment_");

  return (
    <div className="flex items-start gap-3 w-full">
      <div className={`flex-shrink-0 p-2 rounded-full ${color}`}>
        {icon}
      </div>
      <div className="flex-grow min-w-0">
        <p className={`font-semibold text-base ${textColor}`}>{notif.title}</p>
        <p className="text-gray-800 mt-1 text-sm">{notif.message}</p>
        <p className="text-xs text-gray-500 mt-2 font-medium">
          {format(new Date(notif.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
        </p>
      </div>
    </div>
  );
};

const Notifications = () => {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (loading || !user) return;
    
    try {
      setError(null);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/notifications/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Erreur de chargement:", err);
      setError("Impossible de charger les notifications. Veuillez réessayer.");
      setNotifications([]);
    }
  }, [user, loading]);

  useEffect(() => {
    if (loading || !user) return;

    const socket = io(API_URL);
    socket.on("connect", () => {
      socket.emit("joinUserRoom", user.id);
    });

    socket.on("newNotification", (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => socket.disconnect();
  }, [user, loading]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map(notif => 
        notif._id === id ? { ...notif, isRead: true } : notif
      ));
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.filter(notif => notif._id !== id));
    } catch (err) {
      console.error("Erreur de suppression:", err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/notifications/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  const toggleMenu = (id) => {
    setExpandedMenu(expandedMenu === id ? null : id);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl bg-white min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="relative">
            <Bell className="w-8 h-8 text-teal-600 mr-3" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notifications
          </h1>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Tout effacer
          </button>
        )}
      </div>

      {loading && <Spinner />}

      {error && (
        <div className="flex items-center p-4 mb-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <AlertTriangle className="w-5 h-5 mr-3" />
          <span>{error}</span>
        </div>
      )}

      {!loading && notifications.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <Bell className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">
            Aucune notification
          </h3>
          <p className="text-gray-500 mt-1">
            Vous serez notifié quand il y aura du nouveau
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`relative p-4 rounded-xl transition-all duration-200 border ${
                notif.isRead
                  ? "bg-gray-50 hover:bg-gray-100 border-gray-200"
                  : "bg-white border-teal-400 shadow-sm ring-1 ring-teal-200"
              }`}
            >
              <NotificationContent notif={notif} />
              
              <div className="absolute top-3 right-3">
                <button 
                  onClick={() => toggleMenu(notif._id)}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {expandedMenu === notif._id && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    {!notif.isRead && (
                      <button
                        onClick={() => {
                          markAsRead(notif._id);
                          setExpandedMenu(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-gray-600" />
                        Marquer comme lu
                      </button>
                    )}
                    <button
                      onClick={() => {
                        deleteNotification(notif._id);
                        setExpandedMenu(null);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={deleteAllNotifications}
        message="Êtes-vous sûr de vouloir supprimer toutes les notifications ? Cette action est irréversible."
      />
    </div>
  );
};

export default Notifications;