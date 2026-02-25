

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StorageIndicator } from '@/components/reports/StorageIndicator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar as CalendarIcon,
  Download,
  AlertTriangle,
  Package,
  Users,
  Search,
  BarChart2,
  BarChart3,
  ListTodo,
  Factory,
  Clock,
  MapPin,
  Phone,
  User,
  Box,
  Truck,
  Eye,
  Activity,
  Shield,
  Layout,
  Timer,
  Flame,
  Zap,
  Star,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { getOrders, getFinancialReport } from '@/services/orderService';
import { getProducts } from '@/services/productService';
import { getMarketers } from '@/services/marketerService';
import { getManufacturers } from '@/services/manufacturerService';
import { getCategories } from '@/services/categoryService';
import { getWithdrawalRequests } from '@/services/withdrawalService';
import { getEmployees } from '@/services/employeeService';
import { getVisitStats } from '@/services/analyticsService';
import { Order, OrderStatus } from './Orders';
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';

// --- Helper Interfaces ---
interface ProfitItem {
  orderId: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  wholesalePrice: number; // سعر الجملة (التكلفة)
  sellingPrice: number;   // سعر البيع (للقطعة الواحدة في الطلب)
  commission: number;     // العمولة (للقطعة أو الإجمالية المقدرة)
  totalRevenue: number;   // إجمالي البيع لهذا البند
  netProfit: number;      // الربح الصافي
  status: OrderStatus;
  date: string;
  marketerName?: string;
  shippingFee: number;
  finalPrice: number;
  category: string;
  manufacturerName: string;
}

interface PurchaseItem {
  key: string; // Unique key for grouping (Product-Size-Color)
  productId: string;
  productName: string;
  variantKey: string;
  size: string;
  color: string;
  quantity: number;
  wholesalePrice: number;
  totalCost: number;
  manufacturerName: string;
  manufacturerId: string;
  image: string;
}

// --- Helper Functions ---
const translateStatus = (status: OrderStatus) => {
  switch (status) {
    case "pending": return "قيد الانتظار";
    case "confirmed": return "تم التأكيد";
    case "processing": return "قيد التجهيز";
    case "shipped": return "تم الشحن";
    case "in_delivery": return "جاري التوصيل";
    case "delivered": return "تم التسليم";
    case "partially_delivered": return "تم التسليم جزئياً";
    case "delivery_rejected": return "تم رفض التسليم";
    case "cancelled": return "ملغي";
    case "suspended": return "معلق";
    case "returned": return "مرتجع";
    default: return status;
  }
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "confirmed": return "bg-blue-100 text-blue-800";
    case "processing": return "bg-purple-100 text-purple-800";
    case "shipped": return "bg-indigo-100 text-indigo-800";
    case "in_delivery": return "bg-orange-100 text-orange-800";
    case "delivered": return "bg-green-100 text-green-800";
    case "partially_delivered": return "bg-teal-100 text-teal-800";
    case "delivery_rejected": return "bg-pink-100 text-pink-800";
    case "cancelled": return "bg-red-100 text-red-800";
    case "returned": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const translateSection = (section?: string) => {
  switch (section) {
    case 'orders': return 'إدارة الطلبات';
    case 'warehouse': return 'المخزن';
    case 'shipping': return 'الشحن';
    case 'delivery': return 'التوصيل';
    case 'collection': return 'التحصيل';
    case 'archive': return 'الأرشيف';
    default: return 'غير محدد';
  }
};

const translateRole = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'admin': return 'مدير النظام';
    case 'manager': return 'مدير';
    case 'sales': return 'مبيعات';
    case 'warehouse': return 'مخزن';
    case 'shipping': return 'شحن';
    case 'delivery': return 'توصيل';
    case 'customer_service': return 'خدمة عملاء';
    case 'accountant': return 'محاسب';
    default: return role || 'غير محدد';
  }
};

