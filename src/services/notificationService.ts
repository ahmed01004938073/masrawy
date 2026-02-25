import { fetchJson } from "@/utils/apiUtils";
import { API_URL } from "@/config/apiConfig";

export interface Notification {
    id: string;
    user_id?: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    read: boolean;
    created_at: string;
    updated_at?: string;
}

// 1. Get notifications from backend pool
export const getNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const data = await fetchJson(`${API_URL}/notifications?t=${Date.now()}`);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
    }
};

// 2. Mark notification as read (Backend)
export const markNotificationAsRead = async (id: string, _userId?: string) => {
    try {
        await fetchJson(`${API_URL}/notifications/${id}/read`, {
            method: 'POST'
        });
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
    }
};

// 3. Delete notification (Backend)
export const deleteNotification = async (id: string, _userId?: string) => {
    try {
        await fetchJson(`${API_URL}/notifications/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error("Failed to delete notification:", error);
    }
};

// 4. Clear all notifications (Backend)
export const clearAllNotifications = async (userId: string) => {
    try {
        await fetchJson(`${API_URL}/notifications/clear-all`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error("Failed to clear notifications:", error);
    }
};

// Helper for backend transitions (can be kept as dummy)
export const broadcastNotification = async (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error', link?: string) => {
    console.log("📢 broadcastNotification (now backend driven):", title, message);
};

// Compatibility export
export const sendNotification = broadcastNotification;
