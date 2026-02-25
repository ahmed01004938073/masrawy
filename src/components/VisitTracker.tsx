import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackVisit } from "@/services/analyticsService";

/**
 * Component that tracks visits to the store.
 * It ignores admin routes.
 */
const VisitTracker = () => {
    const location = useLocation();

    useEffect(() => {
        // Only track if not an admin route
        if (!location.pathname.startsWith("/admin")) {
            trackVisit();
        }
    }, [location.pathname]);

    return null;
};

export default VisitTracker;