// --- Main Component ---
const Reports = () => {
  const { formatPrice } = usePriceFormatter();
  const navigate = useNavigate();


  // --- State ---
  const [dateRange, setDateRange] = useState('month'); // today, week, month, all
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [marketerFilter, setMarketerFilter] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // For year filtering
  // Search & Modal State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Order | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Purchase Report State
  const [purchaseManufacturerFilter, setPurchaseManufacturerFilter] = useState<string>('all');
  const [activeChart, setActiveChart] = useState<'daily' | 'manufacturers' | 'averages' | 'success'>('daily');

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  // --- Data Fetching ---
  const { data: ordersData = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders() });
  const { data: productsData = [] } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
  const { data: marketersData = [] } = useQuery({ queryKey: ['marketers'], queryFn: () => getMarketers() });
  const { data: withdrawalRequestsData = [] } = useQuery({ queryKey: ['withdrawals'], queryFn: () => getWithdrawalRequests() });
  const { data: manufacturersData = [] } = useQuery({ queryKey: ['manufacturers'], queryFn: () => getManufacturers() });
  const { data: categoriesData = [] } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories() });
  const { data: employeesData = [] } = useQuery({ queryKey: ['employees-status'], queryFn: () => getEmployees(), refetchInterval: 30000 });

  // تصفية الموظفين لاستبعاد مدير النظام
  const filteredEmployeesData = useMemo(() => {
    return employeesData.filter((emp: any) => emp.role?.toLowerCase() !== 'admin');
  }, [employeesData]);

  const { data: visitorStats } = useQuery({ queryKey: ['visitor-stats'], queryFn: () => getVisitStats(), refetchInterval: 300000 }); // 5 minutes

  // Normalize data to arrays for client-side filtering/reports
  const rawOrders = useMemo(() => {
    if (Array.isArray(ordersData)) return ordersData;
    return (ordersData as any)?.data || [];
  }, [ordersData]) as Order[];

  const products = useMemo(() => {
    if (Array.isArray(productsData)) return productsData;
    return (productsData as any)?.data || [];
  }, [productsData]) as any[];

  const marketers = useMemo(() => {
    if (Array.isArray(marketersData)) return marketersData;
    return (marketersData as any)?.data || [];
  }, [marketersData]) as any[];

  const withdrawalRequests = useMemo(() => {
    if (Array.isArray(withdrawalRequestsData)) return withdrawalRequestsData;
    return (withdrawalRequestsData as any)?.data || [];
  }, [withdrawalRequestsData]) as any[];

  const manufacturers = useMemo(() => {
    if (Array.isArray(manufacturersData)) return manufacturersData;
    return (manufacturersData as any)?.data || [];
  }, [manufacturersData]) as any[];

  const categories = useMemo(() => {
    if (Array.isArray(categoriesData)) return categoriesData;
    const list = (categoriesData as any)?.data || [];
    // Ensure we have a flat array of names or objects
    return list;
  }, [categoriesData]) as any[];

  // Generate available years from orders
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    years.add(currentYear - 1); // Always include at least one year back

    rawOrders.forEach(order => {
      if (order.createdAt) {
        const orderYear = new Date(order.createdAt).getFullYear();
        years.add(orderYear);
      }
    });

    return Array.from(years).sort((a, b) => b - a); // Newest first
  }, [rawOrders]);

  // --- Calculations & Logic ---

  // 1. Filter and Calculate Profit Data (Client-side)
  const profitData: ProfitItem[] = useMemo(() => {
    let items: ProfitItem[] = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    rawOrders.forEach(order => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) return;
      if (marketerFilter !== 'all' && order.marketerId !== marketerFilter) return;

      // Include delivered, returned, and rejected for success rate calculations
      const relevantStatuses = ['delivered', 'partially_delivered', 'returned', 'rejected'];
      if (!relevantStatuses.includes(order.status)) return;

      // Date filtering
      const orderDate = new Date(order.updatedAt || order.createdAt);
      if (orderDate > today) return;

      let matchDate = false;
      if (dateRange === 'today') {
        matchDate = orderDate.toDateString() === today.toDateString() && orderDate.getFullYear() === selectedYear;
      } else if (dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        matchDate = orderDate >= weekAgo && orderDate <= today && orderDate.getFullYear() === selectedYear;
      } else if (dateRange === 'month') {
        matchDate = orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === selectedYear;
      } else if (dateRange === 'all') {
        matchDate = orderDate.getFullYear() === selectedYear;
      }

      if (!matchDate) return;

      order.items.forEach(item => {
        // Robust matching: conversion to String handles numeric vs string IDs
        const product = products.find(p => String(p.id) === String(item.productId || item.id));
        if (!product) return;

        const quantity = item.quantity || 1;
        const wholesalePrice = product.wholesalePrice || 0;

        // Price the customer pays PER UNIT as recorded in the order item
        const finalUnitPrice = item.price || product.price || 0;

        // Calculate commission for this item (using product default or item specific)
        const itemCommission = (product.commission || 0) * quantity;

        // Calculate revenue and profit for this item
        const revenue = finalUnitPrice * quantity;
        const cost = wholesalePrice * quantity;

        // Net Profit = Revenue - Cost - Commission - (Portion of shipping if needed, but usually profit is simpler)
        const netProfit = revenue - cost - itemCommission;

        const manufacturer = manufacturers.find(m => m.id === product?.manufacturerId);
        const catName = product?.category || 'غير مصنف';
        const mName = manufacturer?.name || 'غير محدد';

        items.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          productName: item.productName || (item as any).name || 'منتج',
          quantity,
          wholesalePrice,
          sellingPrice: finalUnitPrice, // The actual selling price per unit
          finalPrice: finalUnitPrice,
          commission: itemCommission,
          totalRevenue: revenue,
          netProfit: ['delivered', 'partially_delivered'].includes(order.status) ? netProfit : 0,
          status: order.status,
          date: order.createdAt,
          marketerName: order.marketerName,
          shippingFee: order.shippingFee,
          category: catName,
          manufacturerName: mName
        });
      });
    });

    return items;
  }, [rawOrders, products, manufacturers, dateRange, statusFilter, marketerFilter, selectedYear]);

  // Global Search Handler - Uses client-side search from rawOrders
  const handleGlobalSearch = () => {
    if (!searchQuery.trim()) return;

    // Clean up the query: remove "طلب", "order", "#" and extra spaces
    let query = searchQuery.trim().toLowerCase();
    query = query.replace(/^(طلب|order)\s*/, '').replace(/^#/, '').trim();

    console.log("🔍 Searching for (cleaned):", query);

    const foundOrder = rawOrders.find(order => {
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query) ||
        (order.customerPhone2 && order.customerPhone2.includes(query))
      );
    });

    if (foundOrder) {
      console.log("✅ Order Found:", foundOrder);
      setSearchResult(foundOrder);
      setIsSearchModalOpen(true);
    } else {
      console.warn("❌ No order matched.");
      toast.error("لم يتم العثور على أي طلب يطابق بحثك");
      setSearchResult(null);
    }
  };



  // 2. Summary Stats
  const summary = useMemo(() => {
    // Only count ACTUAL sales for summary, even if search shows others
    const validData = profitData.filter(item => ['delivered', 'partially_delivered'].includes(item.status));

    const totalSales = validData.reduce((acc, item) => acc + item.totalRevenue, 0);
    const totalProfit = validData.reduce((acc, item) => acc + item.netProfit, 0);

    // ... rest is same
    const totalCommission = withdrawalRequests
      .filter(req => req.status === 'approved')
      .reduce((sum, req) => sum + req.amount, 0);
    const confirmedOrdersCount = new Set(validData.map(i => i.orderId)).size;
    const avgProfit = confirmedOrdersCount > 0 ? totalProfit / confirmedOrdersCount : 0;

    // New: Pending Commissions (Withdrawal Requests)
    const pendingWithdrawals = withdrawalRequests
      .filter(req => req.status === 'pending')
      .reduce((sum, req) => sum + req.amount, 0);

    const totalItemsCount = validData.reduce((acc, item) => acc + item.quantity, 0);

    // New: Delivered vs Cancelled Counts
    const deliveredOrdersCount = new Set(
      profitData.filter(i => ['delivered', 'partially_delivered'].includes(i.status)).map(i => i.orderId)
    ).size;

    const cancelledOrdersCount = new Set(
      profitData.filter(i => ['returned', 'rejected'].includes(i.status)).map(i => i.orderId)
    ).size;

    return {
      totalSales,
      totalProfit,
      totalCommission,
      confirmedOrdersCount,
      avgProfit,
      pendingWithdrawals,
      totalItemsCount,
      deliveredOrdersCount,
      cancelledOrdersCount
    };
  }, [profitData, withdrawalRequests]);


  // 3. Chart Data Preparation
  const chartData = useMemo(() => {
    // Group by Date
    const grouped: Record<string, { date: string, orders: number, profit: number }> = {};

    profitData.forEach(item => {
      const dateKey = new Date(item.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, orders: 0, profit: 0 };
      }
    });

    // Re-iterate orders for accurate counts
    const uniqueOrders = new Set<string>();
    profitData.forEach(item => {
      const dateKey = new Date(item.date).toLocaleDateString('en-CA');
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, orders: 0, profit: 0 };
      }
      grouped[dateKey].profit += item.netProfit;

      const uniqueKey = `${dateKey}-${item.orderId}`;
      if (!uniqueOrders.has(uniqueKey)) {
        uniqueOrders.add(uniqueKey);
        grouped[dateKey].orders += 1;
      }
    });

    return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [profitData]);

  // 4. Data for Category and Manufacturer Charts
  const manufacturerChartData = useMemo(() => {
    const grouped: Record<string, number> = {};

    // Initialize with all manufacturers to ensure inclusivity
    manufacturers.forEach(m => {
      grouped[m.name] = 0;
    });

    profitData.forEach(item => {
      const mName = item.manufacturerName || 'غير محدد';
      if (['delivered', 'partially_delivered'].includes(item.status)) {
        grouped[mName] = (grouped[mName] || 0) + item.totalRevenue;
      }
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [profitData, manufacturers]);

  const categoryAverageData = useMemo(() => {
    const grouped: Record<string, { totalFinalRevenue: number, totalQuantity: number }> = {};

    // Initialize with all categories
    categories.forEach(cat => {
      const name = typeof cat === 'string' ? cat : cat.name;
      grouped[name] = { totalFinalRevenue: 0, totalQuantity: 0 };
    });

    profitData.forEach(item => {
      const catName = item.category || 'غير مصنف';

      if (!grouped[catName]) {
        grouped[catName] = { totalFinalRevenue: 0, totalQuantity: 0 };
      }
      grouped[catName].totalFinalRevenue += (item.finalPrice * item.quantity);
      grouped[catName].totalQuantity += item.quantity;
    });
    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        avgPrice: Math.round(data.totalQuantity > 0 ? data.totalFinalRevenue / data.totalQuantity : 0)
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice);
  }, [profitData, categories]);

  const manufacturerSuccessData = useMemo(() => {
    const grouped: Record<string, { delivered: number, total: number }> = {};

    // Initialize with all manufacturers
    manufacturers.forEach(m => {
      grouped[m.name] = { delivered: 0, total: 0 };
    });

    profitData.forEach(item => {
      const mName = item.manufacturerName || 'غير محدد';
      if (!grouped[mName]) {
        grouped[mName] = { delivered: 0, total: 0 };
      }

      grouped[mName].total += 1;
      if (['delivered', 'partially_delivered'].includes(item.status)) {
        grouped[mName].delivered += 1;
      }
    });

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        rate: data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0,
        total: data.total,
        delivered: data.delivered,
        returned: data.total - data.delivered
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [profitData, manufacturers]);

  // 5. Low Stock Products (Inventory Alerts)
  const lowStockProducts = useMemo(() => {
    return products
      .filter(p => p.stock < 10) // Products with stock less than 10
      .map(p => {
        const manufacturer = manufacturers.find(m => m.id === p.manufacturerId);
        return {
          ...p,
          manufacturerName: manufacturer?.name || 'غير محدد'
        };
      })
      .sort((a, b) => a.stock - b.stock); // Sort by stock (lowest first)
  }, [products, manufacturers]);


  // 5. Products to Purchase Calculation (Smart Shopping List)
  const purchaseList = useMemo(() => {
    const warehouseOrders = rawOrders.filter(o =>
      o.section === 'warehouse' ||
      ['confirmed', 'processing'].includes(o.status)
    );
    const itemsMap = new Map<string, PurchaseItem>();

    warehouseOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === (item.productId || item.id));
        if (!product) return;

        // Apply Manufacturer Filter
        if (purchaseManufacturerFilter !== 'all' && product.manufacturerId !== purchaseManufacturerFilter) return;

        const variantKey = `${product.id}-${item.size || 'NA'}-${item.color || 'NA'}`;
        const wholesalePrice = product.wholesalePrice || 0;

        if (itemsMap.has(variantKey)) {
          const existingItem = itemsMap.get(variantKey)!;
          existingItem.quantity += item.quantity;
          existingItem.totalCost += (item.quantity * wholesalePrice);
        } else {
          const manufacturerName = manufacturers.find(m => m.id === product.manufacturerId)?.name || 'غير محدد';

          itemsMap.set(variantKey, {
            key: variantKey,
            productId: product.id,
            productName: product.name,
            variantKey: variantKey,
            size: item.size || '-',
            color: item.color || '-',
            quantity: item.quantity,
            wholesalePrice: wholesalePrice,
            totalCost: item.quantity * wholesalePrice,
            manufacturerName: manufacturerName,
            manufacturerId: product.manufacturerId || '',
            image: item.image || product.thumbnail || '/placeholder.svg'
          });
        }
      });
    });

    // Sort by Product Name to keep them together "above each other"
    return Array.from(itemsMap.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [rawOrders, products, manufacturers, purchaseManufacturerFilter]);

  const totalPurchaseCost = purchaseList.reduce((sum, item) => sum + item.totalCost, 0);


  // --- Export Function ---
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(profitData.map(item => ({
      "رقم البوليصة": item.orderNumber,
      "المنتج": item.productName,
      "سعر الجملة": item.wholesalePrice,
      "سعر البيع": item.sellingPrice,
      "الكمية": item.quantity,
      "العمولة": item.commission,
      "صافي الربح": item.netProfit,
      "التاريخ": new Date(item.date).toLocaleDateString('ar-EG'),
      "الحالة": item.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, "profit_report.xlsx");
  };

  const handlePurchaseExport = () => {
    const ws = XLSX.utils.json_to_sheet(purchaseList.map(item => ({
      "المصنع": item.manufacturerName,
      "اسم المنتج": item.productName,
      "اللون": item.color,
      "المقاس": item.size,
      "العدد المطلوب": item.quantity,
      "سعر الجملة": item.wholesalePrice,
      "إجمالي التكلفة": item.totalCost
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase List");
    XLSX.writeFile(wb, "shopping_list.xlsx");
  };


  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">

        {/* Header - Daily Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">تقارير الأرباح والمبيعات</h1>
            <p className="text-muted-foreground mt-1">نظرة شاملة على أداء متجرك اليومي والمالي</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/purchase-dashboard')}
              className="gap-2 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
              توصيات الشراء الذكية
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/department-reports')}
              className="gap-2 border-green-200 hover:bg-green-50 text-green-700"
            >
              <BarChart2 className="h-4 w-4" />
              تقرير الأقسام
            </Button>
            <Button variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700">
              تقرير شهري
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">الفترة الزمنية</span>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Simple Period Buttons */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">الفترة الزمنية</span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={dateRange === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('today')}
                  className="text-sm"
                >
                  اليوم
                </Button>
                <Button
                  variant={dateRange === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('week')}
                  className="text-sm"
                >
                  هذا الأسبوع
                </Button>
                <Button
                  variant={dateRange === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('month')}
                  className="text-sm"
                >
                  هذا الشهر
                </Button>
                <Button
                  variant={dateRange === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('all')}
                  className="text-sm"
                >
                  كل السنة
                </Button>
              </div>
            </div>

            {/* Year Selector */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">السنة</span>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">حالة الطلب</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="returned">مرتجع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">بحث شامل</span>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="رقم الطلب، الهاتف، الاسم..."
                    className="w-[250px] pr-9 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGlobalSearch();
                    }}
                  />
                </div>
                <Button onClick={handleGlobalSearch} variant="secondary">
                  بحث
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards - Compact Square Design */}
        <div className="flex flex-wrap justify-center gap-3 py-4">

          {/* Total Sales - Blue */}
          <div className="w-32 h-32 rounded-xl bg-blue-50/80 border-2 border-blue-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-2 text-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="z-10 bg-white p-1.5 rounded-full mb-1 shadow-sm">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <div className="z-10 text-sm font-bold text-blue-900 leading-tight">{formatPrice(Math.round(summary.totalSales))}</div>
            <div className="z-10 text-[10px] font-semibold text-blue-700">إجمالي المبيعات</div>
          </div>

          {/* Net Profit - Green */}
          <div className="w-32 h-32 rounded-xl bg-green-50/80 border-2 border-green-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-2 text-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="z-10 bg-white p-1.5 rounded-full mb-1 shadow-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="z-10 text-sm font-bold text-green-900 leading-tight">{formatPrice(Math.round(summary.totalProfit))}</div>
            <div className="z-10 text-[10px] font-semibold text-green-700">صافي الربح</div>
          </div>

          {/* Order Count - Sky */}
          <div className="w-32 h-32 rounded-xl bg-sky-50/80 border-2 border-sky-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-2 text-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-sky-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="z-10 bg-white p-1.5 rounded-full mb-1 shadow-sm">
              <ShoppingCart className="h-4 w-4 text-sky-600" />
            </div>
            <div className="z-10 text-sm font-bold text-sky-900 leading-tight">{summary.confirmedOrdersCount}</div>
            <div className="z-10 text-[10px] font-semibold text-sky-700">عدد الطلبات</div>
          </div>

          {/* Pending Commissions - Amber */}
          <div className="w-32 h-32 rounded-xl bg-amber-50/80 border-2 border-amber-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-2 text-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="z-10 bg-white p-1.5 rounded-full mb-1 shadow-sm">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="z-10 text-sm font-bold text-amber-900 leading-tight">{formatPrice(Math.round(summary.pendingWithdrawals))}</div>
            <div className="z-10 text-[10px] font-semibold text-amber-700">عمولات معلقة</div>
          </div>

          {/* Paid Commissions - Purple */}
          <div className="w-32 h-32 rounded-xl bg-purple-50/80 border-2 border-purple-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-2 text-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="z-10 bg-white p-1.5 rounded-full mb-1 shadow-sm">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div className="z-10 text-sm font-bold text-purple-900 leading-tight">{formatPrice(Math.round(summary.totalCommission))}</div>
            <div className="z-10 text-[10px] font-semibold text-purple-700">عمولات مدفوعة</div>
          </div>

          {/* Delivered Orders Count - Emerald */}
          <div className="w-32 h-32 rounded-xl bg-emerald-50/80 border-2 border-emerald-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-2 text-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="z-10 bg-white p-1.5 rounded-full mb-1 shadow-sm">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="z-10 text-sm font-bold text-emerald-900 leading-tight">{summary.deliveredOrdersCount}</div>
            <div className="z-10 text-[10px] font-semibold text-emerald-700">الطلبات المسلمة</div>
          </div>

          {/* Cancelled/Returned Orders Count - Rose */}
          <div className="w-32 h-32 rounded-xl bg-rose-50/80 border-2 border-rose-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center p-2 text-center group relative overflow-hidden">
            <div className="absolute inset-0 bg-rose-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="z-10 bg-white p-1.5 rounded-full mb-1 shadow-sm">
              <XCircle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="z-10 text-sm font-bold text-rose-900 leading-tight">{summary.cancelledOrdersCount}</div>
            <div className="z-10 text-[10px] font-semibold text-rose-700">الطلبات الملغية</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-7">

          {/* Charts Section */}
          <div className="md:col-span-4 space-y-6">
            {/* Analytics Selection Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <Button
                variant={activeChart === 'daily' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveChart('daily')}
                className="whitespace-nowrap"
              >
                الأداء اليومي
              </Button>
              <Button
                variant={activeChart === 'averages' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveChart('averages')}
                className="whitespace-nowrap"
              >
                متوسط سعر القسم
              </Button>
              <Button
                variant={activeChart === 'success' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveChart('success')}
                className="whitespace-nowrap"
              >
                نسبة نجاح المصانع
              </Button>
            </div>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>
                    {activeChart === 'daily' ? 'مؤشر الأرباح والمبيعات' :
                      activeChart === 'manufacturers' ? 'مساهمة المصانع في المبيعات' :
                        activeChart === 'success' ? 'نسبة التسليم مقابل المرتجع لكل مصنع' : 'متوسط سعر البيع الفعلي (دراسة السوق)'}
                  </CardTitle>
                  <CardDescription>
                    {activeChart === 'daily' ? 'مقارنة الأداء اليومي خلال الفترة المحددة' :
                      activeChart === 'averages' ? 'متوسط السعر الذي يدفعه العميل فعلياً في كل قسم' :
                        activeChart === 'success' ? 'معيار جودة المصنع وسرعة تسليم مناديبه' :
                          'نسبة مساهمة كل مصنع في إجمالي الإيرادات للفترة المحددة'}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-[350px] pt-4">
                {activeChart === 'daily' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#F3F4F6' }}
                      />
                      <Legend />
                      <Bar name="المبيعات" dataKey="profit" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar name="الطلبات" dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : activeChart === 'averages' || activeChart === 'success' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeChart === 'averages' ? categoryAverageData : manufacturerSuccessData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} interval={0} />
                      <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => activeChart === 'averages' ? `${value} ج.م` : `${value}%`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        cursor={{ fill: '#F3F4F6' }}
                        formatter={(value, name, props) => {
                          if (activeChart === 'averages') return [`${value} ج.م`, 'متوسط السعر'];
                          // Show rate and raw counts for success chart
                          const data = props.payload;
                          return [
                            `${value}%`,
                            `نسبة النجاح (${data.delivered} استلام / ${data.returned} مرتجع)`
                          ];
                        }}
                      />
                      <Bar
                        name={activeChart === 'averages' ? "متوسط السعر" : "نسبة التسليم"}
                        dataKey={activeChart === 'averages' ? "avgPrice" : "rate"}
                        fill={activeChart === 'averages' ? "#8B5CF6" : "#10B981"}
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={manufacturerChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {manufacturerChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <StorageIndicator />

            {/* Visitors Analytics - VIP Design */}
            <Card className="shadow-lg border-none overflow-hidden bg-gradient-to-br from-white to-gray-50/50 mt-6">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 pb-6">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-cairo tracking-wide">إحصائيات الزوار</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    <Eye className="h-3.5 w-3.5 text-emerald-100" />
                    <span className="text-[10px] text-emerald-50 font-medium">بث مباشر</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 -mt-4 relative z-10 mx-4 mb-4 bg-white rounded-xl shadow-xl border border-gray-100/50">
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-gray-50 text-right dir-rtl">
                  <div className="p-5 flex flex-col items-center justify-center border-t-0 border-l-0">
                    <span className="text-xs text-gray-400 font-cairo mb-1">اليوم</span>
                    <span className="text-2xl font-bold text-emerald-600">{visitorStats?.today || 0}</span>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center border-t-0 border-l-0 lg:border-l">
                    <span className="text-xs text-gray-400 font-cairo mb-1">أمس</span>
                    <span className="text-2xl font-bold text-gray-600">{visitorStats?.yesterday || 0}</span>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center border-t-0 lg:border-t-0 border-l-0">
                    <span className="text-xs text-gray-400 font-cairo mb-1">هذا الأسبوع</span>
                    <span className="text-2xl font-bold text-blue-600">{visitorStats?.thisWeek || 0}</span>
                  </div>
                  <div className="p-5 flex flex-col items-center justify-center border-t-0">
                    <span className="text-xs text-gray-400 font-cairo mb-1">هذا الشهر</span>
                    <span className="text-2xl font-bold text-indigo-600">{visitorStats?.thisMonth || 0}</span>
                  </div>
                  <div className="col-span-2 lg:col-span-4 p-4 bg-gray-50/50 flex justify-between items-center rounded-b-xl border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-gray-500 font-cairo">إجمالي الزيارات</span>
                    </div>
                    <span className="text-sm font-black text-emerald-700">{visitorStats?.total || 0}</span>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-cairo italic">تتبع الزوار الفريدين (Daily Unique)</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded shadow-inner">VIP</span>
              </div>
            </Card>
          </div>

          {/* Inventory Alerts & Monthly Snapshot */}
          <div className="md:col-span-3 space-y-6">

            {/* Inventory Alerts */}
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  تنبيهات المخزون
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockProducts.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={p.thumbnail || '/placeholder.svg'}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-md border border-gray-200"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-600">{p.manufacturerName}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs font-medium text-blue-600">{formatPrice(Math.round(p.price || 0))} ج.م</span>
                          </div>
                        </div>

                        {/* Stock Badge */}
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold ${p.stock === 0
                            ? 'text-red-700 border-red-300 bg-red-50'
                            : p.stock < 5
                              ? 'text-orange-700 border-orange-300 bg-orange-50'
                              : 'text-amber-700 border-amber-300 bg-amber-50'
                            }`}
                        >
                          {p.stock === 0 ? 'نفذ' : `${p.stock} متبقي`}
                        </Badge>
                      </div>
                    ))}
                    {lowStockProducts.length > 5 && (
                      <p className="text-xs text-center text-muted-foreground mt-2 pt-2 border-t border-amber-200">
                        + {lowStockProducts.length - 5} منتجات أخرى تحتاج إعادة تخزين
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Package className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-700">المخزون في حالة جيدة</p>
                    <p className="text-xs text-gray-500 mt-1">جميع المنتجات متوفرة بكميات كافية</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staff Activity Profile - Premium VIP Design */}
            {/* Staff Activity Profile - Premium VIP Design */}
            <Card className="col-span-1 md:col-span-3 border-none shadow-md bg-white/70 backdrop-blur-md overflow-hidden rounded-2xl mb-8">
              <CardHeader className="bg-gradient-to-l from-indigo-50 to-white border-b border-indigo-100/50 pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                      <Activity className="h-5 w-5 text-white animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-800">نشاط فريق العمل</span>
                      <span className="text-xs text-indigo-600 font-normal mt-0.5">متابعة حالة الموظفين الحالية</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-600">تحديث مباشر</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead>
                      <tr className="text-right text-gray-500 text-[11px] border-b border-gray-100 bg-gray-50/50">
                        <th className="px-2 py-4 font-bold uppercase tracking-wider text-start whitespace-nowrap">الموظف</th>
                        <th className="px-2 py-4 font-bold uppercase tracking-wider text-center whitespace-nowrap">الحضور</th>
                        <th className="px-2 py-4 font-bold uppercase tracking-wider text-center whitespace-nowrap">الصفحة</th>
                        <th className="px-2 py-4 font-bold uppercase tracking-wider text-center whitespace-nowrap">آخر نشاط</th>
                        <th className="px-2 py-4 font-bold uppercase tracking-wider text-center whitespace-nowrap">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white/40">
                      {filteredEmployeesData?.length > 0 ? (
                        filteredEmployeesData
                          .sort((a: any, b: any) => (b.isOnline === a.isOnline) ? 0 : b.isOnline ? 1 : -1) // Online first
                          .map((emp: any) => {
                            const parseFullDate = (dateVal: any) => {
                              if (!dateVal) return null;
                              if (dateVal instanceof Date) return dateVal;
                              const iso = dateVal.includes(' ') ? dateVal.replace(' ', 'T') : dateVal;
                              return new Date(iso);
                            };

                            const lastActiveDate = parseFullDate(emp.lastActive);
                            const lastRealActionDate = parseFullDate(emp.lastActionTime);

                            const timeAgo = (date: Date | null) => {
                              if (!date) return '---';
                              const now = new Date();
                              const diff = (now.getTime() - date.getTime()) / 1000;
                              if (diff < 60) return 'الآن';
                              if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
                              if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
                              return date.toLocaleDateString('ar-EG');
                            };

                            return (
                              <tr key={emp.id} className="group hover:bg-white transition-all duration-200 text-[12px]">
                                <td className="px-2 py-4">
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <div className={`w-2 h-2 rounded-full ${emp.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`}></div>
                                    <span className="font-bold text-gray-900 text-sm">{emp.name}</span>
                                    <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                      {translateRole(emp.role)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-2 py-4 text-center whitespace-nowrap">
                                  <span className="text-[12px] font-bold text-indigo-600 font-mono">
                                    {emp.firstLoginToday ? (() => {
                                      const d = parseFullDate(emp.firstLoginToday);
                                      return d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace('PM', 'م').replace('AM', 'ص') : '---';
                                    })() : '---'}
                                  </span>
                                </td>
                                <td className="px-2 py-4 text-center whitespace-nowrap">
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${emp.isOnline ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                    <Layout className="w-3 h-3 text-blue-500" />
                                    {emp.lastPage || 'لوحة التحكم'}
                                  </div>
                                </td>
                                <td className="px-2 py-4 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className={`text-[11px] font-bold ${emp.isActiveWorker ? 'text-green-600' : 'text-amber-600'}`}>
                                      {emp.lastActionType || (emp.isActiveWorker ? 'تصفح' : 'خمول')}
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-mono bg-gray-50 px-1 py-0.5 rounded">
                                      {timeAgo(lastRealActionDate)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center whitespace-nowrap">
                                  {emp.isOnline ? (
                                    emp.isActiveWorker ? (
                                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-green-500 text-white shadow-sm ring-1 ring-green-600/20">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                        نشط الآن
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-sm ring-1 ring-amber-600/20">
                                        <Timer className="w-3 h-3" />
                                        خمول / انتظار
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-400 text-white shadow-sm ring-1 ring-gray-600/20">
                                      {timeAgo(lastActiveDate) === 'الآن' ? 'جاري التحديث...' : `غير متصل | ${timeAgo(lastActiveDate)}`}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 bg-gray-50 rounded-full">
                                <Users className="h-8 w-8 text-gray-300" />
                              </div>
                              <span className="text-sm text-gray-400 font-medium">لا يوجد نشاط مسجل للموظفين حالياً</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
                <span>يتم تحديث الحالة تلقائياً كل دقيقة</span>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>مراقب بواسطة النظام</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
        {/* --- Purchase Analytics Preview --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-700">
          <Card className="md:col-span-1 border-none bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Flame size={120} />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="fill-white" />
                قرارات شراء رابحة
              </CardTitle>
              <CardDescription className="text-amber-100">تحليل الذكاء الاصطناعي للمخزن</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">
                اكتشف المنتجات التي تحقق أعلى نسبة "تسليم ناجح" وأقل نسبة مرتجعات في قسمك.
              </p>
              <Button
                onClick={() => navigate('/admin/purchase-dashboard')}
                className="w-full bg-white text-orange-600 hover:bg-amber-50 font-bold"
              >
                عرض التوصيات الذكية
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b mb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                لمحة عن أفضل Winner حالياً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-white rounded-lg border flex items-center justify-center p-1">
                    <Package className="text-gray-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">تحليل مبيعات الأسبوع</h4>
                    <p className="text-xs text-gray-500 mt-1">يوجد 5 منتجات تحقق نسبة نجاح أعلى من 85%</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-600">88%</p>
                  <p className="text-[10px] text-emerald-700 font-bold">متوسط النجاح</p>
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/purchase-dashboard')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs gap-1">
                  انقر لعرض مصفوفة الألوان والمقاسات بالكامل
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Purchase Needs Section (Smart Shopping List) --- */}
        <Card className="border-t-4 border-t-orange-500 shadow-md animate-in slide-in-from-bottom duration-700 delay-100">
          <CardHeader className="bg-orange-50/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ListTodo className="h-6 w-6 text-orange-600" />
                  <CardTitle className="text-2xl text-orange-900">المنتجات المطلوب شراؤها</CardTitle>
                </div>
                <CardDescription className="mt-1">
                  قائمة بالمنتجات المطلوبة لتوفير طلبات المخزن الحالية (المؤكدة وقيد التجهيز)
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {/* Cost Summary Widget */}
                <div className="bg-white px-4 py-2 rounded-lg border border-orange-200 shadow-sm mx-2">
                  <span className="text-xs text-gray-500 block">إجمالي المبلغ</span>
                  <span className="text-lg font-bold text-orange-700">{formatPrice(Math.round(totalPurchaseCost))} ج.م</span>
                </div>

                <div className="w-[200px]">
                  <Select value={purchaseManufacturerFilter} onValueChange={setPurchaseManufacturerFilter}>
                    <SelectTrigger className="bg-white border-orange-200">
                      <Factory className="h-4 w-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="فلترة بالمصنع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المصانع</SelectItem>
                      {manufacturers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handlePurchaseExport} variant="outline" className="border-orange-200 hover:bg-orange-100 text-orange-800">
                  <Download className="h-4 w-4 mr-2" />
                  تصدير القائمة
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-50/30 hover:bg-orange-50/50 transition-colors">
                  <TableHead className="w-[80px]">صورة</TableHead>
                  <TableHead >اسم المنتج</TableHead>
                  <TableHead className="text-center">المصنع</TableHead>
                  <TableHead className="text-center">اللون</TableHead>
                  <TableHead className="text-center">المقاس</TableHead>
                  <TableHead className="text-center">العدد المطلوب</TableHead>
                  <TableHead className="text-center">سعر الجملة</TableHead>
                  <TableHead className="text-center">الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseList.length > 0 ? (
                  purchaseList.map((item) => (
                    <TableRow key={item.key} className="hover:bg-orange-50/20">
                      <TableCell>
                        <div className="h-10 w-10 rounded border bg-white overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{item.manufacturerName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-normal">{item.color}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-normal bg-white">{item.size}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-800 font-bold">
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-gray-600">{formatPrice(Math.round(item.wholesalePrice))}</TableCell>
                      <TableCell className="text-center font-bold text-gray-900">{formatPrice(Math.round(item.totalCost))}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <ListTodo className="h-10 w-10 mb-2 opacity-20" />
                        <p>لا توجد طلبات معلقة تحتاج للشراء حالياً</p>
                        <p className="text-xs mt-1">القائمة تظهر فقط المنتجات المطلوبة في قسم المخزن</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card >

      </div >

      {/* Global Search Result Modal */}
      < Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen} >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-center border-b pb-4">
              تفاصيل الطلب: {searchResult?.orderNumber}
            </DialogTitle>
            <DialogDescription className="hidden">تفاصيل الطلب</DialogDescription>
          </DialogHeader>

          {searchResult && (
            <div className="space-y-6 pt-4">
              {/* Status Banner */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">حالة الطلب</p>
                  <Badge className={`${getStatusColor(searchResult.status)} text-base px-4 py-1`}>
                    {translateStatus(searchResult.status)}
                  </Badge>
                </div>
                <div className="h-10 w-px bg-gray-300 hidden sm:block"></div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">الموقع الحالي</p>
                  <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <MapPin className="h-4 w-4" />
                    {translateSection(searchResult.section)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    بيانات العميل
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">الاسم:</span>
                      <span className="font-medium">{searchResult.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">الهاتف:</span>
                      <span className="font-medium dir-ltr">{searchResult.customerPhone}</span>
                    </div>
                    {searchResult.customerPhone2 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">هاتف 2:</span>
                        <span className="font-medium dir-ltr">{searchResult.customerPhone2}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">العنوان:</span>
                      <span className="font-medium text-right truncate w-[200px] block" title={searchResult.customerAddress}>
                        {searchResult.city} - {searchResult.customerAddress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Marketer & Order Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Box className="h-4 w-4 text-purple-500" />
                    معلومات الطلب
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">المسوق:</span>
                      <span className="font-medium">{searchResult.marketerName || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">تاريخ الطلب:</span>
                      <span className="font-medium">{new Date(searchResult.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                    {searchResult.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">رقم التتبع:</span>
                        <span className="font-medium">{searchResult.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-green-500" />
                  المنتجات المطلوبة
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-center">الخصائص</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-center">السعر</TableHead>
                        <TableHead className="text-center">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResult.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {item.color && <span className="mx-1">لون: {item.color}</span>}
                            {item.size && <span className="mx-1">مقاس: {item.size}</span>}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">{item.price}</TableCell>
                          <TableCell className="text-center">{formatPrice(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex justify-end gap-6 text-sm font-bold bg-blue-50 p-3 rounded-lg text-blue-900">
                  <span>إجمالي الطلب: {formatPrice(Math.round(searchResult.totalAmount))} ج.م</span>
                  {searchResult.shippingFee > 0 && <span>(شامل الشحن: {Math.round(searchResult.shippingFee)})</span>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Reports;

