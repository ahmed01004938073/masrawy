import { API_URL } from "@/config/apiConfig";
import { fetchJson } from "@/utils/apiUtils";

export interface VisitStats {
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
}

const getSessionId = () => {
    let sessionId = sessionStorage.getItem("visit_session_id");
    if (!sessionId) {
        sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem("visit_session_id", sessionId);
    }
    return sessionId;
};

export const trackVisit = async (): Promise<void> => {
    try {
        const sessionId = getSessionId();
        // Use fetchJson to include Authorization header
        // Silently catch errors because if user is not logged in, 
        // 401 Unauthorized is expected based on user requirements.
        await fetchJson(`${API_URL}/analytics/track`, {
            method: "POST",
            body: JSON.stringify({ sessionId }),
        });
    } catch (error) {
        // Silently ignore 401/403 errors for guests
        // console.warn("Visit tracking skipped (Authorized only)");
    }
};

export const getVisitStats = async (): Promise<VisitStats> => {
    // getVisitStats MUST be authenticated as it's used in the admin dashboard
    return await fetchJson(`${API_URL}/analytics/stats`);
};

