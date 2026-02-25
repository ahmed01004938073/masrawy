import { Order, OrderStatus, OrderSection } from "@/pages/Orders";
export type { Order, OrderStatus, OrderSection };
import { sendNotification } from "./notificationService";
import { QueryClient } from '@tanstack/react-query';
import { mockDeliveryOrders } from '@/services/mockDeliveryOrders';
import { generateMockOrders } from '@/data/mockOrders';
import { getProductById, updateProduct } from '@/services/productService';
import { API_URL } from "@/config/apiConfig";
import { fetchJson } from "@/utils/apiUtils";



// --- Orders ---
export const getOrders = async (page?: number, limit?: number, search?: string, marketerId?: string, status?: string, section?: string, sections?: string[], shippingCompany?: string): Promise<Order[] | { data: Order[], total: number, page: number, totalPages: number }> => {
    try {
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (marketerId) params.append('marketerId', marketerId);
        if (status) params.append('status', status);
        if (section) params.append('section', section);
        if (sections && sections.length > 0) params.append('sections', sections.join(','));
        if (shippingCompany && shippingCompany !== 'all') params.append('shippingCompany', shippingCompany);

        const url = `${API_URL}/orders?${params.toString()}`;
        const rawResponse = await fetchJson(url);

        const mapOrder = (o: any) => {
            const items = o.cartItems || o.items || [];
            return {
                ...o,
                cartItems: items,
                items: items,
                customerName: o.customerName || o.customer || "",
                customer: o.customer || o.customerName || "",
                price: Number(o.price || o.totalAmount || o.total || 0) || 0,
                totalAmount: Number(o.totalAmount || o.price || o.total || 0) || 0,
                commission: Number(o.commission || 0),
                phone: o.phone || o.customerPhone || "",
                customerPhone: o.customerPhone || o.phone || "",
                alternativePhone: o.alternativePhone || o.customerPhone2 || "",
                customerPhone2: o.customerPhone2 || o.alternativePhone || "",
                address: o.address || o.customerAddress || "",
                customerAddress: o.customerAddress || o.address || "",
                marketerId: o.marketerId || o.marketer_id || null,
                marketer_id: o.marketer_id || o.marketerId || null,
                marketerName: o.marketerName || o.marketer_name || "",
                marketer_name: o.marketer_name || o.marketerName || "",
                updatedAt: (() => {
                    const date = o.updatedAt || o.updated_at || o.createdAt || new Date();
                    const d = new Date(date);
                    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
                })()
            };
        };

        if (rawResponse.data && Array.isArray(rawResponse.data)) {
            return {
                ...rawResponse,
                data: rawResponse.data.map(mapOrder).sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            };
        }

        const orders = rawResponse.map(mapOrder);
        return orders.sort((a: Order, b: Order) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (e) {
        return [];
    }
};

export interface OrderStats {
    sections: Record<OrderSection, number>;
    summary: {
        totalSales: number;
        totalCommission: number;
        totalOrders: number;
    };
}

export const getOrderStats = async (marketerId?: string): Promise<OrderStats> => {
    const url = marketerId ? `${API_URL}/orders/stats?marketerId=${marketerId}` : `${API_URL}/orders/stats`;
    return await fetchJson(url);
};

export const getFinancialReport = async (filters: { year?: number, month?: number, dateRange?: string, marketerId?: string }): Promise<any> => {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month !== undefined) params.append('month', filters.month.toString());
    if (filters.dateRange) params.append('dateRange', filters.dateRange);
    if (filters.marketerId) params.append('marketerId', filters.marketerId);

    return await fetchJson(`${API_URL}/orders/reports/financial?${params.toString()}`);
};

export const searchOrders = async (query: string): Promise<Order[]> => {
    if (!query || query.trim() === '') {
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/orders/search?q=${encodeURIComponent(query.trim())}`);

        if (!response.ok) {
            console.error('Search failed:', response.statusText);
            return [];
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
};

export const saveOrders = async (orders: Order[]): Promise<void> => {
    // Deprecated: API uses single item updates.
    // Providing partial backward compatibility by saving one by one if manageable, or ignoring.
    console.warn("saveOrders(Order[]) is not fully supported in API mode. Use addOrder/updateOrder.");
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
    const result = await getOrders();
    const orders = Array.isArray(result) ? result : result.data;
    // Using loose equality for id matching if needed, or strict string
    return orders.find(order => order.id === id || order.orderNumber === id);
};

// --- Order Operations ---

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<Order | undefined> => {
    const order = await getOrderById(id);
    if (!order) return undefined;

    // logic moved to backend saveOrder centralized logic
    const updatedOrder = { ...order, status, updatedAt: new Date().toISOString() };

    // API Call
    try {
        const response = await fetchJson(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOrder)
        });

        // Return JSON from server to ensure we have the backend-calculated section
        return response.order || updatedOrder;
    } catch (e) {
        console.error("Failed to update order status API", e);
        return undefined;
    }
};

export const getOrdersBySection = async (section: string, page?: number, limit?: number, search?: string): Promise<Order[] | { data: Order[], total: number, page: number, totalPages: number }> => {
    return await getOrders(page, limit, search, undefined, undefined, section);
};

export const getOrdersBySections = async (sections: string[], page?: number, limit?: number, search?: string, status?: OrderStatus | 'all', shippingCompany?: string): Promise<Order[] | { data: Order[], total: number, page: number, totalPages: number }> => {
    return await getOrders(page, limit, search, undefined, status === 'all' ? undefined : status, undefined, sections, shippingCompany);
};

export const getOrdersByStatus = async (status: OrderStatus | 'all'): Promise<Order[]> => {
    const result = await getOrders(undefined, undefined, undefined, undefined, status === 'all' ? undefined : status);
    const orders = Array.isArray(result) ? result : result.data;
    return orders;
};

export const addOrder = async (order: Order): Promise<void> => {
    const orderWithSection = { ...order, section: "payment_confirmation" as OrderSection };
    // Use atomic endpoint to ensure stock is deducted correctly on server
    await fetchJson(`${API_URL}/orders/create-with-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderWithSection)
    });
};

