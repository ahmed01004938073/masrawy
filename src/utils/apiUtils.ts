/**
 * Global API helper with automatic logout on inactive account
 */
export const fetchJson = async (url: string, options: RequestInit = {}) => {
    // Get token from various storage locations
    const token = sessionStorage.getItem("admin_auth_token") ||
        localStorage.getItem("admin_auth_token") ||
        sessionStorage.getItem("auth_token") ||
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("marketer_auth_token") ||
        localStorage.getItem("marketer_auth_token");

    const headers: HeadersInit = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    if (!token) console.warn("[API] No token found in storage for request to:", url);


    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
        let errorMessage = `API Error: ${res.statusText}`;

        try {
            const data = await res.json();
            if (data && data.error) {
                errorMessage = data.error;
                console.error("[API Error JSON]", data);


                // Auto-logout if account is inactive (403 Forbidden)
                if (res.status === 403 && errorMessage.includes('غير نشط')) {
                    console.warn('🚫 Account deactivated - forcing immediate logout');

                    // Clear all auth data
                    sessionStorage.clear();
                    localStorage.clear();

                    // Redirect to login
                    window.location.href = '/login';

                    // Throw error to prevent further processing
                    throw new Error(errorMessage);
                }
            }
        } catch (e) {
            // If the error is from our inactive account detection, re-throw it
            if (e instanceof Error && e.message.includes('غير نشط')) {
                throw e;
            }
            // Otherwise, ignore JSON parse errors and use default statusText
        }

        throw new Error(errorMessage);
    }

    return await res.json();
};
