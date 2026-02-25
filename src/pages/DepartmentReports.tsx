
import React, { useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, BarChart2, TrendingUp, Package, Users, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/services/orderService";
import { getProducts } from "@/services/productService";
import { getManufacturers } from "@/services/manufacturerService";
import { getCategories } from "@/services/categoryService";
import * as XLSX from 'xlsx';
import { Badge } from "@/components/ui/badge";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// تفاصيل المنتج في الجدول
interface TopProductDetail {
    name: string;
    quantity: number;
    profit: number;
    size: string;
    color: string;
    manufacturer: string;
    image: string;
}

// تفاصيل المسوق
interface MarketerStat {
    id: string;
    name: string;
    salesCount: number;
    revenue: number;
}

interface DepartmentStats {
    name: string;
    productCount: number;
    salesCount: number; // إجمالي القطع المباعة
    totalRevenue: number;
    netProfit: number; // صافي الربح
    cost: number; // التكلفة (جملة + عمولة)
    topProducts: TopProductDetail[];
    activeMarketers: number; // عدد المسوقين النشطين
    marketerList: MarketerStat[]; // قائمة المسوقين
}

const DepartmentReports = () => {
    const { formatPrice } = usePriceFormatter();
    const navigate = useNavigate();
    const [dateRange, setDateRange] = React.useState('today'); // today, week, month, all

    // Fetch Data
    const { data: ordersResponse = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders() });
    const { data: productsResponse = [] } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
    const { data: categoriesResponse = [] } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories() });
    const { data: manufacturers = [] } = useQuery({ queryKey: ['manufacturers'], queryFn: () => getManufacturers() });

    const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.data || []);
    const products = Array.isArray(productsResponse) ? productsResponse : (productsResponse?.data || []);
    const categories = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.data || []);

    // Calculate Statistics
    const stats = useMemo(() => {
        const deptMap = new Map<string, DepartmentStats>();

        // 1. Initialize with ACTIVE categories
        categories.filter(c => c.active).forEach(c => {
            deptMap.set(c.name, {
                name: c.name,
                productCount: 0,
                salesCount: 0,
                totalRevenue: 0,
                netProfit: 0,
                cost: 0,
                topProducts: [],
                activeMarketers: 0,
                marketerList: []
            });
        });

        // 2. Count Products per Department
        products.forEach(p => {
            if (deptMap.has(p.category)) {
                const dept = deptMap.get(p.category)!;
                dept.productCount++;
            }
        });

        // 3. Process Orders
        orders.forEach(order => {
            // Date Filter
            const orderDate = new Date(order.createdAt);
            const today = new Date();
            let matchDate = true;

            if (dateRange === 'today') {
                matchDate = orderDate.toDateString() === today.toDateString();
            } else if (dateRange === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                matchDate = orderDate >= weekAgo;
            } else if (dateRange === 'month') {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                matchDate = orderDate >= monthAgo;
            }

            if (!matchDate) return;

            // Only count verified sales (delivered or partially delivered)
            if (order.status === 'delivered' || order.status === 'partially_delivered') {
                order.items.forEach(item => {
                    const product = products.find(p => p.id == item.productId);
                    if (product) {
                        const category = product.category;
                        if (deptMap.has(category)) {
                            const dept = deptMap.get(category)!;

                            const quantity = item.quantity;
                            const revenue = item.price * quantity;

                            // Cost Calculation
                            const wholesale = product.wholesalePrice || 0;
                            // const commission = product.commission || 0;
                            const itemCost = wholesale * quantity; // التكلفة هي سعر الجملة فقط

                            // الربح = (سعر البيع الأساسي - سعر الجملة) * الكمية
                            // نتجاهل سعر بيع المسوق
                            const basePrice = product.price || 0;
                            const profit = (basePrice - wholesale) * quantity;

                            dept.salesCount += quantity;
                            dept.totalRevenue += revenue;
                            dept.netProfit += profit;
                            dept.cost += itemCost;

                            // Aggregate Marketer Stats
                            if (order.marketerId && order.marketerName) {
                                const existingMarketer = dept.marketerList.find(m => m.id === order.marketerId);
                                if (existingMarketer) {
                                    existingMarketer.salesCount += quantity;
                                    existingMarketer.revenue += revenue;
                                } else {
                                    dept.marketerList.push({
                                        id: order.marketerId,
                                        name: order.marketerName,
                                        salesCount: quantity,
                                        revenue: revenue
                                    });
                                }
                            }

                            // Aggregate Variants
                            // We treat (Product + Size + Color) as unique entry for the "Top 5" list
                            const variantKey = `${product.name}-${item.size || ''}-${item.color || ''}`;

                            const existingVariant = dept.topProducts.find(p =>
                                `${p.name}-${p.size || ''}-${p.color || ''}` === variantKey
                            );

                            if (existingVariant) {
                                existingVariant.quantity += quantity;
                                existingVariant.profit += profit;
                            } else {
                                // Find Manufacturer Name
                                const manufactuerName = manufacturers.find(m => m.id === product.manufacturerId)?.name || "-";

                                dept.topProducts.push({
                                    name: product.name,
                                    quantity: quantity,
                                    profit: profit,
                                    size: item.size || "-",
                                    color: item.color || "-",
                                    manufacturer: manufactuerName,
                                    image: item.image || product.thumbnail || "/placeholder.svg"
                                });
                            }
                        }
                    }
                });
            }
        });

        // Finalize: Sort departments by Net Profit & Sort Top Products per dept
        const result = Array.from(deptMap.values()).map(dept => {
            // Sort products by profit (or quantity) desc
            dept.topProducts.sort((a, b) => b.profit - a.profit);
            // Keep top 10
            dept.topProducts = dept.topProducts.slice(0, 10);

            // Set active marketers count
            dept.activeMarketers = dept.marketerList.length;
            // Sort marketers by sales
            dept.marketerList.sort((a, b) => b.salesCount - a.salesCount);

            return dept;
        });

        // Sort Departments by Net Profit
        return result.sort((a, b) => b.netProfit - a.netProfit);

    }, [orders, products, manufacturers, categories, dateRange]);

    const totalStoreProfit = stats.reduce((sum, d) => sum + d.netProfit, 0);

    const handleExport = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Detailed Breakdown
        const data = stats.flatMap(dept => {
            // Department Header Row
            const deptRows = [
                {
                    "النوع": "ملخص القسم",
                    "القسم": dept.name,
                    "صافي الربح": dept.netProfit,
                    "المبيعات": dept.salesCount,
                    "الإيرادات": dept.totalRevenue,
                    "عدد المسوقين": dept.activeMarketers
                }
            ];

            // Product Rows
            const productRows = dept.topProducts.map(p => ({
                "النوع": "منتج",
                "القسم": dept.name,
                "المنتج": p.name,
                "المقاس": p.size,
                "اللون": p.color,
                "المصنع": p.manufacturer,
                "العدد": p.quantity,
                "صافي الربح": p.profit
            }));

            return [...deptRows, ...productRows, {}]; // Add empty row for spacing
        });

        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "تقرير الأقسام التفصيلي");
        XLSX.writeFile(wb, "تقرير_أداء_الأقسام_التفصيلي.xlsx");
    };

    const handleExportMarketers = (deptName: string, marketerList: MarketerStat[]) => {
        if (marketerList.length === 0) {
            toast.error("لا يوجد مسوقين نشطين لهذا القسم");
            return;
        }

        const wb = XLSX.utils.book_new();
        const data = marketerList.map(m => ({
            "اسم المسوق": m.name,
            "معرف المسوق": m.id,
            "عدد المبيعات": m.salesCount,
            "إجمالي الإيرادات": m.revenue
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "المسوقين");
        XLSX.writeFile(wb, `مسوقين_قسم_${deptName.replace(/\s+/g, "_")}.xlsx`);
        toast.success("تم تحميل بيانات المسوقين بنجاح");
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Button variant="ghost" onClick={() => navigate('/admin/reports')} className="mb-2 pl-0 hover:bg-transparent hover:underline text-muted-foreground">
                            <ArrowRight className="h-4 w-4 ml-2" />
                            العودة للتقارير
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">تقرير أداء الأقسام</h1>
                        <p className="text-muted-foreground mt-1">ترتيب الأقسام حسب صافي الربح مع تفاصيل أفضل المنتجات والمبيعات</p>
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="w-[180px]">
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="اختر الفترة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">اليوم</SelectItem>
                                    <SelectItem value="week">هذا الأسبوع</SelectItem>
                                    <SelectItem value="month">هذا الشهر</SelectItem>
                                    <SelectItem value="all">كل الأوقات</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleExport} className="gap-2 bg-green-600 hover:bg-green-700">
                            <Download className="h-4 w-4" />
                            تصدير Excel شامل
                        </Button>
                    </div>
                </div>

                {/* Departments List */}
                <div className="grid gap-8">
                    {stats.map((dept, index) => (
                        <Card key={dept.name} className="overflow-hidden border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/10 pb-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-2 py-1">
                                                #{index + 1}
                                            </Badge>
                                            <CardTitle className="text-2xl">{dept.name}</CardTitle>
                                        </div>
                                        <CardDescription className="mt-1 flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            عدد المنتجات المتاحة: {dept.productCount}
                                        </CardDescription>
                                    </div>

                                    {/* Department Summary Stats */}
                                    <div className="flex flex-wrap gap-4 text-sm md:text-base">
                                        <div className="bg-background rounded-lg p-3 border shadow-sm text-center min-w-[100px]">
                                            <div className="text-muted-foreground text-xs mb-1">المبيعات</div>
                                            <div className="font-bold">{dept.salesCount} <span className="text-xs font-normal">قطعة</span></div>
                                        </div>
                                        <div className="bg-background rounded-lg p-3 border shadow-sm text-center min-w-[100px]">
                                            <div className="text-muted-foreground text-xs mb-1">الإيرادات</div>
                                            <div className="font-bold">{formatPrice(dept.totalRevenue)} <span className="text-xs font-normal">ج.م</span></div>
                                        </div>
                                        <div className="bg-background rounded-lg p-3 border shadow-sm text-center min-w-[100px]">
                                            <div className="text-muted-foreground text-xs mb-1">تكلفة الجملة</div>
                                            <div className="font-bold text-orange-600">{formatPrice(dept.cost)} <span className="text-xs font-normal">ج.م</span></div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3 border border-green-100 shadow-sm text-center min-w-[100px]">
                                            <div className="text-green-800 text-xs mb-1 font-medium">صافي الربح</div>
                                            <div className="font-bold text-green-700 text-lg">{formatPrice(dept.netProfit)} <span className="text-xs font-normal">ج.م</span></div>
                                        </div>

                                        {/* NEW: Active Marketers Statistic */}
                                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 shadow-sm text-center min-w-[120px] relative group">
                                            <div className="text-purple-800 text-xs mb-1 font-medium flex justify-center items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                مسوقين نشطين
                                            </div>
                                            <div className="font-bold text-purple-700 text-lg flex justify-center items-center gap-2">
                                                {dept.activeMarketers}
                                                {dept.activeMarketers > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 rounded-full hover:bg-purple-200 text-purple-700"
                                                        title="تحميل بيانات المسوقين"
                                                        onClick={() => handleExportMarketers(dept.name, dept.marketerList)}
                                                    >
                                                        <FileDown className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 shadow-sm text-center min-w-[100px]">
                                            <div className="text-blue-800 text-xs mb-1 font-medium">المساهمة</div>
                                            <div className="font-bold text-blue-700">
                                                {totalStoreProfit ? ((dept.netProfit / totalStoreProfit) * 100).toFixed(1) : 0}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-4 bg-muted/5 font-medium border-b flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    أفضل 10 منتجات مبيعاً
                                </div>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30">
                                                <TableHead className="w-[80px] text-right">صورة</TableHead>
                                                <TableHead className="text-right">اسم المنتج</TableHead>
                                                <TableHead className="text-center">المصنع</TableHead>
                                                <TableHead className="text-center">اللون</TableHead>
                                                <TableHead className="text-center">المقاس</TableHead>
                                                <TableHead className="text-center">عدد القطع</TableHead>
                                                <TableHead className="text-center">صافي الربح</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dept.topProducts.length > 0 ? (
                                                dept.topProducts.map((p, idx) => (
                                                    <TableRow key={idx} className="hover:bg-muted/20">
                                                        <TableCell className="py-2">
                                                            <div className="h-12 w-12 rounded-md overflow-hidden border bg-white">
                                                                <img
                                                                    src={p.image}
                                                                    alt={p.name}
                                                                    className="h-full w-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                                                                    }}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{p.name}</TableCell>
                                                        <TableCell className="text-center text-muted-foreground">{p.manufacturer}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className="font-normal">
                                                                {p.color}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="secondary" className="font-normal bg-gray-100">
                                                                {p.size}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold text-lg">{p.quantity}</TableCell>
                                                        <TableCell className="text-center font-medium text-green-600">
                                                            {formatPrice(p.profit)} ج.م
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                        لا توجد مبيعات في هذه الفترة
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {stats.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                            <h3 className="text-lg font-medium text-muted-foreground">لا توجد أقسام نشطة حالياً</h3>
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
};


export default DepartmentReports;