export const updateOrder = async (updatedOrder: Order): Promise<Order> => {
    await fetchJson(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
    });
    return updatedOrder;
};

export const deleteOrder = async (id: string): Promise<void> => {
    await fetchJson(`${API_URL}/orders/${id}`, { method: 'DELETE' });
};

// --- Legacy Notifications Code Removed ---
// The following functions (getUserNotifications, addNotification, markNotificationAsRead)
// were duplicated and using a different storage key. They are now removed.
// The Store Context now uses src/services/notificationService.ts directly.


// --- Stats ---
export const getOrdersCountBySection = async (): Promise<Record<OrderSection, number>> => {
    try {
        const stats = await getOrderStats();
        return stats.sections;
    } catch (e) {
        console.error("Failed to fetch order counts from API, falling back to client-side calc", e);
        const result = await getOrders();
        const orders = Array.isArray(result) ? result : result.data;
        const counts: Record<OrderSection, number> = {
            payment_confirmation: 0, orders: 0, warehouse: 0, shipping: 0, delivery: 0, collection: 0, archive: 0
        };
        orders.forEach(o => {
            const section = o.section || "orders";
            if (counts[section] !== undefined) counts[section]++;
        });
        return counts;
    }
};

export const confirmPayment = async (orderId: string, amount: number): Promise<any> => {
    return await fetchJson(`${API_URL}/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
    });
};

export const getOrdersCountByStatus = async (): Promise<Record<OrderStatus | 'all', number>> => {
    const result = await getOrders();
    const orders = Array.isArray(result) ? result : result.data;
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(o => {
        counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts as any;
};

export const invalidateAllOrderQueries = (queryClient: QueryClient): void => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["orders-count"] });
    queryClient.invalidateQueries({ queryKey: ["section-counts"] });
    queryClient.invalidateQueries({ queryKey: ["warehouse-orders"] });
    queryClient.invalidateQueries({ queryKey: ["shipping-orders"] });
    queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
    queryClient.invalidateQueries({ queryKey: ["collection-orders"] });
    queryClient.invalidateQueries({ queryKey: ["archive-orders"] });
    queryClient.invalidateQueries({ queryKey: ["marketers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
};

export const initializeSampleOrders = async (): Promise<void> => {
    const result = await getOrders();
    const orders = Array.isArray(result) ? result : result.data;
    if (orders.length > 5) return;

    const newOrders = generateMockOrders();
    for (const o of newOrders) {
        await addOrder(o);
    }
    console.log(`Initialized ${newOrders.length} sample orders`);
};

export const initializeDeliveryOrders = async (): Promise<void> => {
    const result = await getOrders();
    const orders = Array.isArray(result) ? result : result.data;
    const hasDelivery = orders.some(o => o.section === "delivery");
    if (!hasDelivery) {
        const existingIds = new Set(orders.map(o => o.id));
        const toAdd = mockDeliveryOrders.filter(o => !existingIds.has(o.id));
        for (const o of toAdd) {
            await addOrder(o);
        }
    }
};
