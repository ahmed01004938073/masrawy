
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, MapPin, Phone, Building2, Search, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getManufacturers, addManufacturer, deleteManufacturer, Manufacturer } from "@/services/manufacturerService";
import { getProducts } from "@/services/productService";
import { useNavigate } from "react-router-dom";

const Manufacturers = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [manufacturerToDelete, setManufacturerToDelete] = useState<Manufacturer | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // New Manufacturer Form State
    const [newName, setNewName] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [newPhone, setNewPhone] = useState("");

    const queryResult = useQuery({
        queryKey: ["manufacturers"],
        queryFn: async () => {
            try {
                console.log("🔄 Fetching Manufacturers & Products...");
                const mans = await getManufacturers();
                const productsData = await getProducts();
                console.log("📦 Raw Manufacturers from Service:", mans);
                console.log("📦 Raw Products from Service:", productsData ? "Exists" : "Null/Undefined");

                // Handle both array and paginated response
                const productsList = Array.isArray(productsData) ? productsData : (productsData as any)?.data || [];

                const counts: Record<string, number> = {};
                productsList.forEach((p: any) => {
                    const mId = p.manufacturerId || p.manufacturer_id;
                    if (mId) {
                        counts[mId] = (counts[mId] || 0) + 1;
                    }
                });
                return {
                    manufacturers: Array.isArray(mans) ? mans : [],
                    productsCount: counts
                };
            } catch (error) {
                console.error("Error in manufacturers queryFn:", error);
                return { manufacturers: [], productsCount: {} };
            }
        },
        refetchInterval: 10000
    });

    const manufacturers = Array.isArray(queryResult.data?.manufacturers) ? queryResult.data.manufacturers : [];
    const productsCount = (queryResult.data as any)?.productsCount || {};
    const isDataLoading = queryResult.isLoading;


    const handleAddManufacturer = async () => {
        if (!newName || !newAddress || !newPhone) {
            toast.error("يرجى ملء جميع البيانات");
            return;
        }

        setIsLoading(true);
        try {
            await addManufacturer({
                name: newName,
                address: newAddress,
                phone: newPhone
            });

            toast.success("تم إضافة المصنع بنجاح");
            setIsAddDialogOpen(false);

            // Reset form
            setNewName("");
            setNewAddress("");
            setNewPhone("");

            await queryClient.invalidateQueries({ queryKey: ["manufacturers"] });
        } catch (error) {
            console.error("Failed to add manufacturer", error);
            toast.error("فشل إضافة المصنع");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = (manufacturer: Manufacturer) => {
        if (productsCount[manufacturer.id] > 0) {
            toast.error(`لا يمكن حذف المصنع "${manufacturer.name}" لأنه مرتبط بـ ${productsCount[manufacturer.id]} منتجات.`);
            return;
        }
        setManufacturerToDelete(manufacturer);
        setDeleteId(manufacturer.id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setIsLoading(true);
        try {
            const success = await deleteManufacturer(deleteId);
            if (success) {
                toast.success("تم حذف المصنع بنجاح");
                await queryClient.invalidateQueries({ queryKey: ["manufacturers"] });
            } else {
                toast.error("حدث خطأ أثناء الحذف");
            }
        } catch (error) {
            console.error("Failed to delete manufacturer", error);
            toast.error("فشل حذف المصنع");
        } finally {
            setIsLoading(false);
            setDeleteId(null);
            setManufacturerToDelete(null);
        }
    };

    const filteredManufacturers = (manufacturers || []).filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.includes(searchTerm)
    );

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Button variant="ghost" onClick={() => navigate('/admin/products')} className="mb-2 pl-0 hover:bg-transparent hover:underline text-muted-foreground">
                            <ArrowRight className="h-4 w-4 ml-2" />
                            العودة للمنتجات
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">إدارة المصانع</h1>
                        <p className="text-muted-foreground mt-1">قائمة المصانع والموردين المسجلين في النظام</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4" />
                                إضافة مصنع جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>إضافة مصنع جديد</DialogTitle>
                                <DialogDescription>أدخل بيانات المصنع للتواصل والمتابعة.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>اسم المصنع</Label>
                                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: مصنع النور" />
                                </div>
                                <div className="space-y-2">
                                    <Label>العنوان</Label>
                                    <Input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="العنوان بالتفصيل" />
                                </div>
                                <div className="space-y-2">
                                    <Label>رقم الهاتف</Label>
                                    <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="01xxxxxxxxx" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
                                <Button onClick={handleAddManufacturer} disabled={isLoading}>
                                    {isLoading ? "جاري الحفظ..." : "حفظ المصنع"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي المصانع</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{manufacturers.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">إجمالي المنتجات المرتبطة</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {Object.values(productsCount).reduce((a, b) => a + b, 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* List */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>قائمة المصانع</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="بحث باسم المصنع..."
                                    className="pr-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isDataLoading && manufacturers.length === 0 ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">
                                            <div className="flex items-center gap-2 justify-start">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                اسم المصنع
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            <div className="flex items-center gap-2 justify-start">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                رقم الهاتف
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">
                                            <div className="flex items-center gap-2 justify-start">
                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                العنوان
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center">عدد المنتجات</TableHead>
                                        <TableHead className="text-right">تاريخ الإضافة</TableHead>
                                        <TableHead className="text-left">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredManufacturers.length > 0 ? (
                                        filteredManufacturers.map((manufacturer) => (
                                            <TableRow key={manufacturer.id}>
                                                <TableCell className="font-medium text-right">
                                                    <div className="flex items-center gap-2 justify-start">
                                                        <Building2 className="h-4 w-4 text-gray-500" />
                                                        {manufacturer.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 justify-start">
                                                        <Phone className="h-3 w-3" />
                                                        <span dir="ltr">{manufacturer.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 justify-start">
                                                        <MapPin className="h-3 w-3" />
                                                        {manufacturer.address}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary" className="px-3">
                                                        {productsCount[manufacturer.id] || 0} منتج
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(manufacturer.createdAt).toLocaleDateString('ar-EG')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-left">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => confirmDelete(manufacturer)}
                                                        disabled={isLoading}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                لا توجد مصانع مطابقة للبحث
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                            <AlertDialogDescription>
                                سيتم حذف مصنع "{manufacturerToDelete?.name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
                                {isLoading ? "جاري الحذف..." : "حذف المصنع"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default Manufacturers;
