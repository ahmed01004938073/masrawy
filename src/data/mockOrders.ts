import { Order } from "@/pages/Orders";
// We don't import mockProducts here to avoid circular dependencies if any, 
// but we mirror the data structure for the generator.

// إنشاء طلبات وهمية ذكية للتقارير
export const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const today = new Date();

  // Helper to subtract days
  const descDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d;
  };

  // PRODUCTS MUST MATCH productService.ts IDs (which are "1" to "50" generally, we pick first 5)
  const sampleProducts = [
    {
      id: "1",
      name: "قميص أنيق",
      price: 299,
      colors: ["أحمر", "أزرق", "أبيض"],
      sizes: ["S", "M", "L", "XL"],
      commission: 25
    },
    {
      id: "2",
      name: "حذاء رياضي",
      price: 450,
      colors: ["أسود", "أبيض"],
      sizes: ["40", "41", "42", "43"],
      commission: 35
    },
    {
      id: "3",
      name: "ساعة يد ذكية",
      price: 1200,
      colors: ["أسود", "فضي"],
      sizes: ["Standard"],
      commission: 100
    },
    {
      id: "4",
      name: "حقيبة ظهر",
      price: 350,
      colors: ["أزرق داكن", "أحمر"],
      sizes: ["Standard"],
      commission: 30
    },
    {
      id: "5",
      name: "سماعات لاسلكية",
      price: 550,
      colors: ["أسود", "أبيض"],
      sizes: ["Standard"],
      commission: 45
    }
  ];

  const marketers = [
    { id: "m1", name: "محمد علي" },
    { id: "m2", name: "فاطمة حسن" },
    { id: "m3", name: "خالد إبراهيم" },
    { id: "m4", name: "سارة محمود" }
  ];

  const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const createOrderItems = (prodIndices: number[], prefix: string) => {
    return prodIndices.map((prodIdx, i) => {
      const product = sampleProducts[prodIdx];
      return {
        id: `${prefix}-item-${i}`,
        productId: product.id,
        productName: product.name,
        quantity: Math.floor(Math.random() * 3) + 1, // Random quantity 1-3
        price: product.price,
        total: product.price, // Will be updated by quantity * price logic if needed
        color: getRandomItem(product.colors),
        size: getRandomItem(product.sizes),
        image: `https://api.dicebear.com/7.x/shapes/svg?seed=product${product.id}`,
        // Add commission explicitly to items
        commission: product.commission || 0
      };
    }).map(item => ({ ...item, total: item.price * item.quantity }));
  };

  // 1. طلبات اليوم (Today)
  const todayScenarios = [
    { status: 'delivered', items: [0, 4], marketerIdx: 0 }, // Phone + Watch
    { status: 'delivered', items: [1, 2], marketerIdx: 1 }, // Shoes + Shirt
    { status: 'delivered', items: [1, 2, 3], marketerIdx: 0 }, // Shoes + Shirt + Bag
    { status: 'pending', items: [0], marketerIdx: 2 },      // Phone
    { status: 'cancelled', items: [2], marketerIdx: 3 }     // Shirt
  ];

  todayScenarios.forEach((sc, idx) => {
    const marketer = marketers[sc.marketerIdx];
    const orderItems = createOrderItems(sc.items, `today-${idx}`);
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

    orders.push({
      id: `ord-today-${idx}`,
      orderNumber: `ORD-T-${100 + idx}`,
      customerName: `عميل اليوم ${idx + 1}`,
      customerPhone: `010${Math.floor(Math.random() * 100000000)}`,
      customerAddress: "القاهرة، مدينة نصر",
      items: orderItems,
      status: sc.status as Order["status"],
      totalAmount: totalAmount + 50,
      shippingFee: 50,
      commission: totalAmount * 0.1,
      paymentMethod: "cash",
      paymentStatus: "unpaid",
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
      marketerId: marketer.id,
      marketerName: marketer.name,
      section: sc.status === 'delivered' ? 'collection'
        : sc.status === 'cancelled' ? 'archive'
          : sc.status === 'pending' ? 'orders'
            : 'orders'
    });
  });

  // 2. طلبات أمس (Yesterday)
  for (let i = 0; i < 5; i++) {
    const prodIdx = i % 5;
    const orderItems = createOrderItems([prodIdx, (prodIdx + 1) % 5], `yest-${i}`);
    const total = orderItems.reduce((sum, item) => sum + item.total, 0);

    orders.push({
      id: `ord-yest-${i}`,
      orderNumber: `ORD-Y-${100 + i}`,
      customerName: `عميل أمس ${i + 1}`,
      customerPhone: `011${Math.floor(Math.random() * 100000000)}`,
      customerAddress: "الجيزة، الدقي",
      items: orderItems,
      status: 'delivered',
      totalAmount: total + 50,
      shippingFee: 50,
      commission: total * 0.1,
      paymentMethod: "card",
      paymentStatus: "paid",
      createdAt: descDate(1).toISOString(),
      updatedAt: descDate(1).toISOString(),
      marketerId: marketers[1].id,
      marketerName: marketers[1].name,
      section: 'collection'
    });
  }

  // 3. طلبات الأسبوع الماضي (Last Week)
  for (let d = 0; d < 8; d++) {
    const prodIdx = d % 5;
    const orderItems = createOrderItems([prodIdx], `week-${d}`);
    const total = orderItems.reduce((sum, item) => sum + item.total, 0);

    orders.push({
      id: `ord-week-${d}`,
      orderNumber: `ORD-W-${100 + d}`,
      customerName: `عميل سابق ${d}`,
      customerPhone: `012${Math.floor(Math.random() * 100000000)}`,
      customerAddress: "الاسكندرية",
      items: orderItems,
      status: 'delivered',
      totalAmount: total + 50,
      shippingFee: 50,
      commission: total * 0.1,
      paymentMethod: "cash",
      paymentStatus: "paid",
      createdAt: descDate(d + 2).toISOString(), // 2 to 9 days ago
      updatedAt: descDate(d + 2).toISOString(),
      marketerId: marketers[0].id,
      marketerName: marketers[0].name,
      section: 'collection'
    });
  }

  return orders;
};

export const mockOrders = generateMockOrders();

