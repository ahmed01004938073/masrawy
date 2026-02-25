import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Truck,
  Phone,
  MapPin,
  Edit,
  Trash,
  RefreshCw,
  Check,
  X
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ShippingCompany,
  ShippingZone,
  CoverageArea,
  Governorate,
  City
} from "@/types/shipping";

import {
  getShippingCompanies,
  addShippingCompany,
  updateShippingCompany,
  deleteShippingCompany,
  addShippingZone,
  updateShippingZone,
  deleteShippingZone,
  exportShippingZones,
  importShippingZones,
  copyShippingZones,
  bulkUpdateZonePrices,
  getAvailableGovernorates,
  getCitiesByGovernorate,
  addCoverageArea,
  updateCoverageArea,
  deleteCoverageArea
} from "@/services/collectionService";

const ShippingCompanies = () => {
  const { formatPrice } = usePriceFormatter();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isZonesDialogOpen, setIsZonesDialogOpen] = useState(false);
  const [isAddZoneDialogOpen, setIsAddZoneDialogOpen] = useState(false);
  const [isEditZoneDialogOpen, setIsEditZoneDialogOpen] = useState(false);
  const [isDeleteZoneDialogOpen, setIsDeleteZoneDialogOpen] = useState(false);
  const [isImportZonesDialogOpen, setIsImportZonesDialogOpen] = useState(false);
  const [isExportZonesDialogOpen, setIsExportZonesDialogOpen] = useState(false);
  const [isCopyZonesDialogOpen, setIsCopyZonesDialogOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [isMapViewDialogOpen, setIsMapViewDialogOpen] = useState(false);
  const [isCoverageAreasDialogOpen, setIsCoverageAreasDialogOpen] = useState(false);
  const [isAddCoverageAreaDialogOpen, setIsAddCoverageAreaDialogOpen] = useState(false);
  const [isEditCoverageAreaDialogOpen, setIsEditCoverageAreaDialogOpen] = useState(false);
  const [isDeleteCoverageAreaDialogOpen, setIsDeleteCoverageAreaDialogOpen] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<ShippingCompany | null>(null);
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
  const [selectedCoverageArea, setSelectedCoverageArea] = useState<CoverageArea | null>(null);
  const [targetCompanyId, setTargetCompanyId] = useState<string>("");
  const [importData, setImportData] = useState<string>("");
  const [exportData, setExportData] = useState<string>("");
  const [selectedZonesForBulk, setSelectedZonesForBulk] = useState<string[]>([]);
  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [availableGovernorates, setAvailableGovernorates] = useState<string[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [newCompany, setNewCompany] = useState({
    name: "",
    phone: "",
    address: "",
    website: "", // إضافة حقل الموقع
    whatsapp: "", // إضافة حقل الواتساب
    email: "", // إضافة حقل البريد الإلكتروني
  });

  const [newZone, setNewZone] = useState({
    name: "",
    price: 0,
  });

  // جلب البيانات
  const loadData = useCallback(async (showToast = true) => {
    try {
      setIsLoading(true);

      // جلب شركات الشحن
      const companies = await getShippingCompanies();
      setShippingCompanies(companies);
      setLastUpdated(new Date());

      if (showToast) {
        toast.success("تم تحميل بيانات شركات الشحن بنجاح");
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

  // تحديث البيانات كل 30 ثانية
  useEffect(() => {
    const intervalId = setInterval(async () => {
      loadData(false);
      // تحديث قائمة المحافظات المتاحة
      const govs = await getAvailableGovernorates();
      setAvailableGovernorates(govs);
    }, 30000); // 30 ثانية

    return () => clearInterval(intervalId);
  }, [loadData]);

  // تحديث البيانات عند العودة للصفحة
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        loadData(false);
        // تحديث قائمة المحافظات المتاحة
        const govs = await getAvailableGovernorates();
        setAvailableGovernorates(govs);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

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

  // إضافة شركة شحن جديدة
  const handleAddCompany = async () => {
    try {
      if (!newCompany.name || !newCompany.phone || !newCompany.address) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }

      const addedCompany = await addShippingCompany(newCompany);
      setShippingCompanies([...shippingCompanies, addedCompany]);
      setNewCompany({ name: "", phone: "", address: "", website: "", whatsapp: "", email: "" });
      setIsAddDialogOpen(false);
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
        whatsapp: selectedCompany.whatsapp,
        email: selectedCompany.email
      });
      setShippingCompanies(shippingCompanies.map(company =>
        company.id === updatedCompany.id ? updatedCompany : company
      ));
      setSelectedCompany(null);
      setIsEditDialogOpen(false);
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
      setShippingCompanies(shippingCompanies.filter(company => company.id !== selectedCompany.id));
      setSelectedCompany(null);
      setIsDeleteDialogOpen(false);
      toast.success("تم حذف شركة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء حذف شركة الشحن:", error);
      toast.error("حدث خطأ أثناء حذف شركة الشحن");
    }
  };

  // إضافة منطقة شحن جديدة
  const handleAddZone = async () => {
    try {
      if (!selectedCompany) return;

      if (!newZone.name || newZone.price <= 0) {
        toast.error("يرجى إدخال اسم المنطقة وسعر الشحن بشكل صحيح");
        return;
      }

      const addedZone = await addShippingZone(selectedCompany.id, newZone.name, newZone.price);

      if (!addedZone) {
        toast.error("حدث خطأ أثناء إضافة منطقة الشحن");
        return;
      }

      // تحديث الشركة في القائمة المحلية
      const updatedCompanies = shippingCompanies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            shippingZones: [...company.shippingZones, addedZone]
          };
        }
        return company;
      });

      setShippingCompanies(updatedCompanies);
      setSelectedCompany(updatedCompanies.find(c => c.id === selectedCompany.id) || null);
      setNewZone({ name: "", price: 0 });
      setIsAddZoneDialogOpen(false);
      toast.success("تم إضافة منطقة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء إضافة منطقة الشحن:", error);
      toast.error("حدث خطأ أثناء إضافة منطقة الشحن");
    }
  };

  // تحديث منطقة شحن
  const handleUpdateZone = async () => {
    try {
      if (!selectedCompany || !selectedZone) return;

      if (!selectedZone.name || selectedZone.price <= 0) {
        toast.error("يرجى إدخال اسم المنطقة وسعر الشحن بشكل صحيح");
        return;
      }

      const updatedZone = await updateShippingZone(
        selectedCompany.id,
        selectedZone.id,
        selectedZone.name,
        selectedZone.price
      );

      if (!updatedZone) {
        toast.error("حدث خطأ أثناء تحديث منطقة الشحن");
        return;
      }

      // تحديث الشركة في القائمة المحلية
      const updatedCompanies = shippingCompanies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            shippingZones: company.shippingZones.map(zone =>
              zone.id === updatedZone.id ? updatedZone : zone
            )
          };
        }
        return company;
      });

      setShippingCompanies(updatedCompanies);
      setSelectedCompany(updatedCompanies.find(c => c.id === selectedCompany.id) || null);
      setSelectedZone(null);
      setIsEditZoneDialogOpen(false);
      toast.success("تم تحديث منطقة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء تحديث منطقة الشحن:", error);
      toast.error("حدث خطأ أثناء تحديث منطقة الشحن");
    }
  };

  // حذف منطقة شحن
  const handleDeleteZone = async () => {
    try {
      if (!selectedCompany || !selectedZone) return;

      const success = await deleteShippingZone(selectedCompany.id, selectedZone.id);

      if (!success) {
        toast.error("حدث خطأ أثناء حذف منطقة الشحن");
        return;
      }

      // تحديث الشركة في القائمة المحلية
      const updatedCompanies = shippingCompanies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            shippingZones: company.shippingZones.filter(zone => zone.id !== selectedZone.id)
          };
        }
        return company;
      });

      setShippingCompanies(updatedCompanies);
      setSelectedCompany(updatedCompanies.find(c => c.id === selectedCompany.id) || null);
      setSelectedZone(null);
      setIsDeleteZoneDialogOpen(false);
      toast.success("تم حذف منطقة الشحن بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء حذف منطقة الشحن:", error);
      toast.error("حدث خطأ أثناء حذف منطقة الشحن");
    }
  };

  // تصدير مناطق الشحن
  const handleExportZones = async () => {
    try {
      if (!selectedCompany) return;

      const exportedData = await exportShippingZones(selectedCompany.id);
      setExportData(exportedData);
      setIsExportZonesDialogOpen(true);

    } catch (error) {
      console.error("حدث خطأ أثناء تصدير مناطق الشحن:", error);
      toast.error("حدث خطأ أثناء تصدير مناطق الشحن");
    }
  };

  // استيراد مناطق الشحن
  const handleImportZones = async () => {
    try {
      if (!selectedCompany || !importData) {
        toast.error("يرجى إدخال بيانات صالحة للاستيراد");
        return;
      }

      const newZones = await importShippingZones(selectedCompany.id, JSON.parse(importData));

      // تحديث الشركة في القائمة المحلية
      const updatedCompanies = shippingCompanies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            shippingZones: [...company.shippingZones, ...newZones]
          };
        }
        return company;
      });

      setShippingCompanies(updatedCompanies);
      setSelectedCompany(updatedCompanies.find(c => c.id === selectedCompany.id) || null);
      setImportData("");
      setIsImportZonesDialogOpen(false);
      toast.success(`تم استيراد ${newZones.length} منطقة شحن بنجاح`);

      // تحديث قائمة المحافظات المتاحة
      setAvailableGovernorates(getAvailableGovernorates());

    } catch (error) {
      console.error("حدث خطأ أثناء استيراد مناطق الشحن:", error);
      toast.error("حدث خطأ أثناء استيراد مناطق الشحن: " + (error as Error).message);
    }
  };

  // نسخ مناطق الشحن من شركة إلى أخرى
  const handleCopyZones = async () => {
    try {
      if (!selectedCompany || !targetCompanyId) {
        toast.error("يرجى اختيار شركة الشحن الهدف");
        return;
      }

      if (selectedCompany.id === targetCompanyId) {
        toast.error("لا يمكن نسخ المناطق إلى نفس الشركة");
        return;
      }

      const newZones = await copyShippingZones(selectedCompany.id, targetCompanyId);

      // تحديث الشركات في القائمة المحلية
      const updatedCompanies = shippingCompanies.map(company => {
        if (company.id === targetCompanyId) {
          return {
            ...company,
            shippingZones: [...company.shippingZones, ...newZones]
          };
        }
        return company;
      });

      setShippingCompanies(updatedCompanies);
      setTargetCompanyId("");
      setIsCopyZonesDialogOpen(false);
      toast.success(`تم نسخ ${newZones.length} منطقة شحن بنجاح`);

    } catch (error) {
      console.error("حدث خطأ أثناء نسخ مناطق الشحن:", error);
      toast.error("حدث خطأ أثناء نسخ مناطق الشحن: " + (error as Error).message);
    }
  };

  // تحديث أسعار مجموعة من المناطق دفعة واحدة
  const handleBulkUpdatePrices = async () => {
    try {
      if (!selectedCompany || selectedZonesForBulk.length === 0 || bulkPrice <= 0) {
        toast.error("يرجى اختيار المناطق وإدخال سعر صحيح");
        return;
      }

      const updates = selectedZonesForBulk.map(zoneId => ({
        zoneId,
        price: bulkPrice
      }));

      const updatedZones = await bulkUpdateZonePrices(selectedCompany.id, updates);

      if (!updatedZones) {
        toast.error("حدث خطأ أثناء تحديث الأسعار");
        return;
      }

      // تحديث الشركة في القائمة المحلية
      const updatedCompanies = shippingCompanies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            shippingZones: updatedZones
          };
        }
        return company;
      });

      setShippingCompanies(updatedCompanies);
      setSelectedCompany(updatedCompanies.find(c => c.id === selectedCompany.id) || null);
      setSelectedZonesForBulk([]);
      setBulkPrice(0);
      setIsBulkUpdateDialogOpen(false);
      toast.success(`تم تحديث أسعار ${selectedZonesForBulk.length} منطقة شحن بنجاح`);

    } catch (error) {
      console.error("حدث خطأ أثناء تحديث أسعار المناطق:", error);
      toast.error("حدث خطأ أثناء تحديث أسعار المناطق: " + (error as Error).message);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // تنسيق المبلغ
  const formatAmount = (amount: number | undefined) => {
    return formatPrice(amount) + " EGP";
  };

  // تحديث المدن المتاحة عند اختيار محافظة
  const handleGovernorateChange = async (governorate: string) => {
    setSelectedGovernorate(governorate);
    setSelectedCities([]);
    const cities = await getCitiesByGovernorate(governorate);
    setAvailableCities(cities);
  };

  // إضافة منطقة تغطية جديدة
  const handleAddCoverageArea = async () => {
    try {
      if (!selectedCompany) return;

      if (!selectedGovernorate || selectedCities.length === 0) {
        toast.error("يرجى اختيار المحافظة والمدن");
        return;
      }

      const newCoverageArea = {
        governorate: selectedGovernorate,
        cities: selectedCities
      };

      const addedArea = await addCoverageArea(selectedCompany.id, newCoverageArea);

      if (!addedArea) {
        toast.error("حدث خطأ أثناء إضافة منطقة التغطية");
        return;
      }

      // تحديث الشركة في القائمة المحلية
      const updatedCompanies = shippingCompanies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            coverageAreas: [...(company.coverageAreas || []), addedArea]
          };
        }
        return company;
      });

      setShippingCompanies(updatedCompanies);
      setSelectedCompany(updatedCompanies.find(c => c.id === selectedCompany.id) || null);
      setSelectedGovernorate("");
      setSelectedCities([]);
      setAvailableCities([]);
      setIsAddCoverageAreaDialogOpen(false);
      toast.success("تم إضافة منطقة التغطية بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء إضافة منطقة التغطية:", error);
      toast.error("حدث خطأ أثناء إضافة منطقة التغطية");
    }
  };

  // تحديث منطقة تغطية
  const handleUpdateCoverageArea = async () => {
    try {
      if (!selectedCompany || !selectedCoverageArea) return;

      if (!selectedGovernorate || selectedCities.length === 0) {
        toast.error("يرجى اختيار المحافظة والمدن");
        return;
      }

      const updatedArea = await updateCoverageArea(
        selectedCompany.id,
        selectedCoverageArea.id,
        {
          governorate: selectedGovernorate,
          cities: selectedCities
        }
      );

      if (!updatedArea) {
        toast.error("حدث خطأ أثناء تحديث منطقة التغطية");
        return;
      }

      // تحديث الشركة في القائمة المحلية
      const updatedCompanies = shippingCompanies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            coverageAreas: (company.coverageAreas || []).map(area =>
              area.id === updatedArea.id ? updatedArea : area
            )
          };
        }
        return company;
      });

      setShippingCompanies(updatedCompanies);
      setSelectedCompany(updatedCompanies.find(c => c.id === selectedCompany.id) || null);
      setSelectedCoverageArea(null);
      setSelectedGovernorate("");
      setSelectedCities([]);
      setAvailableCities([]);
      setIsEditCoverageAreaDialogOpen(false);
      toast.success("تم تحديث منطقة التغطية بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء تحديث منطقة التغطية:", error);
      toast.error("حدث خطأ أثناء تحديث منطقة التغطية");
    }
  };

  // حذف منطقة تغطية
  const handleDeleteCoverageArea = async () => {
    try {
      if (!selectedCompany || !selectedCoverageArea) return;

      const success = await deleteCoverageArea(selectedCompany.id, selectedCoverageArea.id);

      if (!success) {
        toast.error("حدث خطأ أثناء حذف منطقة التغطية");
        return;
      }

      // تحديث الشركة في القائمة المحلية
      const updatedCompanies = shippingCompanies.map(company => {
        if (company.id === selectedCompany.id) {
          return {
            ...company,
            coverageAreas: (company.coverageAreas || []).filter(area => area.id !== selectedCoverageArea.id)
          };
        }
        return company;
      });

      setShippingCompanies(updatedCompanies);
      setSelectedCompany(updatedCompanies.find(c => c.id === selectedCompany.id) || null);
      setSelectedCoverageArea(null);
      setIsDeleteCoverageAreaDialogOpen(false);
      toast.success("تم حذف منطقة التغطية بنجاح");
    } catch (error) {
      console.error("حدث خطأ أثناء حذف منطقة التغطية:", error);
      toast.error("حدث خطأ أثناء حذف منطقة التغطية");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">شركات الشحن</h1>
            <p className="text-muted-foreground">
              إدارة شركات الشحن ومتابعة أدائها
            </p>
          </div>
          <div className="flex flex-col items-end">
            <Button
              onClick={() => loadData(true)}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'جاري التحديث...' : 'تحديث البيانات'}
            </Button>
            <div className="text-xs text-muted-foreground mt-1">
              آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}
            </div>
          </div>
        </div>

        {/* أدوات البحث والإضافة */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="بحث عن شركة شحن..."
              className="pl-10 h-9 rounded-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة شركة شحن
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة شركة شحن جديدة</DialogTitle>
                <DialogDescription>
                  أدخل بيانات شركة الشحن الجديدة
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الشركة</Label>
                  <Input
                    id="name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="أدخل اسم الشركة"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={newCompany.phone}
                    onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input
                    id="address"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                    placeholder="أدخل العنوان"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">رقم الواتساب (للطلبات)</Label>
                  <Input
                    id="whatsapp"
                    value={newCompany.whatsapp}
                    onChange={(e) => setNewCompany({ ...newCompany, whatsapp: e.target.value })}
                    placeholder="رقم الواتساب الخاص بالطلبات"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">موقع الشركة (اختياري)</Label>
                  <Input
                    id="website"
                    value={newCompany.website}
                    onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                  <Input
                    id="email"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="info@company.com"
                    type="email"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddCompany}>
                  إضافة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* جدول شركات الشحن */}
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
                      <TableHead className="text-right">اسم الشركة</TableHead>
                      <TableHead className="text-center">رقم الهاتف</TableHead>
                      <TableHead className="text-center">العنوان</TableHead>
                      <TableHead className="text-center">الموقع</TableHead>
                      <TableHead className="text-center">المستحقات</TableHead>
                      <TableHead className="text-center">الطلبات المسلمة</TableHead>
                      <TableHead className="text-center">الطلبات المرفوضة</TableHead>
                      <TableHead className="text-center">تاريخ الإضافة</TableHead>
                      <TableHead className="text-center">مناطق التغطية</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium text-right">{company.name}</TableCell>
                        <TableCell className="text-center">{company.phone}</TableCell>
                        <TableCell className="text-center">{company.address}</TableCell>
                        <TableCell className="text-center">
                          {company.website ? (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              🔗 موقع
                            </a>
                          ) : (
                            <span className="text-gray-400">لا يوجد</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-center text-red-600">
                          {formatAmount(company.balance)}
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          {company.deliveredOrders}
                        </TableCell>
                        <TableCell className="text-center text-red-600">
                          {company.rejectedOrders}
                        </TableCell>
                        <TableCell className="text-center text-gray-500">
                          {formatDate(company.createdAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCompany(company);
                                setIsCoverageAreasDialogOpen(true);
                              }}
                              className="h-8 text-green-600"
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              {company.coverageAreas && company.coverageAreas.length > 0 ? (
                                <span>{company.coverageAreas.length} منطقة</span>
                              ) : (
                                <span>إضافة مناطق</span>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCompany(company);
                                setIsZonesDialogOpen(true);
                              }}
                              className="h-8 text-purple-600 mr-1"
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              المناطق
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCompany(company);
                                setIsEditDialogOpen(true);
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
                                setIsDeleteDialogOpen(true);
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
      </div>

      {/* مربع حوار تعديل شركة الشحن */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات شركة الشحن</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات شركة الشحن
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم الشركة</Label>
              <Input
                id="edit-name"
                value={selectedCompany?.name || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, name: e.target.value } : null)}
                placeholder="أدخل اسم الشركة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">رقم الهاتف</Label>
              <Input
                id="edit-phone"
                value={selectedCompany?.phone || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, phone: e.target.value } : null)}
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">العنوان</Label>
              <Input
                id="edit-address"
                value={selectedCompany?.address || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, address: e.target.value } : null)}
                placeholder="أدخل العنوان"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-website">موقع الشركة (اختياري)</Label>
              <Input
                id="edit-website"
                value={selectedCompany?.website || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, website: e.target.value } : null)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">البريد الإلكتروني (اختياري)</Label>
              <Input
                id="edit-email"
                value={selectedCompany?.email || ""}
                onChange={(e) => setSelectedCompany(selectedCompany ? { ...selectedCompany, email: e.target.value } : null)}
                placeholder="info@company.com"
                type="email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateCompany}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار حذف شركة الشحن */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف شركة الشحن</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف شركة الشحن "{selectedCompany?.name}"؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompany}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار إدارة مناطق الشحن */}
      <Dialog open={isZonesDialogOpen} onOpenChange={setIsZonesDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>مناطق الشحن - {selectedCompany?.name}</DialogTitle>
            <DialogDescription>
              إدارة مناطق الشحن وأسعارها لشركة {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setNewZone({ name: "", price: 0 });
                  setIsAddZoneDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة منطقة
              </Button>

              <Button
                onClick={() => {
                  setIsImportZonesDialogOpen(true);
                  setImportData("");
                }}
                variant="outline"
                className="gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                استيراد مناطق
              </Button>

              <Button
                onClick={handleExportZones}
                variant="outline"
                className="gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                تصدير مناطق
              </Button>

              <Button
                onClick={() => {
                  setIsCopyZonesDialogOpen(true);
                  setTargetCompanyId("");
                }}
                variant="outline"
                className="gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                نسخ إلى شركة أخرى
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsBulkUpdateDialogOpen(true);
                  setSelectedZonesForBulk([]);
                  setBulkPrice(0);
                }}
                variant="secondary"
                className="gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-checks">
                  <path d="m3 17 2 2 4-4"></path>
                  <path d="m3 7 2 2 4-4"></path>
                  <path d="M13 6h8"></path>
                  <path d="M13 12h8"></path>
                  <path d="M13 18h8"></path>
                </svg>
                تحديث الأسعار جماعياً
              </Button>

              <Button
                onClick={() => {
                  setIsMapViewDialogOpen(true);
                }}
                variant="secondary"
                className="gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                  <line x1="9" x2="9" y1="3" y2="18"></line>
                  <line x1="15" x2="15" y1="6" y2="21"></line>
                </svg>
                عرض الخريطة
              </Button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المنطقة</TableHead>
                  <TableHead className="text-center">سعر الشحن</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCompany?.shippingZones && selectedCompany.shippingZones.length > 0 ? (
                  selectedCompany.shippingZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium text-right">{zone.name}</TableCell>
                      <TableCell className="text-center">{formatAmount(zone.price)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedZone(zone);
                              setIsEditZoneDialogOpen(true);
                            }}
                            className="h-8 w-8 text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedZone(zone);
                              setIsDeleteZoneDialogOpen(true);
                            }}
                            className="h-8 w-8 text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      لا توجد مناطق شحن مضافة بعد
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsZonesDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار إضافة منطقة شحن جديدة */}
      <Dialog open={isAddZoneDialogOpen} onOpenChange={setIsAddZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة منطقة شحن جديدة</DialogTitle>
            <DialogDescription>
              أدخل بيانات منطقة الشحن الجديدة لشركة {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zone-name">اسم المنطقة</Label>
              <Input
                id="zone-name"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="مثال: القاهرة، الإسكندرية، الدلتا"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-price">سعر الشحن (ج.م)</Label>
              <Input
                id="zone-price"
                type="number"
                min="1"
                value={newZone.price}
                onChange={(e) => setNewZone({ ...newZone, price: parseFloat(e.target.value) || 0 })}
                placeholder="أدخل سعر الشحن"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddZoneDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddZone}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار تعديل منطقة شحن */}
      <Dialog open={isEditZoneDialogOpen} onOpenChange={setIsEditZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل منطقة الشحن</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات منطقة الشحن
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-zone-name">اسم المنطقة</Label>
              <Input
                id="edit-zone-name"
                value={selectedZone?.name || ""}
                onChange={(e) => setSelectedZone(selectedZone ? { ...selectedZone, name: e.target.value } : null)}
                placeholder="مثال: القاهرة، الإسكندرية، الدلتا"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-zone-price">سعر الشحن (ج.م)</Label>
              <Input
                id="edit-zone-price"
                type="number"
                min="1"
                value={selectedZone?.price || 0}
                onChange={(e) => setSelectedZone(selectedZone ? { ...selectedZone, price: parseFloat(e.target.value) || 0 } : null)}
                placeholder="أدخل سعر الشحن"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditZoneDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateZone}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار حذف منطقة شحن */}
      <Dialog open={isDeleteZoneDialogOpen} onOpenChange={setIsDeleteZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف منطقة الشحن</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف منطقة الشحن "{selectedZone?.name}"؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteZoneDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteZone}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار استيراد مناطق الشحن */}
      <Dialog open={isImportZonesDialogOpen} onOpenChange={setIsImportZonesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>استيراد مناطق الشحن</DialogTitle>
            <DialogDescription>
              قم بلصق بيانات المناطق بتنسيق JSON
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-data">بيانات المناطق (JSON)</Label>
              <textarea
                id="import-data"
                className="w-full h-64 p-2 border rounded-md font-mono text-sm"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={`{
  "companyName": "اسم الشركة",
  "zones": [
    {
      "name": "القاهرة",
      "price": 50
    },
    {
      "name": "الإسكندرية",
      "price": 100
    }
  ]
}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportZonesDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleImportZones}>
              استيراد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار تصدير مناطق الشحن */}
      <Dialog open={isExportZonesDialogOpen} onOpenChange={setIsExportZonesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تصدير مناطق الشحن</DialogTitle>
            <DialogDescription>
              يمكنك نسخ هذه البيانات واستخدامها لاحقًا للاستيراد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="export-data">بيانات المناطق (JSON)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(exportData);
                    toast.success("تم نسخ البيانات إلى الحافظة");
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard">
                    <rect x="9" y="2" width="6" height="4" rx="1"></rect>
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  </svg>
                  نسخ
                </Button>
              </div>
              <textarea
                id="export-data"
                className="w-full h-64 p-2 border rounded-md font-mono text-sm"
                value={exportData}
                readOnly
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsExportZonesDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار نسخ مناطق الشحن إلى شركة أخرى */}
      <Dialog open={isCopyZonesDialogOpen} onOpenChange={setIsCopyZonesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>نسخ مناطق الشحن إلى شركة أخرى</DialogTitle>
            <DialogDescription>
              اختر الشركة التي تريد نسخ مناطق الشحن إليها من شركة {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="target-company">الشركة الهدف</Label>
              <select
                id="target-company"
                className="w-full p-2 border rounded-md"
                value={targetCompanyId}
                onChange={(e) => setTargetCompanyId(e.target.value)}
              >
                <option value="">-- اختر شركة --</option>
                {shippingCompanies
                  .filter(company => company.id !== selectedCompany?.id)
                  .map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCopyZonesDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCopyZones}>
              نسخ المناطق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار تحديث أسعار المناطق جماعياً */}
      <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تحديث أسعار المناطق جماعياً</DialogTitle>
            <DialogDescription>
              اختر المناطق التي تريد تحديث أسعارها وأدخل السعر الجديد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اختر المناطق</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-2">
                {selectedCompany?.shippingZones?.map(zone => (
                  <div key={zone.id} className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      id={`zone-${zone.id}`}
                      checked={selectedZonesForBulk.includes(zone.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedZonesForBulk([...selectedZonesForBulk, zone.id]);
                        } else {
                          setSelectedZonesForBulk(selectedZonesForBulk.filter(id => id !== zone.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <label htmlFor={`zone-${zone.id}`} className="text-sm mr-2">
                      {zone.name} ({formatAmount(zone.price)})
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedZonesForBulk(selectedCompany?.shippingZones?.map(zone => zone.id) || [])}
                >
                  تحديد الكل
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedZonesForBulk([])}
                >
                  إلغاء التحديد
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-price">السعر الجديد (ج.م)</Label>
              <Input
                id="bulk-price"
                type="number"
                min="1"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(parseFloat(e.target.value) || 0)}
                placeholder="أدخل السعر الجديد"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkUpdateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleBulkUpdatePrices}
              disabled={selectedZonesForBulk.length === 0 || bulkPrice <= 0}
            >
              تحديث الأسعار ({selectedZonesForBulk.length} منطقة)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار عرض الخريطة */}
      <Dialog open={isMapViewDialogOpen} onOpenChange={setIsMapViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>خريطة مناطق الشحن</DialogTitle>
            <DialogDescription>
              عرض مناطق الشحن على الخريطة لشركة {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border rounded-md p-4 h-[500px] flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
                <h3 className="text-lg font-medium text-gray-900">الخريطة التفاعلية</h3>
                <p className="mt-1 text-sm text-gray-500">
                  سيتم إضافة الخريطة التفاعلية في التحديث القادم
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsMapViewDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* مربع حوار إدارة مناطق التغطية */}
      <Dialog open={isCoverageAreasDialogOpen} onOpenChange={setIsCoverageAreasDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>مناطق التغطية - {selectedCompany?.name}</DialogTitle>
            <DialogDescription>
              إدارة المحافظات والمدن التي تغطيها شركة {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setSelectedGovernorate("");
                  setSelectedCities([]);
                  setAvailableCities([]);
                  setIsAddCoverageAreaDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة منطقة تغطية
              </Button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المحافظة</TableHead>
                  <TableHead className="text-center">المدن</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCompany?.coverageAreas && selectedCompany.coverageAreas.length > 0 ? (
                  selectedCompany.coverageAreas.map((area) => (
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCoverageArea(area);
                              setSelectedGovernorate(area.governorate);
                              setSelectedCities([...area.cities]);
                              setAvailableCities(getCitiesByGovernorate(area.governorate));
                              setIsEditCoverageAreaDialogOpen(true);
                            }}
                            className="h-8 w-8 text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCoverageArea(area);
                              setIsDeleteCoverageAreaDialogOpen(true);
                            }}
                            className="h-8 w-8 text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      لا توجد مناطق تغطية مضافة بعد
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCoverageAreasDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار إضافة منطقة تغطية جديدة */}
      <Dialog open={isAddCoverageAreaDialogOpen} onOpenChange={setIsAddCoverageAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة منطقة تغطية جديدة</DialogTitle>
            <DialogDescription>
              اختر المحافظة والمدن التي تغطيها شركة {selectedCompany?.name}
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
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                  {availableCities.map((city) => (
                    <div key={city} className="flex items-center mb-2">
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
                  ))}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCoverageAreaDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddCoverageArea}>
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار تعديل منطقة تغطية */}
      <Dialog open={isEditCoverageAreaDialogOpen} onOpenChange={setIsEditCoverageAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل منطقة التغطية</DialogTitle>
            <DialogDescription>
              قم بتعديل المدن التي تغطيها شركة {selectedCompany?.name} في محافظة {selectedGovernorate}
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
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                  {availableCities.map((city) => (
                    <div key={city} className="flex items-center mb-2">
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
                  ))}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCoverageAreaDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateCoverageArea}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* مربع حوار حذف منطقة تغطية */}
      <Dialog open={isDeleteCoverageAreaDialogOpen} onOpenChange={setIsDeleteCoverageAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف منطقة التغطية</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف منطقة التغطية "{selectedCoverageArea?.governorate}"؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCoverageAreaDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteCoverageArea}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ShippingCompanies;
