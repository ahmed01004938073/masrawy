import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useUser } from "@/contexts/store/UserContext";
import { increaseStock } from "@/services/productService";
import { addOrderCommission } from "@/services/marketerService";
import { API_URL } from "@/config/apiConfig";

// Helper to generate an 8-character short ID
const generateShortId = (prefix: string = "") => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}-${result}` : result;
};

// واجهة القطعة داخل الطلب
export interface OrderProduct {
  id: string;
  productId?: string; // Link to original product ID
  name: string;
  price: number;
  basePrice: number;
  commission: number;
  quantity: number;
  status: "pending" | "delivered" | "cancelled";
  image: string;
  color?: string;
  size?: string;
  total?: number;
}

// واجهة الطلب
export interface Order {
  id: string;
  customer: string;
  phone: string;
  alternativePhone?: string;
  province: string;
  city: string;
  address: string;
  notes: string;
  shippingFee?: number; // سعر الشحن
  cartItems: OrderProduct[];
  status: "pending" | "confirmed" | "processing" | "shipped" | "in_delivery" | "delivered" | "partially_delivered" | "delivery_rejected" | "cancelled" | "suspended";
  commission: number;
  date: string;
  page: string;
  product?: string; // اسم المنتج الرئيسي (للعرض المختصر)
  price?: number; // السعر الإجمالي
  image?: string; // صورة المنتج الرئيسي
  // Backend fields
  marketerId?: string;
  marketerName?: string;
  createdAt?: string;
  updatedAt?: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerPhone2?: string;
  customerAddress?: string;
  customerNotes?: string;
  section?: string;
  subtotal?: number;
  totalSellPrice?: number;
  totalAmount?: number;

  paymentMethod?: string;

  paymentStatus?: string;
  cancellationReason?: string; // سبب الإلغاء
}

interface OrdersContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "date" | "status" | "commission">) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void; // تحديث نوع الحالة
  updateProductStatus: (orderId: string, productId: string, status: "pending" | "delivered" | "cancelled") => void; // إضافة وظيفة تحديث حالة القطعة
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // API_URL is now imported from centralized config

  // تحميل الطلبات من API
  const fetchOrders = useCallback(async () => {
    try {
      if (!user) {
        setOrders([]);
        setCurrentUserId(null);
        return;
      }

      if (user) {
        // If user is logged in, fetch from API with marketer filtering
        const token = sessionStorage.getItem("marketer_auth_token") || localStorage.getItem("marketer_auth_token");
        const response = await fetch(`${API_URL}/orders?marketerId=${user.id}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        // Note: The backend currently returns ALL orders. We should filter by marketerId for the store view.
        // Ideally backend shares filter logic. For now, filter client side or update backend.
        // Backend: "SELECT * FROM orders".

        if (response.ok) {
          const allOrders: any[] = await response.json();
          // Filtered on server now, but we still map to frontend structure
          const userOrders = allOrders.map(o => {
            // Ensure cartItems exists
            const items = o.cartItems || o.items || [];
            return {
              ...o,
              // Map backend fields to frontend viewmodel if missing
              cartItems: items,
              image: o.image || (items.length > 0 ? items[0].image : "") || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100",
              product: o.product || (items.length > 0 ? (items[0].productName || items[0].name) + (items.length > 1 ? ` و${items.length - 1} منتجات أخرى` : "") : "طلب غير محدد"),
              customerName: o.customerName || o.customer || "",
              customer: o.customer || o.customerName || "",
              price: Number(o.price || o.totalAmount || o.total || 0) || 0,
              totalAmount: Number(o.totalAmount || o.price || o.total || 0) || 0,
              phone: o.phone || o.customerPhone || "",
              customerPhone: o.customerPhone || o.phone || "",
              alternativePhone: o.alternativePhone || o.customerPhone2 || "",
              customerPhone2: o.customerPhone2 || o.alternativePhone || "",
              address: o.address || o.customerAddress || "",
              customerAddress: o.customerAddress || o.address || "",
              commission: Number(o.commission || 0),
              date: o.date || (o.createdAt ? o.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
              updatedAt: o.updatedAt || o.updated_at || o.date || o.createdAt,
            };
          });

          const sortedOrders = userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setOrders(sortedOrders);
          setCurrentUserId(user.id);
        }
      } else {
        setOrders([]);
        setCurrentUserId(null);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, [user]);

  useEffect(() => {
    // Initial fetch
    fetchOrders();

    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      // Poll every 3 seconds (Smart Polling for scale)
      intervalId = setInterval(fetchOrders, 30000);
    };

    const stopPolling = () => {
      if (intervalId) clearInterval(intervalId);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Immediate update when user comes back
        fetchOrders();
        startPolling();
      }
    };

    // Start if initially visible
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchOrders]);


  const addOrder = useCallback(async (orderData: Omit<Order, "id" | "date" | "status" | "commission">) => {
    // Generate ID client side or let server do it. The code uses client side ID generation.
    const newOrder: Order = {
      ...orderData,
      id: generateShortId("ORD"),
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      commission: Number((orderData as any).commission) || orderData.cartItems.reduce((sum, item) => sum + (Number(item.commission) || 0), 0),
      price: Number(orderData.price || 0),
      marketerId: orderData.marketerId || user?.id,
      marketerName: orderData.marketerName || user?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Fill missing fields that backend expects
      orderNumber: generateShortId("ORD"),
      customerName: orderData.customerName || orderData.customer,
      customerPhone: orderData.customerPhone || orderData.phone,
      customerPhone2: orderData.customerPhone2 || orderData.alternativePhone || "",
      customerAddress: orderData.customerAddress || orderData.address,
      customerNotes: orderData.customerNotes || orderData.notes,
      notes: orderData.notes || orderData.customerNotes,
      items: orderData.cartItems.map((item: any) => ({
        ...item,
        productName: item.name,
        productId: item.productId || item.id, // Ensure productId is set
        price: Number(item.price) || 0,
        total: (Number(item.price) || 0) * (Number(item.quantity) || 1)
      })),
      section: "orders",
      subtotal: Number(orderData.totalSellPrice || orderData.cartItems.reduce((sum, item) => {
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 1;
        return sum + (itemPrice * itemQty);
      }, 0)),
      totalAmount: (Number(orderData.totalSellPrice || orderData.cartItems.reduce((sum, item) => {
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 1;
        return sum + (itemPrice * itemQty);
      }, 0))) + (Number(orderData.shippingFee) || 0),
      paymentMethod: "cash",
      paymentStatus: "unpaid"
    } as any;


    // We need to match the backend expectation.
    // The backend `POST /api/orders` expects `items` (JSON stringified).
    // But `newOrder` here uses `cartItems`.
    // We should send the object structure expected by the server.

    // Server expects:
    /*
      orderNumber, customerName... items (array)
    */

    const apiOrder = {
      ...newOrder,
      items: newOrder.cartItems.map((item: any) => ({
        ...item,
        productName: item.name,
        productId: item.productId || item.id
      }))
    };

    console.log('📦 Final API Order Payload:', JSON.stringify(apiOrder, null, 2));

    if (user) {
      try {
        console.log('💰 Creating order with atomic transaction...');
        console.log('📦 Order items:', newOrder.cartItems.map(i => ({
          id: i.id,
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          color: i.color,
          size: i.size
        })));

        // Use NEW atomic endpoint: /api/orders/create-with-stock
        // This handles BOTH order creation AND stock deduction in a single transaction
        const token = sessionStorage.getItem("marketer_auth_token") || localStorage.getItem("marketer_auth_token");
        const response = await fetch(`${API_URL}/orders/create-with-stock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(apiOrder)
        });

        if (!response.ok) {
          let errorMsg = 'Failed to create order';
          const clonedResponse = response.clone();
          try {
            const errorData = await response.json();
            errorMsg = errorData.details || errorData.error || errorMsg;
          } catch (jsonErr) {
            // If response is not JSON (e.g. HTML error page), use the clone
            const rawText = await clonedResponse.text();
            console.error('🔥 Server returned non-JSON error:', rawText.substring(0, 200));
            errorMsg = `Server Error (${response.status}): ${rawText.substring(0, 100)}...`;
          }
          throw new Error(errorMsg);
        }

        const result = await response.json();
        console.log('✅', result.message);

        // تسجيل العمولة للمسوق - Handled by backend in createOrderWithStock
        /*
        if (newOrder.marketerId) {
          await addOrderCommission(
            newOrder.marketerId,
            newOrder.id,
            newOrder.orderNumber || newOrder.id,
            newOrder.commission,
            false,
            "processing"
          );
        }
        */

        await fetchOrders();
      } catch (e) {
        console.error("❌ Failed to create order:", e);
        throw e;
      }
    }
  }, [user, fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order["status"]) => {
    // We need to fetch the order, update it, and save it back.
    // Or just send an update if backend supported PATCH. Backend supports Replace.

    // Find local order first to avoid extra fetch if possible, or fetch from API.
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const getSection = (status: Order["status"]): string => {
      switch (status) {
        case "pending":
        case "suspended":
          return "orders";
        case "confirmed":
        case "processing":
          return "warehouse";
        case "shipped":
          return "shipping";
        case "in_delivery":
          return "delivery";
        case "delivered":
        case "partially_delivered":
        case "delivery_rejected":
          return "collection";
        case "cancelled":
          return "archive";
        default:
          return "orders";
      }
    };

    const updatedOrder = {
      ...order,
      status,
      section: getSection(status),
      updatedAt: new Date().toISOString()
    };

    if (user) {
      try {
        // Need to map back to API structure if needed
        const apiOrder = { ...updatedOrder, items: updatedOrder.cartItems };

        const token = sessionStorage.getItem("marketer_auth_token") || localStorage.getItem("marketer_auth_token");
        await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(apiOrder)
        });
        setOrders(prev => prev.map(o => o.id === orderId ? (updatedOrder as any) : o));
      } catch (e) {
        console.error("Failed to update order status", e);
      }
    } else {
      setOrders(prev => {
        const up = prev.map(o => o.id === orderId ? (updatedOrder as any) : o);
        localStorage.setItem(`guest_orders`, JSON.stringify(up));
        return up;
      });
    }
  }, [orders, user]);

  // تحديث حالة قطعة محددة داخل الطلب
  const updateProductStatus = useCallback(async (orderId: string, productId: string, status: "pending" | "delivered" | "cancelled") => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedCartItems = order.cartItems.map(item =>
      item.id === productId ? { ...item, status } : item
    );

    // إعادة حساب العمولة الإجمالية بناءً على القطع المستلمة
    const totalCommission = updatedCartItems
      .filter(item => item.status === "delivered")
      .reduce((sum, item) => sum + Number(item.commission || 0), 0);

    let orderStatus: Order["status"] = "pending";
    const deliveredItems = updatedCartItems.filter(item => item.status === "delivered").length;
    const cancelledItems = updatedCartItems.filter(item => item.status === "cancelled").length;
    const totalItems = updatedCartItems.length;

    if (deliveredItems > 0 && deliveredItems === totalItems) {
      orderStatus = "delivered";
    } else if (cancelledItems === totalItems) {
      orderStatus = "cancelled";
    } else if (deliveredItems > 0 && (cancelledItems > 0 || deliveredItems < totalItems)) {
      orderStatus = "partially_delivered";
    }

    // Stock Restoration: If status is 'cancelled', restore stock for this item
    // We check if the NEW status is 'cancelled' and the OLD status wasn't 'cancelled'
    const oldItem = order.cartItems.find(i => i.id === productId);
    if (status === "cancelled" && oldItem && oldItem.status !== "cancelled") {
      // Restore stock for this item using original product ID
      const targetProductId = oldItem.productId || oldItem.id;
      await increaseStock(targetProductId, oldItem.quantity, oldItem.color, oldItem.size);
    }

    const getSection = (status: Order["status"]): string => {
      switch (status) {
        case "pending":
        case "suspended":
          return "orders";
        case "confirmed":
        case "processing":
          return "warehouse";
        case "shipped":
          return "shipping";
        case "in_delivery":
          return "delivery";
        case "delivered":
        case "partially_delivered":
        case "delivery_rejected":
          return "collection";
        case "cancelled":
          return "archive";
        default:
          return "orders";
      }
    };

    const updatedOrder = {
      ...order,
      cartItems: updatedCartItems,
      commission: totalCommission,
      status: orderStatus,
      section: getSection(orderStatus),
      updatedAt: new Date().toISOString()
    };

    if (user) {
      try {
        const apiOrder = { ...updatedOrder, items: updatedOrder.cartItems };
        const token = sessionStorage.getItem("marketer_auth_token") || localStorage.getItem("marketer_auth_token");
        await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(apiOrder)
        });
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      } catch (e) {
        console.error("Failed to update product status", e);
      }
    } else {
      setOrders(prev => {
        const up = prev.map(o => o.id === orderId ? updatedOrder : o);
        localStorage.setItem(`guest_orders`, JSON.stringify(up));
        return up;
      });
    }

  }, [orders, user]);

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        updateOrderStatus,
        updateProductStatus
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within OrdersProvider");
  }
  return context;
};
