import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/store/UserContext";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  clearAllNotifications,
  Notification as ServiceNotification
} from "@/services/notificationService";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
  created_at: string;
  read: boolean;
  link?: string;
  user_id?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        const data = await getNotifications(user.id);
        const mappedData: Notification[] = data.map((n: any) => ({
          ...n,
          type: n.type || 'info',
          created_at: n.created_at || n.timestamp || new Date().toISOString()
        }));
        setNotifications(mappedData);
      } else {
        setNotifications([]);
      }
    };

    fetchNotifications();

    let intervalId: NodeJS.Timeout;
    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(fetchNotifications, 30000);
    };

    if (user && !document.hidden) {
      startPolling();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalId) clearInterval(intervalId);
      } else if (user) {
        fetchNotifications();
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    if (user) {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const markAllAsRead = async () => {
    if (user) {
      setNotifications([]);
      await clearAllNotifications(user.id);
    }
  };

  const clearNotification = async (id: string) => {
    if (user) {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const unreadCount = notifications.length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
};
