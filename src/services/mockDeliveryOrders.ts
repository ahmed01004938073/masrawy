import { Order } from "@/pages/Orders";

// طلبات تجريبية لقسم جاري التوصيل
export const mockDeliveryOrders: Order[] = [
  {
    id: "del1",
    orderNumber: "ORD-201",
    customerName: "أحمد محمود",
    customerPhone: "+20 123 456 7890",
    customerAddress: "شارع النصر، القاهرة، مصر",
    province: "القاهرة",
    city: "مدينة نصر",
    marketerId: "m1",
    marketerName: "محمد علي",
    items: [
      {
        id: "item1",
        productId: "1",
        productName: "هاتف ذكي",
        quantity: 1,
        price: 5000,
        total: 5000,
        image: "/placeholder.svg",
        color: "أسود",
        size: ""
      }
    ],
    status: "in_delivery",
    section: "delivery",
    totalAmount: 5000,
    shippingFee: 50,
    commission: 0,
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    shippingCompany: "sc1",
    shippingCompanyName: "شركة التوصيل السريع",
    trackingNumber: "TRK-001",
    shippingDate: "2023-06-15T10:30:00Z",
    createdAt: "2023-06-10T10:30:00Z",
    updatedAt: "2023-06-15T14:30:00Z"
  },
  {
    id: "del2",
    orderNumber: "ORD-202",
    customerName: "سارة أحمد",
    customerPhone: "+20 111 222 3333",
    customerAddress: "شارع الهرم، الجيزة، مصر",
    province: "الجيزة",
    city: "الهرم",
    marketerId: "m2",
    marketerName: "فاطمة حسن",
    items: [
      {
        id: "item2",
        productId: "2",
        productName: "سماعات لاسلكية",
        quantity: 2,
        price: 500,
        total: 1000,
        image: "/placeholder.svg",
        color: "أبيض",
        size: ""
      }
    ],
    status: "in_delivery",
    section: "delivery",
    totalAmount: 1000,
    shippingFee: 30,
    commission: 0,
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    shippingCompany: "sc2",
    shippingCompanyName: "شركة النقل المتحدة",
    trackingNumber: "TRK-002",
    shippingDate: "2023-06-16T11:45:00Z",
    createdAt: "2023-06-12T09:30:00Z",
    updatedAt: "2023-06-16T15:30:00Z"
  },
  {
    id: "del3",
    orderNumber: "ORD-203",
    customerName: "خالد محمد",
    customerPhone: "+20 100 200 3000",
    customerAddress: "شارع فيصل، الجيزة، مصر",
    province: "الجيزة",
    city: "فيصل",
    marketerId: "m1",
    marketerName: "محمد علي",
    items: [
      {
        id: "item3",
        productId: "3",
        productName: "ساعة ذكية",
        quantity: 1,
        price: 2000,
        total: 2000,
        image: "/placeholder.svg",
        color: "أسود",
        size: ""
      }
    ],
    status: "in_delivery",
    section: "delivery",
    totalAmount: 2000,
    shippingFee: 40,
    commission: 0,
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    shippingCompany: "sc3",
    shippingCompanyName: "شركة الشحن الدولية",
    trackingNumber: "TRK-003",
    shippingDate: "2023-06-17T09:15:00Z",
    createdAt: "2023-06-14T10:30:00Z",
    updatedAt: "2023-06-17T14:30:00Z"
  }
];
