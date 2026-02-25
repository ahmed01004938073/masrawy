// Error handling utilities for API calls

export class APIError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public endpoint?: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export interface APIResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
}

/**
 * Wrapper for fetch calls with comprehensive error handling
 */
export async function safeFetch<T>(
    url: string,
    options?: RequestInit
): Promise<APIResponse<T>> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch {
                // If error response is not JSON, use status text
            }

            throw new APIError(errorMessage, response.status, url);
        }

        const data = await response.json();
        return {
            data,
            success: true,
        };
    } catch (error) {
        console.error(`API Error [${url}]:`, error);

        if (error instanceof APIError) {
            return {
                error: error.message,
                success: false,
            };
        }

        // Network errors or other unexpected errors
        return {
            error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
            success: false,
        };
    }
}

/**
 * Retry wrapper for critical API calls
 */
export async function fetchWithRetry<T>(
    url: string,
    options?: RequestInit,
    maxRetries = 3,
    retryDelay = 1000
): Promise<APIResponse<T>> {
    let lastError: APIResponse<T> | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const result = await safeFetch<T>(url, options);

        if (result.success) {
            return result;
        }

        lastError = result;

        // Don't retry on client errors (4xx)
        if (result.error && result.error.includes('HTTP 4')) {
            break;
        }

        // Wait before retrying
        if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
    }

    return lastError || { error: 'فشلت جميع المحاولات', success: false };
}
