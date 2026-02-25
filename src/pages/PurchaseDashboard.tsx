
import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    TrendingUp,
    ShoppingCart,
    ArrowRight,
    Star,
    Zap,
    AlertCircle,
    Package,
    Layers,
    BarChart3,
    Flame,
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/services/orderService';
import { getProducts } from '@/services/productService';
import { getManufacturers } from '@/services/manufacturerService';
import { getCategories } from '@/services/categoryService';
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';

interface WinnerProduct {
    id: string;
    name: string;
    variantKey: string;
    color: string;
    size: string;
    manufacturer: string;
    deliveredCount: number;
    totalOrders: number;
    successRate: number;
    dailyVelocity: number;
    profit: number;
    score: number;
    image: string;
    category: string;
}

const PurchaseDashboard = () => {
    const { formatPrice } = usePriceFormatter();
    const navigate = useNavigate();
    const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'all'>('month');

    // Fetch Data
    const { data: ordersResponse = [] } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders() });
    const { data: productsResponse = [] } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
    const { data: manufacturers = [] } = useQuery({ queryKey: ['manufacturers'], queryFn: () => getManufacturers() });

    const orders = useMemo(() => Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse as any)?.data || [], [ordersResponse]);
    const products = useMemo(() => Array.isArray(productsResponse) ? productsResponse : (productsResponse as any)?.data || [], [productsResponse]);

    // --- Logic for Winners & Recommendations ---
    const analyticsData = useMemo(() => {
        const itemMap = new Map<string, any>();
        const now = new Date();
        let daysToDivide = timeFrame === 'week' ? 7 : timeFrame === 'month' ? 30 : 365;

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            if (timeFrame === 'week' && (now.getTime() - orderDate.getTime()) > 7 * 24 * 60 * 60 * 1000) return;
            if (timeFrame === 'month' && (now.getTime() - orderDate.getTime()) > 30 * 24 * 60 * 60 * 1000) return;

            order.items.forEach(item => {
                const product = products.find(p => p.id == item.productId);
                if (!product) return;

                const variantKey = `${product.id}-${item.color || 'N/A'}-${item.size || 'N/A'}`;

                if (!itemMap.has(variantKey)) {
                    const manufacturer = manufacturers.find(m => m.id === product.manufacturerId)?.name || "غير محدد";
                    itemMap.set(variantKey, {
                        id: product.id,
                        name: product.name,
                        variantKey,
                        color: item.color || "-",
                        size: item.size || "-",
                        manufacturer,
                        deliveredCount: 0,
                        totalOrders: 0,
                        profit: 0,
                        image: item.image || product.thumbnail || "/placeholder.svg",
                        category: product.category,
                        wholesale: product.wholesalePrice || 0,
                        basePrice: product.price || 0
                    });
                }

                const data = itemMap.get(variantKey);
                data.totalOrders += item.quantity;

                if (order.status === 'delivered' || order.status === 'partially_delivered') {
                    data.deliveredCount += item.quantity;
                    data.profit += (data.basePrice - data.wholesale) * item.quantity;
                }
            });
        });

        return Array.from(itemMap.values()).map(item => {
            const successRate = item.totalOrders > 0 ? (item.deliveredCount / item.totalOrders) * 100 : 0;
            const dailyVelocity = item.deliveredCount / daysToDivide;

            // Winner Score Calculation: (Volume * 0.4) + (SuccessRate * 0.6)
            // High volume is great, but high success rate is better for ROI.
            const normalizedVolume = Math.min(item.deliveredCount / 100, 1) * 100;
            const score = (normalizedVolume * 0.4) + (successRate * 0.6);

            return {
                ...item,
                successRate,
                dailyVelocity,
                score
            };
        });
    }, [orders, products, manufacturers, timeFrame]);

    const topWinners = useMemo(() => {
        return [...analyticsData]
            .filter(item => item.totalOrders >= 5) // Minimum volume to be considered
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }, [analyticsData]);

    const colorSizeHeatmap = useMemo(() => {
        const matrix: Record<string, Record<string, number>> = {};
        analyticsData.forEach(item => {
            if (!matrix[item.color]) matrix[item.color] = {};
            matrix[item.color][item.size] = (matrix[item.color][item.size] || 0) + item.deliveredCount;
        });
        return matrix;
    }, [analyticsData]);

    // Extract unique sizes for table header
    const allSizes = useMemo(() => {
        const sizes = new Set<string>();
        analyticsData.forEach(item => {
            if (item.size && item.size !== '-') sizes.add(item.size);
        });
        return Array.from(sizes).sort();
    }, [analyticsData]);

    const COLORS = ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-700 pb-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/reports')}
                            className="mb-2 pl-0 hover:bg-transparent hover:underline text-muted-foreground"
                        >
                            <ArrowRight className="h-4 w-4 ml-2" />
                            العودة للتقارير
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                            <Zap className="h-8 w-8 text-amber-500 fill-amber-500" />
                            توصيات الشراء الذكية (Winning Items)
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            تحليل دقيق لأكثر الألوان والمقاسات مبيعاً وأقلها إرجاعاً لمساعدتك في اتخاذ قرار الشراء القادم.
                        </p>
                    </div>

                    <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
                        <Button
                            variant={timeFrame === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeFrame('week')}
                            className="text-xs"
                        >
                            آخر أسبوع
                        </Button>
                        <Button
                            variant={timeFrame === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeFrame('month')}
                            className="text-xs"
                        >
                            آخر شهر
                        </Button>
                        <Button
                            variant={timeFrame === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeFrame('all')}
                            className="text-xs"
                        >
                            كل الأوقات
                        </Button>
                    </div>
                </div>

                {/* Top Summary Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-md bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">أعلى سرعة دوران</p>
                                    <h3 className="text-2xl font-bold mt-1">
                                        {topWinners[0]?.name || '-'}
                                    </h3>
                                    <Badge className="mt-2 bg-white/20 hover:bg-white/30 text-white border-none">
                                        {topWinners[0]?.color} | {topWinners[0]?.size}
                                    </Badge>
                                </div>
                                <div className="bg-white/20 p-3 rounded-2xl">
                                    <Flame className="h-6 w-6 text-orange-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">أعلى نسبة تسليم (بدون مرتجع)</p>
                                    <h3 className="text-2xl font-bold mt-1 text-emerald-600">
                                        {Math.max(...analyticsData.map(d => d.successRate)).toFixed(1)}%
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-2">بناءً على مبيعات الفترة الحالية</p>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-2xl">
                                    <Star className="h-6 w-6 text-emerald-600 fill-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">إجمالي الربح المرتقب</p>
                                    <h3 className="text-2xl font-bold mt-1 text-blue-600">
                                        {formatPrice(analyticsData.reduce((sum, item) => sum + item.profit, 0))}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-2">من السلع التي تم تسليمها بنجاح</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-2xl">
                                    <TrendingUp className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-12">

                    {/* Winners Table */}
                    <Card className="md:col-span-8 shadow-sm border-none">
                        <CardHeader className="border-b bg-gray-50/50">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                أفضل 10 منتجات رابحة (Winner Recommendations)
                            </CardTitle>
                            <CardDescription>المنتجات التي تحقق توازناً بين حجم المبيعات العالي ونسبة الارتجاع المنخفضة.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]"></TableHead>
                                        <TableHead>المنتج</TableHead>
                                        <TableHead className="text-center">المصنع</TableHead>
                                        <TableHead className="text-center">اللون</TableHead>
                                        <TableHead className="text-center">المقاس</TableHead>
                                        <TableHead className="text-center">نسبة النجاح</TableHead>
                                        <TableHead className="text-center">المبيع اليومي</TableHead>
                                        <TableHead className="text-center">درجة الربحية</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topWinners.map((winner, idx) => (
                                        <TableRow key={idx} className="hover:bg-blue-50/30 transition-colors">
                                            <TableCell>
                                                <div className="h-10 w-10 rounded border bg-white overflow-hidden">
                                                    <img src={winner.image} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = "/placeholder.svg"; }} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-gray-900">{winner.name}</div>
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-blue-600 font-medium bg-blue-50/50">
                                                {winner.manufacturer}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{winner.color}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="bg-gray-100">{winner.size}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-bold ${winner.successRate > 80 ? 'text-emerald-600' : winner.successRate > 60 ? 'text-amber-600' : 'text-red-500'}`}>
                                                        {winner.successRate.toFixed(1)}%
                                                    </span>
                                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                        <div className={`h-full ${winner.successRate > 80 ? 'bg-emerald-500' : winner.successRate > 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${winner.successRate}%` }}></div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-700">{winner.dailyVelocity.toFixed(1)}</span>
                                                    <span className="text-[9px] text-gray-400">قطعة / يوم</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`border-none ${winner.score > 85 ? 'bg-emerald-100 text-emerald-800' : winner.score > 70 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                                                    {winner.score > 85 ? 'ممتاز' : winner.score > 70 ? 'جيد جداً' : 'واعد'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Heatmap / Attribute Matrix */}
                    <Card className="md:col-span-4 shadow-sm border-none">
                        <CardHeader className="bg-indigo-50/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Layers className="h-5 w-5 text-indigo-600" />
                                خريطة طلب الألوان والمقاسات
                            </CardTitle>
                            <CardDescription>تعرف على توزيع المبيعات الحقيقي لكل توليفة (لون + مقاس).</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr>
                                            <th className="bg-gray-100 p-2 font-bold rounded-tl-lg">اللون / المقاس</th>
                                            {allSizes.map(size => (
                                                <th key={size} className="bg-gray-100 p-2 font-bold border-r">{size}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(colorSizeHeatmap).map(([color, sizes]) => (
                                            <tr key={color} className="border-b">
                                                <td className="p-2 font-bold bg-gray-50 border-r">{color}</td>
                                                {allSizes.map(size => {
                                                    const val = sizes[size] || 0;
                                                    // Dynamic opacity based on value
                                                    const intensity = Math.min(val / 20, 1);
                                                    return (
                                                        <td key={size} className="p-2 text-center border-r" style={{
                                                            backgroundColor: val > 0 ? `rgba(59, 130, 246, ${0.05 + intensity * 0.4})` : 'transparent',
                                                            color: val > 10 ? '#fff' : '#4b5563',
                                                            fontWeight: val > 0 ? 'bold' : 'normal'
                                                        }}>
                                                            {val > 0 ? val : '-'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6">
                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <h4 className="text-xs font-bold text-indigo-800 mb-2 flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        نصيحة الشراء:
                                    </h4>
                                    <p className="text-[11px] text-indigo-600 leading-relaxed">
                                        تشير البيانات إلى أن المقاسات الأكثر طلباً حالياً هي {allSizes.slice(0, 3).join(' و ')}.
                                        ركز في طلبيتك القادمة على تدعيم هذه المقاسات بالألوان المميزة لضمان سرعة دوران المخزن.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Visual Insights Section */}
                    <Card className="md:col-span-12 shadow-sm border-none bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                توقعات احتياج المخزن (Inventory Planning)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topWinners.map(w => ({ name: w.name, velocity: w.dailyVelocity, stockNeeded: Math.ceil(w.dailyVelocity * 30) }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={10} interval={0} tick={{ fontSize: 9 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar name="المعدل اليومي للفترة" dataKey="velocity" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        <Bar name="الكمية المقترحة لـ 30 يوم" dataKey="stockNeeded" fill="#10B981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default PurchaseDashboard;
