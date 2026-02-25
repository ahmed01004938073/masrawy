import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Building, Upload, Save, Printer, Archive, UserCog, Database, Trash2, Download, Shield, Lock } from "lucide-react";
import ArchiveManager from "@/components/archive/ArchiveManager";
import StorageAnalyzer from "@/components/settings/StorageAnalyzer";
import { useNavigate } from "react-router-dom";
import { getOrders, deleteOrder } from "@/services/orderService";
import { getProducts, deleteProduct } from "@/services/productService";
import { useAuth } from "@/contexts/AuthContext";
import { getSiteSettings, updateSiteSettings } from "@/services/siteSettingsService";
import { printInvoice, InvoiceData } from "@/utils/invoiceTemplate";
import AdminSecurityDialog from "@/components/common/AdminSecurityDialog";

// Default company settings
const defaultSettings = {
  companyName: "شركة أفليت للتجارة الإلكترونية",
  companyLogo: "/logo.png",
  companyPhone: "01XXXXXXXXX",
  companyEmail: "info@afleet.com",
  companyAddress: "القاهرة، مصر",
};

const Settings = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(1);

  // Security State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(true);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);

  const normalizeNumerals = (str: string) => {
    const arabicNumerals = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let result = str;
    for (let i = 0; i < 10; i++) {
      result = result.replace(arabicNumerals[i], i.toString());
    }
    return result;
  };

  // Check if password matches
  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const settings = await getSiteSettings();
        const storedPassword = sessionStorage.getItem("admin_settings_session_token");
        const adminPassword = settings?.adminMasterPassword || "3990";

        const normalizedStored = storedPassword ? normalizeNumerals(String(storedPassword).trim()) : null;
        const normalizedTarget = normalizeNumerals(String(adminPassword).trim());

        if (normalizedStored === normalizedTarget) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setIsSecurityDialogOpen(true);
        }
      } catch (error) {
        console.error("Security check failed:", error);
        setIsSecurityDialogOpen(true);
      } finally {
        setIsCheckingSecurity(false);
      }
    };

    checkSecurity();
  }, []);

  const handleSecuritySuccess = async () => {
    const settings = await getSiteSettings();
    const adminPassword = settings?.adminMasterPassword || "3990";
    sessionStorage.setItem("admin_settings_session_token", String(adminPassword).trim());
    setIsAuthorized(true);
    setIsSecurityDialogOpen(false);
  };

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const siteSettings = await getSiteSettings();
        if (siteSettings.companyName || siteSettings.companyPhone) {
          setSettings({
            companyName: siteSettings.companyName || defaultSettings.companyName,
            companyLogo: siteSettings.companyLogo || defaultSettings.companyLogo,
            companyPhone: siteSettings.companyPhone || defaultSettings.companyPhone,
            companyEmail: siteSettings.companyEmail || defaultSettings.companyEmail,
            companyAddress: siteSettings.companyAddress || defaultSettings.companyAddress,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save settings to API
      await updateSiteSettings({
        companyName: settings.companyName,
        companyLogo: settings.companyLogo,
        companyPhone: settings.companyPhone,
        companyEmail: settings.companyEmail,
        companyAddress: settings.companyAddress,
      });

      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      toast.info("جاري تحميل النسخة الاحتياطية...");
      const token = sessionStorage.getItem("admin_auth_token") || localStorage.getItem("admin_auth_token");
      const response = await fetch('/api/settings/data/backup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to download backup");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success("تم تحميل النسخة الاحتياطية بنجاح");
    } catch (error) {
      toast.error("فشل تحميل النسخة الاحتياطية");
    }
  };

  const loadAuditLogs = async (page = 1) => {
    try {
      const token = sessionStorage.getItem("admin_auth_token") || localStorage.getItem("admin_auth_token");
      const response = await fetch(`/api/settings/data/audit-logs?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to load audit logs");
      const data = await response.json();
      setAuditLogs(data.data || []);
      setAuditPage(page);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    }
  };

  const handleResetData = async () => {
    // Confirmation
    if (!window.confirm("تحذير: هذا الإجراء سيقوم بحذف جميع البيانات نهائياً من قاعدة البيانات. هل أنت متأكد؟")) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. Delete all orders
      const result = await getOrders();
      const orders = Array.isArray(result) ? result : result.data;
      let ordersDeleted = 0;
      for (const order of orders) {
        if (order.id) {
          await deleteOrder(order.id);
          ordersDeleted++;
        }
      }
      console.log(`Deleted ${ordersDeleted} orders`);

      // 2. Delete all products
      const prodResult = await getProducts();
      const products = Array.isArray(prodResult) ? prodResult : prodResult.data;
      let productsDeleted = 0;
      for (const product of products) {
        if (product.id) {
          await deleteProduct(product.id);
          productsDeleted++;
        }
      }
      console.log(`Deleted ${productsDeleted} products`);

      // 3. Clear all Local Storage and Cookies
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      toast.success(`تم حذف ${ordersDeleted} طلب و ${productsDeleted} منتج بنجاح. سيتم إعادة تحميل الصفحة...`);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Reset data error:", error);
      toast.error("حدث خطأ أثناء حذف البيانات من قاعدة البيانات");
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً. يرجى اختيار صورة أصغر من 2 ميجابايت");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      setSettings((prev) => ({
        ...prev,
        companyLogo: base64String,
      }));

      // Auto-save after logo upload
      try {
        await updateSiteSettings({ companyLogo: base64String });
        toast.success("تم تحديث وحفظ شعار الشركة");
      } catch (error) {
        toast.error("حدث خطأ أثناء حفظ الشعار");
      }
    };

    reader.onerror = () => {
      toast.error("حدث خطأ أثناء قراءة الصورة");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setSettings((prev) => ({
      ...prev,
      companyLogo: "",
    }));

    // Auto-save after logo removal
    try {
      await updateSiteSettings({ companyLogo: "" });
      toast.success("تم حذف شعار الشركة");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الشعار");
    }
  };

  const handlePrintSample = () => {
    try {
      const sampleInvoice: InvoiceData = {
        orderNumber: "12345",
        customerName: "أحمد محمد علي",
        customerPhone: "01012345678",
        customerAddress: "شارع النيل، المعادي، القاهرة",
        province: "القاهرة",
        city: "المعادي",
        notes: "يرجى التسليم في المساء بعد الساعة 6 مساءً",
        items: [
          {
            id: "1",
            name: "هاتف ذكي سامسونج جالاكسي",
            quantity: 1,
            price: 5000,
            total: 5000,
            color: "أسود",
            size: "128GB"
          },
          {
            id: "2",
            name: "سماعات لاسلكية",
            quantity: 1,
            price: 500,
            total: 500,
            color: "أبيض"
          }
        ],
        subtotal: 5500,
        shippingFee: 50,
        total: 5550,
        date: new Date().toLocaleDateString('en-GB'),
        page: "صفحة الفيسبوك"
      };

      printInvoice(sampleInvoice, settings);
      toast.success("جاري طباعة نموذج الفاتورة");
    } catch (error) {
      toast.error("حدث خطأ أثناء طباعة النموذج");
    }
  };

  if (isCheckingSecurity) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Shield className="h-16 w-16 text-muted-foreground opacity-20" />
          <h2 className="text-xl font-bold font-cairo">هذه الصفحة محمية</h2>
          <p className="text-muted-foreground font-cairo">يرجى إدخال كلمة المرور للوصول إلى إعدادات النظام</p>
          <Button onClick={() => setIsSecurityDialogOpen(true)}>
            إدخال كلمة المرور
          </Button>
          <AdminSecurityDialog
            isOpen={isSecurityDialogOpen}
            onClose={() => navigate("/admin/dashboard")}
            onSuccess={handleSecuritySuccess}
            passwordType="admin"
            title="إعدادات النظام"
            description="الوصول للإعدادات يتطلب كلمة مرور خاصة بصلاحيات الإدارة."
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-cairo">إعدادات النظام</h1>
        </div>

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="company">معلومات الشركة</TabsTrigger>
            <TabsTrigger value="invoice">إعدادات الفاتورة</TabsTrigger>
            <TabsTrigger value="employees">
              <div className="flex items-center gap-1">
                <UserCog className="h-4 w-4" />
                الموظفين
              </div>
            </TabsTrigger>
            <TabsTrigger value="archive">
              <div className="flex items-center gap-1">
                <Archive className="h-4 w-4" />
                أرشيف الفواتير
              </div>
            </TabsTrigger>
            <TabsTrigger value="data">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                النسخ والأمان
              </div>
            </TabsTrigger>

          </TabsList>

          <TabsContent value="company">
            <Card className="border-2">
              <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Building className="ml-3 h-5 w-5 text-primary-500" />
                  <span className="font-cairo">معلومات الشركة</span>
                </CardTitle>
                <CardDescription>
                  هذه المعلومات ستظهر في الفواتير والتقارير
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">اسم الشركة</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={settings.companyName}
                      onChange={handleInputChange}
                      placeholder="أدخل اسم الشركة"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">رقم الهاتف</Label>
                    <Input
                      id="companyPhone"
                      name="companyPhone"
                      value={settings.companyPhone}
                      onChange={handleInputChange}
                      placeholder="أدخل رقم الهاتف"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
                    <Input
                      id="companyEmail"
                      name="companyEmail"
                      value={settings.companyEmail}
                      onChange={handleInputChange}
                      placeholder="أدخل البريد الإلكتروني"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">العنوان</Label>
                    <Input
                      id="companyAddress"
                      name="companyAddress"
                      value={settings.companyAddress}
                      onChange={handleInputChange}
                      placeholder="أدخل عنوان الشركة"
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label>شعار الشركة</Label>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    {settings.companyLogo && (
                      <div className="h-20 w-20 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={settings.companyLogo}
                          alt="شعار الشركة"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex gap-2 mb-2">
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("logo-upload")?.click()}
                          className="flex-1"
                        >
                          <Upload className="ml-2 h-4 w-4" />
                          {settings.companyLogo ? "تغيير الشعار" : "تحميل شعار"}
                        </Button>
                        {settings.companyLogo && (
                          <Button
                            variant="destructive"
                            onClick={handleRemoveLogo}
                            size="sm"
                          >
                            حذف
                          </Button>
                        )}
                      </div>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <p className="text-sm text-gray-500">
                        يفضل استخدام صورة بخلفية شفافة بحجم 200×200 بكسل (أقل من 2 ميجابايت)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t p-4 rounded-b-lg">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="mr-auto"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full ml-2"></span>
                      جاري الحفظ...
                    </span>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ الإعدادات
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="invoice">
            <Card className="border-2">
              <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <Printer className="ml-3 h-5 w-5 text-primary-500" />
                  <span className="font-cairo">إعدادات الفاتورة</span>
                </CardTitle>
                <CardDescription>
                  تخصيص مظهر الفواتير المطبوعة
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <p className="text-gray-500">
                    يتم استخدام معلومات الشركة المدخلة في القسم السابق في الفواتير.
                    يمكنك طباعة نموذج للفاتورة لمعاينة الشكل النهائي.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">معلومات تظهر في الفاتورة:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>اسم الشركة وشعارها</li>
                      <li>بيانات العميل (الاسم، الهاتف، العنوان)</li>
                      <li>تفاصيل المنتجات (الاسم، الكمية، السعر)</li>
                      <li>ملخص الطلب (إجمالي المنتجات، الشحن، الخصم)</li>
                      <li>السعر + الشحن (الإجمالي)</li>
                      <li>معلومات التواصل مع الشركة</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t p-4 rounded-b-lg">
                <Button
                  variant="outline"
                  onClick={handlePrintSample}
                  className="mr-auto"
                >
                  <Printer className="ml-2 h-4 w-4" />
                  طباعة نموذج فاتورة
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card className="border-2">
              <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-xl flex items-center">
                  <UserCog className="ml-3 h-5 w-5 text-primary-500" />
                  <span className="font-cairo">إدارة الموظفين</span>
                </CardTitle>
                <CardDescription>
                  إدارة حسابات الموظفين وصلاحياتهم في النظام
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <p className="text-gray-500">
                    يمكنك إدارة حسابات الموظفين وتحديد صلاحياتهم للوصول إلى أقسام النظام المختلفة.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-2">ميزات إدارة الموظفين:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>إضافة موظفين جدد وتحديد أدوارهم</li>
                      <li>تعديل بيانات الموظفين الحاليين</li>
                      <li>تحديد صلاحيات الوصول لكل موظف</li>
                      <li>تفعيل وتعطيل حسابات الموظفين</li>
                      <li>حذف حسابات الموظفين</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t p-4 rounded-b-lg">
                <Button
                  onClick={() => navigate("/admin/employees")}
                  className="mr-auto"
                  disabled={!hasPermission("employees", "view")}
                >
                  <UserCog className="ml-2 h-4 w-4" />
                  إدارة الموظفين
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="archive">
            <ArchiveManager />
          </TabsContent>

          <TabsContent value="data">
            <div className="space-y-6">
              {/* Backup Section */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center">
                    <Download className="ml-3 h-5 w-5 text-primary-500" />
                    <span className="font-cairo">النسخ الاحتياطي</span>
                  </CardTitle>
                  <CardDescription>
                    قم بتحميل نسخة احتياطية كاملة من قاعدة البيانات
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <p className="text-gray-500">
                      يمكنك تحميل نسخة احتياطية كاملة من جميع البيانات في قاعدة البيانات بصيغة JSON.
                      احفظ هذا الملف في مكان آمن.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t p-4 rounded-b-lg">
                  <Button onClick={handleBackup} className="mr-auto">
                    <Download className="ml-2 h-4 w-4" />
                    تحميل النسخة الاحتياطية
                  </Button>
                </CardFooter>
              </Card>

              {/* Audit Logs Section */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                  <CardTitle className="text-xl flex items-center">
                    <Shield className="ml-3 h-5 w-5 text-primary-500" />
                    <span className="font-cairo">سجل العمليات</span>
                  </CardTitle>
                  <CardDescription>
                    عرض سجل جميع العمليات التي تمت في النظام
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    <Button onClick={() => loadAuditLogs(1)} variant="outline">
                      تحميل السجل
                    </Button>

                    {auditLogs.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-2 text-right">التاريخ</th>
                              <th className="p-2 text-right">المستخدم</th>
                              <th className="p-2 text-right">النوع</th>
                              <th className="p-2 text-right">الإجراء</th>
                              <th className="p-2 text-right">التفاصيل</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditLogs.map((log, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="p-2 text-right">{new Date(log.createdAt).toLocaleString('ar-EG')}</td>
                                <td className="p-2 text-right">{log.userId || 'N/A'}</td>
                                <td className="p-2 text-right">{log.userType || 'N/A'}</td>
                                <td className="p-2 text-right">{log.action}</td>
                                <td className="p-2 text-right text-xs text-gray-500">
                                  {JSON.stringify(log.details).substring(0, 50)}...
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
