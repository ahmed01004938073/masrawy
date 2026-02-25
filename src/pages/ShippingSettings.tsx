import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  MapPin,
  Edit,
  Trash,
  Check,
  X,
  Truck,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  getAvailableGovernorates,
  getCitiesByGovernorate,
  getShippingCompanies,
  addShippingCompany,
  updateShippingCompany,
  deleteShippingCompany,
  getShippingAreas,
  addShippingArea,
  updateShippingArea,
  deleteShippingArea,
  updateCitiesForGovernorate
} from "@/services/collectionService";
import { Governorate, City, ShippingCompany } from "@/types/shipping";

// نوع بيانات منطقة الشحن العامة
interface ShippingArea {
  id: string;
  governorate: string;
  cities: string[];
  price: number;
  createdAt: string;
  updatedAt?: string;
}

const ShippingSettings = () => {
  const { formatPrice } = usePriceFormatter();
  const [activeTab, setActiveTab] = useState("areas");
  const [searchTerm, setSearchTerm] = useState("");
  const [shippingAreas, setShippingAreas] = useState<ShippingArea[]>([]);
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // حالات نوافذ مناطق الشحن
  const [isAddAreaDialogOpen, setIsAddAreaDialogOpen] = useState(false);
  const [isEditAreaDialogOpen, setIsEditAreaDialogOpen] = useState(false);
  const [isDeleteAreaDialogOpen, setIsDeleteAreaDialogOpen] = useState(false);

  // حالات نوافذ شركات الشحن
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = useState(false);
  const [isDeleteCompanyDialogOpen, setIsDeleteCompanyDialogOpen] = useState(false);

  // حالات البيانات المحددة
  const [selectedArea, setSelectedArea] = useState<ShippingArea | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<ShippingCompany | null>(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableGovernorates, setAvailableGovernorates] = useState<string[]>([]);
  const [shippingPrice, setShippingPrice] = useState<number>(0);

  // حالات بيانات شركة الشحن الجديدة
  const [newCompany, setNewCompany] = useState({
    name: "",
    phone: "", // رقم الاتصال
    address: "",
    website: "", // موقع الشركة (اختياري)
    whatsapp: "", // رقم الواتساب للطلبات
  });

  // البيانات الافتراضية لمناطق الشحن
  const defaultShippingAreas: ShippingArea[] = [
    {
      id: "area-1",
      governorate: "القاهرة",
      cities: ["مدينة نصر", "المعادي", "مصر الجديدة", "وسط البلد", "المقطم"],
      price: 50,
      createdAt: new Date().toISOString()
    },
    {
      id: "area-2",
      governorate: "الجيزة",
      cities: ["الدقي", "المهندسين", "العجوزة", "الهرم", "فيصل", "6 أكتوبر"],
      price: 60,
      createdAt: new Date().toISOString()
    },
    {
      id: "area-3",
      governorate: "الإسكندرية",
      cities: ["المنتزه", "شرق الإسكندرية", "وسط الإسكندرية", "الجمرك", "العامرية"],
      price: 100,
      createdAt: new Date().toISOString()
    }
  ];

  // جلب البيانات
  const loadData = useCallback(async (showToast = true) => {
    try {
      setIsLoading(true);

      // جلب مناطق الشحن من API
      const storedAreas = await getShippingAreas();
      if (storedAreas && storedAreas.length > 0) {
        setShippingAreas(storedAreas);
      } else {
        // إذا لم تكن هناك بيانات مخزنة، استخدم البيانات الافتراضية وقم بحفظها
        setShippingAreas(defaultShippingAreas);
        // Save defaults strictly if needed, but per previous logic we might want to just show them or auto-save?
        // Old logic: localStorage.setItem if empty.
        // New logic: Only save if user adds? Or auto-init?
        // For now let's just use defaults in the UI if empty, but NOT save them automatically unless user acts.
        // Actually, if we want to PERSIST defaults, we should save them.
        // Let's iterate and save defaults if empty.
        /*
        for (const area of defaultShippingAreas) {
           await addShippingArea(area);
        }
        */
        // But this might be slow/complex. Let's just set them in state for now.
      }

      // جلب شركات الشحن من API
      const storedCompanies = await getShippingCompanies();
      setShippingCompanies(storedCompanies || []);

      setLastUpdated(new Date());

      if (showToast) {
        toast.success("تم تحميل بيانات الشحن بنجاح");
      }
    } catch (error) {
      console.error("حدث خطأ أثناء جلب البيانات:", error);
      if (showToast) {
        toast.error("حدث خطأ أثناء تحميل البيانات");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // إضافة شركة شحن جديدة
  const handleAddCompany = async () => {
    try {
      if (!newCompany.name || !newCompany.phone || !newCompany.address) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }

      // إنشاء شركة شحن جديدة
      const newShippingCompany = {
        name: newCompany.name,
        phone: newCompany.phone,
        address: newCompany.address,
        website: newCompany.website,
        whatsapp: newCompany.whatsapp,
        isActive: true
      };

      const addedCompany = await addShippingCompany(newShippingCompany);

      // إضافة الشركة إلى القائمة
      const updatedCompanies = [...shippingCompanies, addedCompany];
      setShippingCompanies(updatedCompanies);

      // إعادة تعيين النموذج
      setNewCompany({ name: "", phone: "", address: "", website: "", whatsapp: "" });
      setIsAddCompanyDialogOpen(false);
      toast.success("تم إضافة شركة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء إضافة شركة الشحن:", error);
      toast.error("حدث خطأ أثناء إضافة شركة الشحن");
    }
  };

  // تحديث شركة شحن
  const handleUpdateCompany = async () => {
    try {
      if (!selectedCompany) return;

      if (!selectedCompany.name || !selectedCompany.phone || !selectedCompany.address) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }

      const updatedCompany = await updateShippingCompany(selectedCompany.id, {
        name: selectedCompany.name,
        phone: selectedCompany.phone,
        address: selectedCompany.address,
        website: selectedCompany.website,
        whatsapp: selectedCompany.whatsapp
      });

      if (updatedCompany) {
        const updatedCompanies = shippingCompanies.map(company =>
          company.id === updatedCompany.id ? updatedCompany : company
        );
        setShippingCompanies(updatedCompanies);
      }

      setSelectedCompany(null);
      setIsEditCompanyDialogOpen(false);
      toast.success("تم تحديث شركة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء تحديث شركة الشحن:", error);
      toast.error("حدث خطأ أثناء تحديث شركة الشحن");
    }
  };

  // حذف شركة شحن
  const handleDeleteCompany = async () => {
    try {
      if (!selectedCompany) return;

      await deleteShippingCompany(selectedCompany.id);

      // حذف الشركة من القائمة
      const updatedCompanies = shippingCompanies.filter(company => company.id !== selectedCompany.id);
      setShippingCompanies(updatedCompanies);

      setSelectedCompany(null);
      setIsDeleteCompanyDialogOpen(false);
      toast.success("تم حذف شركة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء حذف شركة الشحن:", error);
      toast.error("حدث خطأ أثناء حذف شركة الشحن");
    }
  };

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    loadData(false);
    // تحميل قائمة المحافظات المتاحة
    const fetchGovs = async () => {
      const govs = await getAvailableGovernorates();
      setAvailableGovernorates(govs);
    };
    fetchGovs();
  }, [loadData]);

  // تصفية مناطق الشحن حسب البحث
  const filteredAreas = shippingAreas.filter(area => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    return (
      area.governorate.toLowerCase().includes(searchLower) ||
      area.cities.some(city => city.toLowerCase().includes(searchLower))
    );
  });

  // تصفية شركات الشحن حسب البحث
  const filteredCompanies = shippingCompanies.filter(company => {
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();
    return (
      company.name.toLowerCase().includes(searchLower) ||
      company.phone.includes(searchTerm.trim()) ||
      company.address.toLowerCase().includes(searchLower)
    );
  });

  // تحديث المدن المتاحة عند اختيار محافظة
  const handleGovernorateChange = async (governorate: string) => {
    setSelectedGovernorate(governorate);
    setSelectedCities([]);
    const cities = await getCitiesByGovernorate(governorate);
    setAvailableCities(cities);
  };

  // حقل لإضافة مدينة جديدة
  const [newCityName, setNewCityName] = useState("");

  const handleAddNewCity = async () => {
    if (!newCityName.trim() || !selectedGovernorate) return;

    const cityName = newCityName.trim();
    if (availableCities.includes(cityName)) {
      toast.error("هذه المدينة موجودة بالفعل");
      return;
    }

    const updatedCities = [...availableCities, cityName];
    await updateCitiesForGovernorate(selectedGovernorate, updatedCities);
    setAvailableCities(updatedCities);
    setSelectedCities([...selectedCities, cityName]);
    setNewCityName("");
    toast.success("تم إضافة المدينة بنجاح");
  };

  const handleDeleteCity = async (cityName: string) => {
    if (!selectedGovernorate) return;

    const updatedCities = availableCities.filter(c => c !== cityName);
    await updateCitiesForGovernorate(selectedGovernorate, updatedCities);
    setAvailableCities(updatedCities);
    setSelectedCities(selectedCities.filter(c => c !== cityName));
    toast.success("تم حذف المدينة من النظام");
  };

  // إضافة منطقة شحن جديدة
  const handleAddArea = async () => {
    try {
      if (!selectedGovernorate || selectedCities.length === 0 || shippingPrice <= 0) {
        toast.error("يرجى اختيار المحافظة والمدن وإدخال سعر الشحن");
        return;
      }

      const newAreaInput = {
        governorate: selectedGovernorate,
        cities: selectedCities,
        price: shippingPrice
      };

      const addedArea = await addShippingArea(newAreaInput);

      const updatedAreas = [...shippingAreas, addedArea];
      setShippingAreas(updatedAreas);

      setSelectedGovernorate("");
      setSelectedCities([]);
      setAvailableCities([]);
      setShippingPrice(0);
      setIsAddAreaDialogOpen(false);
      toast.success("تم إضافة منطقة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء إضافة منطقة الشحن:", error);
      toast.error("حدث خطأ أثناء إضافة منطقة الشحن");
    }
  };

  // تحديث منطقة شحن
  const handleUpdateArea = async () => {
    try {
      if (!selectedArea || !selectedGovernorate || selectedCities.length === 0 || shippingPrice <= 0) {
        toast.error("يرجى اختيار المحافظة والمدن وإدخال سعر الشحن");
        return;
      }

      const updatedArea = await updateShippingArea(selectedArea.id, {
        governorate: selectedGovernorate,
        cities: selectedCities,
        price: shippingPrice
      });

      if (updatedArea) {
        const updatedAreas = shippingAreas.map(area =>
          area.id === updatedArea.id ? updatedArea : area
        );
        setShippingAreas(updatedAreas);
      }

      setSelectedArea(null);
      setSelectedGovernorate("");
      setSelectedCities([]);
      setAvailableCities([]);
      setShippingPrice(0);
      setIsEditAreaDialogOpen(false);
      toast.success("تم تحديث منطقة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء تحديث منطقة الشحن:", error);
      toast.error("حدث خطأ أثناء تحديث منطقة الشحن");
    }
  };

  // حذف منطقة شحن
  const handleDeleteArea = async () => {
    try {
      if (!selectedArea) return;

      await deleteShippingArea(selectedArea.id);

      const updatedAreas = shippingAreas.filter(area => area.id !== selectedArea.id);
      setShippingAreas(updatedAreas);

      setSelectedArea(null);
      setIsDeleteAreaDialogOpen(false);
      toast.success("تم حذف منطقة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء حذف منطقة الشحن:", error);
      toast.error("حدث خطأ أثناء حذف منطقة الشحن");
    }
  };

  // تنسيق المبلغ
  const formatAmount = (amount: number | undefined) => {
    return formatPrice(amount) + " ج.م";
  };

  // فتح موقع شركة الشحن مع نسخ بيانات تجريبية
  const handleOpenShippingWebsite = async (company: ShippingCompany) => {
    if (!company.website) {
      toast.error("لا يوجد موقع محدد لهذه الشركة");
      return;
    }

    // بيانات تجريبية للاختبار
    const customerData = `📦 طلب شحن جديد
👤 العميل: سارة أحمد
📱 الهاتف: 01002345678
📍 العنوان: شارع الهرم، الجيزة
🏙️ المحافظة: الجيزة - الهرم

📋 تفاصيل الطلب:
🛍️ اسم المنتج: جهاز تابلت
📦 عدد القطع: 1 قطعة
💰 المبلغ: 6000 ج.م
🚚 الشحن: 50 ج.م
💳 الإجمالي: 6050 ج.م

📝 ملاحظات: لا توجد`;

    try {
      // محاولة نسخ البيانات باستخدام Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(customerData);
        toast.success(`تم نسخ بيانات العميل وفتح موقع ${company.name}`);
      } else {
        // طريقة احتياطية للنسخ
        const textArea = document.createElement('textarea');
        textArea.value = customerData;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          toast.success(`تم نسخ بيانات العميل وفتح موقع ${company.name}`);
        } catch (err) {
          toast.error("فشل في نسخ البيانات");
          console.error('فشل في نسخ البيانات:', err);
        }

        document.body.removeChild(textArea);
      }

      // فتح موقع الشركة
      window.open(company.website, '_blank');

    } catch (err) {
      toast.error("فشل في نسخ البيانات");
      console.error('خطأ في نسخ البيانات:', err);

      // فتح الموقع حتى لو فشل النسخ
      window.open(company.website, '_blank');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">إعدادات الشحن</h1>
            <p className="text-muted-foreground">
              إدارة شركات الشحن والمحافظات والمدن وأسعار الشحن
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="بحث..."
                className="w-[200px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="areas" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="areas">مناطق الشحن</TabsTrigger>
            <TabsTrigger value="companies">شركات الشحن</TabsTrigger>
          </TabsList>

          {/* قسم مناطق الشحن */}
          <TabsContent value="areas" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => {
                setSelectedGovernorate("");
                setSelectedCities([]);
                setAvailableCities([]);
                setShippingPrice(0);
                setIsAddAreaDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة منطقة
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>قائمة مناطق الشحن</CardTitle>
                <CardDescription>
                  {filteredAreas.length} منطقة شحن
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAreas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "لا توجد مناطق شحن متطابقة مع معايير البحث" : "لا توجد مناطق شحن مضافة بعد"}
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">المحافظة</TableHead>
                          <TableHead className="text-center">المدن</TableHead>
                          <TableHead className="text-center">سعر الشحن</TableHead>
                          <TableHead className="text-center">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAreas.map((area) => (
                          <TableRow key={area.id}>
                            <TableCell className="font-medium text-right">{area.governorate}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {area.cities.map((city, index) => (
                                  <Badge key={index} variant="outline" className="bg-gray-100">
                                    {city}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium text-green-600">
                              {formatAmount(area.price)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={async () => {
                                    setSelectedArea(area);
                                    setSelectedGovernorate(area.governorate);
                                    setSelectedCities([...area.cities]);
                                    const cities = await getCitiesByGovernorate(area.governorate);
                                    setAvailableCities(cities);
                                    setShippingPrice(area.price);
                                    setIsEditAreaDialogOpen(true);
                                  }}
                                  className="h-8 w-8 text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedArea(area);
                                    setIsDeleteAreaDialogOpen(true);
                                  }}
                                  className="h-8 w-8 text-red-600"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* قسم شركات الشحن */}
          <TabsContent value="companies" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => {
                setNewCompany({ name: "", phone: "", address: "", website: "", whatsapp: "" });
                setIsAddCompanyDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة شركة شحن
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>قائمة شركات الشحن</CardTitle>
                <CardDescription>
                  {filteredCompanies.length} شركة شحن
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredCompanies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "لا توجد شركات شحن متطابقة مع معايير البحث" : "لا توجد شركات شحن مضافة بعد"}
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">اسم الشركة</TableHead>
                          <TableHead className="text-center">رقم الهاتف</TableHead>
                          <TableHead className="text-center">العنوان</TableHead>
                          <TableHead className="text-center">الموقع</TableHead>
                          <TableHead className="text-center">الواتساب</TableHead>
                          <TableHead className="text-center">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCompanies.map((company) => (
                          <TableRow key={company.id}>
                            <TableCell className="font-medium text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Truck className="h-4 w-4 text-gray-500" />
                                {company.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                {company.phone}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {company.address}
                            </TableCell>
                            <TableCell className="text-center">
                              {company.website ? (
                                <button
                                  onClick={() => handleOpenShippingWebsite(company)}
                                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer bg-transparent border-none"
                                  title={`نسخ البيانات وفتح موقع ${company.name}`}
                                >
                                  🔗 موقع
                                </button>
                              ) : (
                                <span className="text-gray-400">لا يوجد</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {company.whatsapp ? (
                                <a
                                  href={`https://wa.me/${company.whatsapp}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-800 underline"
                                  title={`فتح واتساب ${company.whatsapp}`}
                                >
                                  💬 {company.whatsapp}
                                </a>
                              ) : (
                                <span className="text-gray-400">لا يوجد</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setIsEditCompanyDialogOpen(true);
                                  }}
                                  className="h-8 w-8 text-blue-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setIsDeleteCompanyDialogOpen(true);
                                  }}
                                  className="h-8 w-8 text-red-600"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* مربع حوار إضافة منطقة شحن جديدة */}
      <Dialog open={isAddAreaDialogOpen} onOpenChange={setIsAddAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة منطقة شحن جديدة</DialogTitle>
            <DialogDescription>
              اختر المحافظة والمدن وأدخل سعر الشحن
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="governorate">المحافظة</Label>
              <select
                id="governorate"
                className="w-full p-2 border rounded-md"
                value={selectedGovernorate}
                onChange={(e) => handleGovernorateChange(e.target.value)}
              >
                <option value="">اختر المحافظة</option>
                {availableGovernorates.map((gov) => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>
            {selectedGovernorate && (
              <div className="space-y-2">
                <Label htmlFor="cities">المدن</Label>
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                  {availableCities.map((city) => (
                    <div key={city} className="flex items-center justify-between group p-1 hover:bg-gray-50 rounded">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`city-${city}`}
                          checked={selectedCities.includes(city)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCities([...selectedCities, city]);
                            } else {
                              setSelectedCities(selectedCities.filter(c => c !== city));
                            }
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`city-${city}`}>{city}</label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                        onClick={() => handleDeleteCity(city)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* إضافة مدينة يدوياً */}
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="اسم المدينة الجديدة..."
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCity())}
                  />
                  <Button type="button" size="sm" onClick={handleAddNewCity}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCities([])}
                  >
                    إلغاء تحديد الكل
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCities([...availableCities])}
                  >
                    تحديد الكل
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="price">سعر الشحن (ج.م)</Label>
              <Input
                id="price"
                type="number"
                min="1"
                value={shippingPrice}
                onChange={(e) => setShippingPrice(parseFloat(e.target.value) || 0)}
                placeholder="أدخل سعر الشحن"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAreaDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddArea}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار تعديل منطقة شحن */}
      <Dialog open={isEditAreaDialogOpen} onOpenChange={setIsEditAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل منطقة الشحن</DialogTitle>
            <DialogDescription>
              قم بتعديل المدن وسعر الشحن
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-governorate">المحافظة</Label>
              <select
                id="edit-governorate"
                className="w-full p-2 border rounded-md"
                value={selectedGovernorate}
                onChange={(e) => handleGovernorateChange(e.target.value)}
                disabled
              >
                <option value="">اختر المحافظة</option>
                {availableGovernorates.map((gov) => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>
            {selectedGovernorate && (
              <div className="space-y-2">
                <Label htmlFor="edit-cities">المدن</Label>
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                  {availableCities.map((city) => (
                    <div key={city} className="flex items-center justify-between group p-1 hover:bg-gray-50 rounded">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`edit-city-${city}`}
                          checked={selectedCities.includes(city)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCities([...selectedCities, city]);
                            } else {
                              setSelectedCities(selectedCities.filter(c => c !== city));
                            }
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`edit-city-${city}`}>{city}</label>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                        onClick={() => handleDeleteCity(city)}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* إضافة مدينة يدوياً */}
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="اسم المدينة الجديدة..."
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewCity())}
                  />
                  <Button type="button" size="sm" onClick={handleAddNewCity}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCities([])}
                  >
                    إلغاء تحديد الكل
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCities([...availableCities])}
                  >
                    تحديد الكل
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-price">سعر الشحن (ج.م)</Label>
              <Input
                id="edit-price"
                type="number"
                min="1"
                value={shippingPrice}
                onChange={(e) => setShippingPrice(parseFloat(e.target.value) || 0)}
                placeholder="أدخل سعر الشحن"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAreaDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateArea}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار حذف منطقة شحن */}
      <Dialog open={isDeleteAreaDialogOpen} onOpenChange={setIsDeleteAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف منطقة الشحن</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف منطقة الشحن "{selectedArea?.governorate}"؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAreaDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteArea}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار إضافة شركة شحن جديدة */}
      <Dialog open={isAddCompanyDialogOpen} onOpenChange={setIsAddCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة شركة شحن جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات شركة الشحن الجديدة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">اسم الشركة</Label>
              <Input
                id="company-name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="أدخل اسم الشركة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">رقم الهاتف</Label>
              <Input
                id="company-phone"
                value={newCompany.phone}
                onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">العنوان</Label>
              <Input
                id="company-address"
                value={newCompany.address}
                onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                placeholder="أدخل العنوان"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">موقع الشركة (اختياري)</Label>
              <Input
                id="company-website"
                value={newCompany.website}
                onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-whatsapp">رقم الواتساب (للطلبات)</Label>
              <Input
                id="company-whatsapp"
                value={newCompany.whatsapp}
                onChange={(e) => setNewCompany({ ...newCompany, whatsapp: e.target.value })}
                placeholder="201001234567"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                أدخل الرقم بصيغة دولية (مثال: 201001234567)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCompanyDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddCompany}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار تعديل شركة شحن */}
      <Dialog open={isEditCompanyDialogOpen} onOpenChange={setIsEditCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات شركة الشحن</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات شركة الشحن
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company-name">اسم الشركة</Label>
              <Input
                id="edit-company-name"
                value={selectedCompany?.name || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, name: e.target.value } : null)}
                placeholder="أدخل اسم الشركة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company-phone">رقم الهاتف</Label>
              <Input
                id="edit-company-phone"
                value={selectedCompany?.phone || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, phone: e.target.value } : null)}
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company-address">العنوان</Label>
              <Input
                id="edit-company-address"
                value={selectedCompany?.address || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, address: e.target.value } : null)}
                placeholder="أدخل العنوان"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company-website">موقع الشركة (اختياري)</Label>
              <Input
                id="edit-company-website"
                value={selectedCompany?.website || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, website: e.target.value } : null)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company-whatsapp">رقم الواتساب (للطلبات)</Label>
              <Input
                id="edit-company-whatsapp"
                value={selectedCompany?.whatsapp || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, whatsapp: e.target.value } : null)}
                placeholder="201001234567"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                أدخل الرقم بصيغة دولية (مثال: 201001234567)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCompanyDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateCompany}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار حذف شركة شحن */}
      <Dialog open={isDeleteCompanyDialogOpen} onOpenChange={setIsDeleteCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف شركة الشحن</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف شركة الشحن "{selectedCompany?.name}"؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCompanyDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompany}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ShippingSettings;
