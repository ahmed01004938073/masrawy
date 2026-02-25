import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  Image,
  Palette,
  Home,
  Share,
  Phone,
  FileText,
  Search,
  Plus,
  Trash2,
  UploadCloud,
  X,
  MoveUp,
  MoveDown,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
  MessageSquare,
  Lock,
  Unlock,
  Calendar,
  Clock,
  AlertTriangle,
  Store,
  ExternalLink,
  Globe,
  Archive,
  Eye,
  EyeOff,
  Shield,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSiteSettings,
  saveSiteSettings,
  updateSiteSettings,
  SiteSettings as SiteSettingsType,
  Banner,
  SocialLink,
  SocialPlatform
} from "@/services/siteSettingsService";
import { getProducts } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import AdminSecurityDialog from "@/components/common/AdminSecurityDialog";

function SiteSettingsPage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<SiteSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [officialCategories, setOfficialCategories] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  // مراجع لحقول تحميل الملفات
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const faviconFileInputRef = useRef<HTMLInputElement>(null);
  const storeNameImageFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const dashboardLogoFileInputRef = useRef<HTMLInputElement>(null);
  const loginPageImageFileInputRef = useRef<HTMLInputElement>(null);

  // حالة البانر الجديد
  // حالة البانر الجديد
  const [newBanner, setNewBanner] = useState<Omit<Banner, 'id'>>({
    imageUrl: '',
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    order: 1,
    active: true,
    type: 'main'
  });

  // حالة تحميل الصور
  const [selectedLogoImage, setSelectedLogoImage] = useState<string | null>(null);
  const [selectedFaviconImage, setSelectedFaviconImage] = useState<string | null>(null);
  const [selectedStoreNameImage, setSelectedStoreNameImage] = useState<string | null>(null);
  const [selectedBannerImage, setSelectedBannerImage] = useState<string | null>(null);
  const [selectedDashboardLogoImage, setSelectedDashboardLogoImage] = useState<string | null>(null);
  const [selectedLoginPageImage, setSelectedLoginPageImage] = useState<string | null>(null);

  // فلتر البانرات النشط
  const [activeFilter, setActiveFilter] = useState<'main' | 'featured' | 'bestseller' | 'footer' | null>(null);

  // حالة رابط التواصل الاجتماعي الجديد
  const [newSocialLink, setNewSocialLink] = useState<Omit<SocialLink, 'id'>>({
    platform: 'facebook',
    url: '',
    active: true
  });

  // قوالب رسائل الإغلاق مع الإيموشنات
  const closureTemplates = [
    {
      title: "المتجر مغلق مؤقتاً",
      message: "🔧 نعتذر، المتجر مغلق حالياً لأعمال الصيانة والتطوير. سنعود قريباً بخدمة أفضل! 🚀",
      emoji: "🔧"
    },
    {
      title: "إجازة العيد",
      message: "🎉 كل عام وأنتم بخير! المتجر مغلق بمناسبة العيد السعيد. سنعود بعد العيد مباشرة 🌙✨",
      emoji: "🎉"
    },
    {
      title: "إجازة نهاية الأسبوع",
      message: "😴 المتجر مغلق في عطلة نهاية الأسبوع للراحة. سنعود يوم السبت بنشاط وحيوية! 💪",
      emoji: "😴"
    },
    {
      title: "إجازة رمضان",
      message: "🌙 رمضان كريم! المتجر مغلق خلال ساعات الإفطار. سنعود بعد الإفطار لخدمتكم 🍽️",
      emoji: "🌙"
    },
    {
      title: "تحديث النظام",
      message: "⚡ نقوم بتحديث النظام لتحسين تجربة التسوق. المتجر سيعود خلال ساعات قليلة! 🔄",
      emoji: "⚡"
    },
    {
      title: "إجازة طارئة",
      message: "🚨 المتجر مغلق مؤقتاً لظروف طارئة. نعتذر عن الإزعاج وسنعود في أقرب وقت ممكن 🙏",
      emoji: "🚨"
    },
    {
      title: "إجازة الصيف",
      message: "🏖️ المتجر في إجازة صيفية! نستمتع بقليل من الراحة وسنعود بطاقة جديدة ☀️🌊",
      emoji: "🏖️"
    },
    {
      title: "إجازة الشتاء",
      message: "❄️ المتجر مغلق في إجازة شتوية دافئة. سنعود قريباً مع عروض ساخنة! 🔥",
      emoji: "❄️"
    },
    {
      title: "تجديد المخزون",
      message: "📦 نقوم بتجديد المخزون وإضافة منتجات جديدة رائعة! سنعود قريباً بمفاجآت 🎁✨",
      emoji: "📦"
    },
    {
      title: "إجازة عائلية",
      message: "👨‍👩‍👧‍👦 نقضي وقتاً مميزاً مع العائلة. المتجر سيعود قريباً بطاقة إيجابية! 💕",
      emoji: "👨‍👩‍👧‍👦"
    },
    {
      title: "تدريب الفريق",
      message: "🎓 فريقنا في دورة تدريبية لتحسين خدمة العملاء. سنعود أقوى وأفضل! 💪📚",
      emoji: "🎓"
    }
  ]; const [showPasswords, setShowPasswords] = useState({
    admin: false
  });

  const togglePasswordVisibility = (key: 'admin') => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // تحميل الإعدادات عند تحميل الصفحة
  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);


  const loadCategories = async () => {
    try {
      const categoriesDataRaw = await getCategories();
      const categoriesData = Array.isArray(categoriesDataRaw) ? categoriesDataRaw : (categoriesDataRaw as any).data || [];

      // Get active category names
      const activeCategoryNames = categoriesData
        .filter((cat: any) => cat.active)
        .map((cat: any) => cat.name);
      setAvailableCategories(activeCategoryNames);
      setOfficialCategories(categoriesData.filter((cat: any) => cat.active));
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };


  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const storedSettings = await getSiteSettings();
      setSettings(storedSettings);
    } catch (error) {
      console.error("Failed to load site settings:", error);
      toast.error("فشل في تحميل الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من صلاحيات المستخدم
  if (!hasPermission("settings", "edit")) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full p-4">
          <Settings className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-red-500">غير مصرح بالوصول</h1>
          <p className="text-gray-500 mt-2">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading || !settings) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }



  // حفظ الإعدادات
  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsLoading(true);

    try {
      // Create a copy to avoid direct state mutation
      const updatedSettings = { ...settings };

      // تحديث الشعار إذا تم تحميل صورة جديدة
      if (selectedLogoImage) {
        updatedSettings.logo = selectedLogoImage;
      }

      // تحديث الأيقونة إذا تم تحميل صورة جديدة
      if (selectedFaviconImage) {
        updatedSettings.favicon = selectedFaviconImage;
      }

      // تحديث بنر المتجر إذا تم تحميل صورة جديدة
      if (selectedBannerImage) {
        updatedSettings.storeBannerUrl = selectedBannerImage;
      }

      // تحديث صورة اسم المتجر إذا تم تحميل صورة جديدة
      if (selectedStoreNameImage) {
        updatedSettings.storeNameImage = selectedStoreNameImage;
      }

      // تحديث شعار لوحة التحكم إذا تم تحميل صورة جديدة
      if (selectedDashboardLogoImage) {
        updatedSettings.dashboardLogoUrl = selectedDashboardLogoImage;
      }

      // تحديث صورة صفحة تسجيل الدخول إذا تم تحميل صورة جديدة
      if (selectedLoginPageImage) {
        updatedSettings.loginPageImage = selectedLoginPageImage;
      }

      // حفظ الإعدادات
      await saveSiteSettings(updatedSettings);

      // Update local state with the new settings
      setSettings(updatedSettings);

      queryClient.invalidateQueries({ queryKey: ['site-settings'] });

      // Broadcast update to other tabs
      const channel = new BroadcastChannel('site_settings_channel');
      channel.postMessage('updated');
      channel.close();

      // إعادة تعيين الصور المختارة
      setSelectedLogoImage(null);
      setSelectedFaviconImage(null);
      setSelectedStoreNameImage(null);
      setSelectedBannerImage(null);
      setSelectedDashboardLogoImage(null);
      setSelectedLoginPageImage(null);

      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      console.error("خطأ في حفظ الإعدادات:", error);
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  // إضافة بانر جديد
  const handleAddBanner = async () => {
    if (!settings) return;
    if (!newBanner.title || !newBanner.imageUrl) {
      toast.error("يرجى إدخال عنوان وصورة للبانر");
      return;
    }

    // إضافة البانر الجديد
    const updatedBanners = [...settings.homePageBanners];
    const newId = updatedBanners.length > 0
      ? Math.max(...updatedBanners.map(b => b.id)) + 1
      : 1;

    updatedBanners.push({
      ...newBanner,
      id: newId,
      imageUrl: selectedBannerImage || newBanner.imageUrl
    });

    // تحديث الإعدادات
    const updatedSettings = {
      ...settings,
      homePageBanners: updatedBanners
    };

    setSettings(updatedSettings);
    await saveSiteSettings(updatedSettings);
    queryClient.invalidateQueries({ queryKey: ['site-settings'] });

    // Broadcast update
    const channel = new BroadcastChannel('site_settings_channel');
    channel.postMessage('updated');
    channel.close();

    // إعادة تعيين حالة البانر الجديد
    setNewBanner({
      imageUrl: '',
      title: '',
      subtitle: '',
      buttonText: '',
      buttonLink: '',
      order: updatedBanners.length + 1,
      active: true,
      type: 'main'
    });
    setSelectedBannerImage(null);

    toast.success("تم إضافة البانر بنجاح");
  };

  // حذف بانر
  const handleDeleteBanner = async (id: number) => {
    if (!settings) return;
    const updatedBanners = settings.homePageBanners.filter(banner => banner.id !== id);

    // تحديث الإعدادات
    const updatedSettings = {
      ...settings,
      homePageBanners: updatedBanners
    };

    setSettings(updatedSettings);
    await saveSiteSettings(updatedSettings);
    queryClient.invalidateQueries({ queryKey: ['site-settings'] });

    // Broadcast update
    const channel = new BroadcastChannel('site_settings_channel');
    channel.postMessage('updated');
    channel.close();

    toast.success("تم حذف البانر بنجاح");
  };

  // تغيير ترتيب البانر
  const handleChangeBannerOrder = async (id: number, direction: 'up' | 'down') => {
    if (!settings) return;
    const banners = [...settings.homePageBanners];
    const index = banners.findIndex(banner => banner.id === id);

    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      // تبديل البانر مع البانر السابق
      [banners[index], banners[index - 1]] = [banners[index - 1], banners[index]];
    } else if (direction === 'down' && index < banners.length - 1) {
      // تبديل البانر مع البانر التالي
      [banners[index], banners[index + 1]] = [banners[index + 1], banners[index]];
    }

    // تحديث الترتيب
    banners.forEach((banner, i) => {
      banner.order = i + 1;
    });

    // تحديث الإعدادات
    const updatedSettings = {
      ...settings,
      homePageBanners: banners
    };

    setSettings(updatedSettings);
    await saveSiteSettings(updatedSettings);
    queryClient.invalidateQueries({ queryKey: ['site-settings'] });

    // Broadcast update
    const channel = new BroadcastChannel('site_settings_channel');
    channel.postMessage('updated');
    channel.close();
  };

  // إضافة رابط تواصل اجتماعي جديد
  const handleAddSocialLink = async () => {
    if (!settings) return;
    if (!newSocialLink.url) {
      toast.error("يرجى إدخال رابط");
      return;
    }

    // إضافة الرابط الجديد
    const updatedSocialLinks = [...settings.socialLinks];
    const newId = updatedSocialLinks.length > 0
      ? Math.max(...updatedSocialLinks.map(s => s.id)) + 1
      : 1;

    updatedSocialLinks.push({
      ...newSocialLink,
      id: newId
    });

    // تحديث الإعدادات
    const updatedSettings = {
      ...settings,
      socialLinks: updatedSocialLinks
    };

    setSettings(updatedSettings);
    await saveSiteSettings(updatedSettings);
    queryClient.invalidateQueries({ queryKey: ['site-settings'] });

    // Broadcast update
    const channel = new BroadcastChannel('site_settings_channel');
    channel.postMessage('updated');
    channel.close();

    // إعادة تعيين حالة الرابط الجديد
    setNewSocialLink({
      platform: 'facebook',
      url: '',
      active: true
    });

    toast.success("تم إضافة رابط التواصل الاجتماعي بنجاح");
  };

  // حذف رابط تواصل اجتماعي
  const handleDeleteSocialLink = async (id: number) => {
    if (!settings) return;
    const updatedSocialLinks = settings.socialLinks.filter(link => link.id !== id);

    // تحديث الإعدادات
    const updatedSettings = {
      ...settings,
      socialLinks: updatedSocialLinks
    };

    setSettings(updatedSettings);
    await saveSiteSettings(updatedSettings);
    queryClient.invalidateQueries({ queryKey: ['site-settings'] });

    // Broadcast update
    const channel = new BroadcastChannel('site_settings_channel');
    channel.postMessage('updated');
    channel.close();

    toast.success("تم حذف رابط التواصل الاجتماعي بنجاح");
  };

  // معالجة تحميل صورة الشعار
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ Logo file select triggered');
    const files = e.target.files;
    console.log('📁 Files:', files);

    if (files && files.length > 0) {
      const file = files[0];
      console.log('📸 Selected file:', file.name, file.size, file.type);
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && event.target.result) {
          console.log('✅ Image loaded successfully, length:', (event.target.result as string).length);
          setSelectedLogoImage(event.target.result as string);
          console.log('💾 Logo state updated');
        }
      };

      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
      };

      reader.readAsDataURL(file);

      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = "";
      }
    } else {
      console.log('⚠️ No files selected');
    }
  };

  // معالجة تحميل صورة الأيقونة مع تحويلها لشكل دائري
  const handleFaviconFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const img = document.createElement('img');
          img.onload = () => {
            // إنشاء canvas لتحويل الصورة لدائرية
            const canvas = document.createElement('canvas');
            const size = 128; // حجم الـ favicon
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              // رسم دائرة
              ctx.beginPath();
              ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();

              // رسم الصورة داخل الدائرة
              ctx.drawImage(img, 0, 0, size, size);

              // تحويل Canvas لـ base64
              const circularImage = canvas.toDataURL('image/png');
              setSelectedFaviconImage(circularImage);
            }
          };
          img.src = event.target.result as string;
        }
      };

      reader.readAsDataURL(file);

      if (faviconFileInputRef.current) {
        faviconFileInputRef.current.value = "";
      }
    }
  };

  // معالجة تحميل صورة البانر
  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setSelectedBannerImage(event.target.result as string);
        }
      };

      reader.readAsDataURL(file);

      if (bannerFileInputRef.current) {
        bannerFileInputRef.current.value = "";
      }
    }
  };

  // حذف صورة الشعار
  const handleDeleteLogo = () => {
    setSelectedLogoImage(null);
    if (settings) {
      setSettings({ ...settings, logo: '' });
    }
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = "";
    }
  };

  // حذف صورة الأيقونة
  const handleDeleteFavicon = () => {
    setSelectedFaviconImage(null);
    if (settings) {
      setSettings({ ...settings, favicon: '' });
    }
    if (faviconFileInputRef.current) {
      faviconFileInputRef.current.value = "";
    }
  };

  // معالجة تحميل صورة اسم المتجر
  const handleStoreNameImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setSelectedStoreNameImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      if (storeNameImageFileInputRef.current) {
        storeNameImageFileInputRef.current.value = "";
      }
    }
  };

  // حذف صورة اسم المتجر
  const handleDeleteStoreNameImage = () => {
    setSelectedStoreNameImage(null);
    if (settings) {
      setSettings({ ...settings, storeNameImage: '' });
    }
    if (storeNameImageFileInputRef.current) {
      storeNameImageFileInputRef.current.value = "";
    }
  };

  // الحصول على أيقونة منصة التواصل الاجتماعي
  const getSocialIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'whatsapp':
      case 'telegram':
      case 'tiktok':
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  // معالجة تحميل صورة شعار لوحة التحكم
  const handleDashboardLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setSelectedDashboardLogoImage(event.target.result as string);
        }
      };

      reader.readAsDataURL(file);

      if (dashboardLogoFileInputRef.current) {
        dashboardLogoFileInputRef.current.value = "";
      }
    }
  };

  // حذف صورة شعار لوحة التحكم
  const handleDeleteDashboardLogo = () => {
    setSelectedDashboardLogoImage(null);
    if (settings) {
      setSettings({ ...settings, dashboardLogoUrl: '' });
    }
    if (dashboardLogoFileInputRef.current) {
      dashboardLogoFileInputRef.current.value = "";
    }
  };

  // معالجة تحميل صورة صفحة تسجيل الدخول
  const handleLoginPageImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setSelectedLoginPageImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      if (loginPageImageFileInputRef.current) {
        loginPageImageFileInputRef.current.value = "";
      }
    }
  };

  // حذف صورة صفحة تسجيل الدخول
  const handleDeleteLoginPageImage = () => {
    setSelectedLoginPageImage(null);
    if (settings) {
      setSettings({ ...settings, loginPageImage: '' });
    }
    if (loginPageImageFileInputRef.current) {
      loginPageImageFileInputRef.current.value = "";
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
          <p className="text-muted-foreground font-cairo">يرجى إدخال كلمة المرور للوصول إلى إعدادات الموقع</p>
          <Button onClick={() => setIsSecurityDialogOpen(true)}>
            إدخال كلمة المرور
          </Button>
          <AdminSecurityDialog
            isOpen={isSecurityDialogOpen}
            onClose={() => navigate("/admin/dashboard")}
            onSuccess={handleSecuritySuccess}
            passwordType="admin"
            title="إعدادات الموقع"
            description="الوصول للإعدادات يتطلب كلمة مرور خاصة بصلاحيات الإدارة."
          />
        </div>
      </DashboardLayout>
    );
  }
  const categories = [
    { id: "general", label: "عام", icon: Settings, color: "bg-blue-600", lightColor: "bg-blue-50", hoverColor: "hover:bg-blue-700", textColor: "text-blue-700" },
    { id: "appearance", label: "المظهر", icon: Palette, color: "bg-purple-600", lightColor: "bg-purple-50", hoverColor: "hover:bg-purple-700", textColor: "text-purple-700" },
    { id: "store-display", label: "واجهة المتجر", icon: Store, color: "bg-emerald-600", lightColor: "bg-emerald-50", hoverColor: "hover:bg-emerald-700", textColor: "text-emerald-700" },
    { id: "social", label: "التواصل الاجتماعي", icon: Share, color: "bg-sky-600", lightColor: "bg-sky-50", hoverColor: "hover:bg-sky-700", textColor: "text-sky-700" },
    { id: "contact", label: "معلومات الاتصال", icon: Phone, color: "bg-cyan-600", lightColor: "bg-cyan-50", hoverColor: "hover:bg-cyan-700", textColor: "text-cyan-700" },
    { id: "seo", label: "SEO", icon: Search, color: "bg-indigo-600", lightColor: "bg-indigo-50", hoverColor: "hover:bg-indigo-700", textColor: "text-indigo-700" },
    { id: "commissions", label: "العمولات والطلبات", icon: FileText, color: "bg-orange-600", lightColor: "bg-orange-50", hoverColor: "hover:bg-orange-700", textColor: "text-orange-700" },
    { id: "language", label: "اللغة والعملة", icon: Globe, color: "bg-violet-600", lightColor: "bg-violet-50", hoverColor: "hover:bg-violet-700", textColor: "text-violet-700" },
    { id: "whatsapp", label: "واتساب", icon: MessageSquare, color: "bg-green-600", lightColor: "bg-green-50", hoverColor: "hover:bg-green-700", textColor: "text-green-700" },
    { id: "store-status", label: "قفل المتجر", icon: Lock, color: "bg-rose-600", lightColor: "bg-rose-50", hoverColor: "hover:bg-rose-700", textColor: "text-rose-700" },
    { id: "invoice", label: "إعدادات الفاتورة", icon: FileText, color: "bg-amber-600", lightColor: "bg-amber-50", hoverColor: "hover:bg-amber-700", textColor: "text-amber-700" },
    { id: "security", label: "الأمان", icon: Shield, color: "bg-slate-700", lightColor: "bg-slate-100", hoverColor: "hover:bg-slate-800", textColor: "text-slate-800" },
    { id: "help-info", label: "مساعدة ومعلومات", icon: HelpCircle, color: "bg-teal-600", lightColor: "bg-teal-50", hoverColor: "hover:bg-teal-700", textColor: "text-teal-700" },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">
        {/* رأس الصفحة */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">إعدادات الموقع</h2>
            <p className="text-muted-foreground mt-2">
              تخصيص مظهر وإعدادات الموقع الإلكتروني
            </p>
          </div>
          <Button
            onClick={handleSaveSettings}
            className="mt-4 md:mt-0"
            disabled={isLoading}
          >
            {isLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>

        {/* أزرار التنقل بين الأقسام */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-13 gap-2 sm:gap-3 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all duration-300 group relative overflow-hidden ${activeTab === cat.id
                ? `${cat.lightColor} border-primary shadow-sm transform scale-105 z-10`
                : "bg-white border-transparent hover:border-gray-100 hover:shadow-sm"
                }`}
            >
              {/* Active Indicator Bar */}
              {activeTab === cat.id && (
                <div className={`absolute top-0 inset-x-0 h-1 ${cat.color}`} />
              )}

              <div className={`p-2 rounded-lg mb-2 transition-colors duration-300 ${activeTab === cat.id
                ? `${cat.color} text-white`
                : `bg-gray-50 text-gray-400 group-hover:${cat.lightColor} group-hover:${cat.textColor}`
                }`}>
                <cat.icon className="h-4 w-4" />
              </div>

              <span className={`text-[12px] font-bold text-center leading-tight transition-colors duration-300 ${activeTab === cat.id ? "text-primary" : "text-gray-500 group-hover:text-gray-900"
                }`}>
                {cat.label}
              </span>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none" />
            </button>
          ))}
        </div>

        {/* محتوى الصفحة */}
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-black/[0.05]">
          <Tabs value={activeTab} className="w-full">
            {/* TabsList hidden but kept for context if needed by children, though we use activeTab manually */}
            <div className="hidden">
              <TabsList>
                {categories.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id}>{cat.label}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            <CardContent className="p-6">
              {/* محتوى التبويبات */}
              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">معلومات الموقع الأساسية</h3>

                    <div className="space-y-2">
                      <Label htmlFor="siteName">اسم الموقع (للداشبورد)</Label>
                      <Input
                        id="siteName"
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        placeholder="أدخل اسم الموقع للوحة التحكم"
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 يظهر في: لوحة التحكم والإدارة (Dashboard)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayName">اسم العرض (للمتجر) ✨</Label>
                      <Input
                        id="displayName"
                        value={settings.displayName}
                        onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                        placeholder="أدخل اسم العرض للعملاء"
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 يظهر في: المتجر للزوار والعملاء (Store)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeUrl">رابط المتجر</Label>
                      <div className="flex gap-2">
                        <Input
                          id="storeUrl"
                          value={settings.storeUrl || ''}
                          onChange={(e) => setSettings({ ...settings, storeUrl: e.target.value })}
                          placeholder="https://afleetstore.com"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const urlToOpen = settings.storeUrl || 'https://afleetstore.com';
                            window.open(urlToOpen, '_blank');
                          }}
                          className="px-3"
                          title="فتح المتجر في تبويب جديد"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      رابط المتجر الذي سيظهر في أيقونة "زيارة المتجر" في الصفحة الرئيسية
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="siteDescription">وصف الموقع</Label>
                      <textarea
                        id="siteDescription"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={settings.siteDescription}
                        onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                        placeholder="أدخل وصفًا مختصرًا للموقع"
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">لوحة التحكم (Dashboard)</h3>

                      <div className="space-y-3">
                        <Label>نوع شعار اللوحة</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="logoTypeText"
                              name="logoType"
                              checked={settings.dashboardLogoType === 'text'}
                              onChange={() => setSettings({ ...settings, dashboardLogoType: 'text' })}
                              className="w-4 h-4 text-primary"
                            />
                            <Label htmlFor="logoTypeText" className="cursor-pointer">نص (Text)</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              id="logoTypeImage"
                              name="logoType"
                              checked={settings.dashboardLogoType === 'image'}
                              onChange={() => setSettings({ ...settings, dashboardLogoType: 'image' })}
                              className="w-4 h-4 text-primary"
                            />
                            <Label htmlFor="logoTypeImage" className="cursor-pointer">صورة (Image)</Label>
                          </div>
                        </div>
                      </div>

                      {settings.dashboardLogoType === 'text' ? (
                        <div className="space-y-2">
                          <Label htmlFor="dashboardTitle">نص اللوحة</Label>
                          <Input
                            id="dashboardTitle"
                            value={settings.dashboardTitle}
                            onChange={(e) => setSettings({ ...settings, dashboardTitle: e.target.value })}
                            placeholder="مخزني"
                          />
                          <p className="text-xs text-muted-foreground">
                            النص الذي سيظهر كعنوان رئيسي في لوحة التحكم.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="dashboardLogoUrl">صورة شعار اللوحة</Label>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-48 h-16 border rounded-md overflow-hidden flex items-center justify-center bg-gray-50">
                                {selectedDashboardLogoImage || settings.dashboardLogoUrl ? (
                                  <img
                                    src={selectedDashboardLogoImage || settings.dashboardLogoUrl}
                                    alt="شعار اللوحة"
                                    className="max-w-full max-h-full object-contain"
                                  />
                                ) : (
                                  <Image className="h-8 w-8 text-gray-300" />
                                )}
                              </div>
                              {selectedDashboardLogoImage && (
                                <span className="text-xs text-green-600 font-bold mt-1 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                  ✓ جاهزة للحفظ
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => dashboardLogoFileInputRef.current?.click()}
                                >
                                  <UploadCloud className="h-4 w-4 ml-2" />
                                  تحميل صورة
                                </Button>
                                {(selectedDashboardLogoImage || settings.dashboardLogoUrl) && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDeleteDashboardLogo}
                                    title="حذف الصورة"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                ref={dashboardLogoFileInputRef}
                                className="hidden"
                                onChange={handleDashboardLogoFileSelect}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                يفضل استخدام صورة (PNG) بحجم 200x600 بكسل
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="dashboardWebsiteLink">رابط أيقونة الموقع</Label>
                        <div className="flex gap-2">
                          <Input
                            id="dashboardWebsiteLink"
                            value={settings.dashboardWebsiteLink || ''}
                            onChange={(e) => setSettings({ ...settings, dashboardWebsiteLink: e.target.value })}
                            placeholder="https://example.com"
                            className="text-left ltr"
                            dir="ltr"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (settings.dashboardWebsiteLink) {
                                window.open(settings.dashboardWebsiteLink, '_blank');
                              }
                            }}
                            title="تجربة الرابط"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          سيظهر زر في الصفحة الرئيسية للوحة التحكم ينقل لهذا الرابط عند الضغط عليه.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">الشعار والأيقونة</h3>

                    <div className="space-y-2">
                      <Label htmlFor="logo">شعار الموقع</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 border rounded-md overflow-hidden flex items-center justify-center bg-gray-50">
                          {selectedLogoImage || settings.logo ? (
                            <img
                              src={selectedLogoImage || settings.logo}
                              alt="شعار الموقع"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <Image className="h-8 w-8 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => logoFileInputRef.current?.click()}
                            >
                              <UploadCloud className="h-4 w-4 ml-2" />
                              تحميل شعار
                            </Button>
                            {(selectedLogoImage || settings.logo) && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteLogo}
                                title="حذف الشعار"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={logoFileInputRef}
                            className="hidden"
                            onChange={handleLogoFileSelect}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            يفضل استخدام صورة بخلفية شفافة (PNG)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeNameImage">صورة اسم المتجر (للمتجر بدلاً من النص)</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-auto h-20 border rounded-md overflow-hidden flex items-center justify-center bg-gray-50 px-4">
                          {selectedStoreNameImage || settings.storeNameImage ? (
                            <img
                              src={selectedStoreNameImage || settings.storeNameImage}
                              alt="صورة اسم المتجر"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground whitespace-nowrap">لا توجد صورة</p>
                          )}
                        </div>
                        <div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => storeNameImageFileInputRef.current?.click()}
                            >
                              <UploadCloud className="h-4 w-4 ml-2" />
                              تحميل صورة
                            </Button>
                            {(selectedStoreNameImage || settings.storeNameImage) && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteStoreNameImage}
                                title="حذف الصورة"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={storeNameImageFileInputRef}
                            className="hidden"
                            onChange={handleStoreNameImageFileSelect}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            تظهر بدلاً من النص في أعلى المتجر (يفضل أن تكون مستطيلة)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="favicon">أيقونة الموقع (Favicon)</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border rounded-full overflow-hidden flex items-center justify-center bg-gray-50">
                          {selectedFaviconImage || settings.favicon ? (
                            <img
                              src={selectedFaviconImage || settings.favicon}
                              alt="أيقونة الموقع"
                              className="max-w-full max-h-full object-cover"
                            />
                          ) : (
                            <Image className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => faviconFileInputRef.current?.click()}
                            >
                              <UploadCloud className="h-4 w-4 ml-2" />
                              تحميل أيقونة
                            </Button>
                            {(selectedFaviconImage || settings.favicon) && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteFavicon}
                                title="حذف الأيقونة"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={faviconFileInputRef}
                            className="hidden"
                            onChange={handleFaviconFileSelect}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            الصورة ستتحول تلقائياً لشكل دائري 🔵
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loginPageImage">صورة صفحة تسجيل الدخول (الترحيبية)</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-auto h-20 border rounded-md overflow-hidden flex items-center justify-center bg-gray-50 px-4">
                          {selectedLoginPageImage || settings.loginPageImage ? (
                            <img
                              src={selectedLoginPageImage || settings.loginPageImage}
                              alt="صورة صفحة الدخول"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground whitespace-nowrap">لا توجد صورة</p>
                          )}
                        </div>
                        <div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => loginPageImageFileInputRef.current?.click()}
                            >
                              <UploadCloud className="h-4 w-4 ml-2" />
                              تحميل صورة
                            </Button>
                            {(selectedLoginPageImage || settings.loginPageImage) && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteLoginPageImage}
                                title="حذف الصورة"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={loginPageImageFileInputRef}
                            className="hidden"
                            onChange={handleLoginPageImageFileSelect}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            تظهر فوق نص الترحيب في صفحة تسجيل الدخول
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* تبويب المظهر */}
              <TabsContent value="appearance" className="space-y-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">ألوان الموقع</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">اللون الرئيسي</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-md border"
                          style={{ backgroundColor: settings.primaryColor }}
                        />
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        اللون الأساسي للموقع (الأزرار، الروابط، إلخ)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">اللون الثانوي</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-md border"
                          style={{ backgroundColor: settings.secondaryColor }}
                        />
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={settings.secondaryColor}
                          onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.secondaryColor}
                          onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        اللون الثانوي للموقع (العناصر الثانوية)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accentColor">لون التمييز</Label>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-md border"
                          style={{ backgroundColor: settings.accentColor }}
                        />
                        <Input
                          id="accentColor"
                          type="color"
                          value={settings.accentColor}
                          onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.accentColor}
                          onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        لون التمييز (العناصر المميزة، العروض، إلخ)
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 border rounded-md">
                    <h4 className="font-medium mb-2">معاينة الألوان</h4>
                    <div className="flex flex-wrap gap-2">
                      <div
                        className="p-4 rounded-md text-white flex items-center justify-center"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        اللون الرئيسي
                      </div>
                      <div
                        className="p-4 rounded-md text-white flex items-center justify-center"
                        style={{ backgroundColor: settings.secondaryColor }}
                      >
                        اللون الثانوي
                      </div>
                      <div
                        className="p-4 rounded-md text-white flex items-center justify-center"
                        style={{ backgroundColor: settings.accentColor }}
                      >
                        لون التمييز
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* تبويب واجهة المتجر */}
              <TabsContent value="store-display" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">صور المتجر</h3>

                  <div className="space-y-2">
                    <Label>بنر صفحة المنتجات</Label>
                    <div className="border rounded-md p-4 bg-muted/20">
                      <div className="mb-4 aspect-[21/9] md:aspect-[3/1] bg-muted rounded-md overflow-hidden relative group">
                        <img
                          src={selectedBannerImage || settings.storeBannerUrl}
                          alt="Store Banner"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="secondary"
                            onClick={() => bannerFileInputRef.current?.click()}
                          >
                            <UploadCloud className="h-4 w-4 ml-2" />
                            تغيير البنر
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => bannerFileInputRef.current?.click()}
                          className="flex-1"
                        >
                          <UploadCloud className="h-4 w-4 ml-2" />
                          تحميل صورة جديدة
                        </Button>
                        {(selectedBannerImage || settings.storeBannerUrl) && (
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setSelectedBannerImage(null);
                              setSettings({ ...settings, storeBannerUrl: '' });
                              toast.success('تم حذف صورة البنر بنجاح');
                            }}
                            className="flex-1"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف البنر
                          </Button>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={bannerFileInputRef}
                          className="hidden"
                          onChange={handleBannerFileSelect}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        صورة الغلاف التي تظهر في أعلى صفحة "جميع المنتجات". يفضل أن تكون الأبعاد 1920×400 بكسل.
                      </p>
                    </div>
                  </div>

                </div>
              </TabsContent>

              {/* تبويب التواصل الاجتماعي */}
              < TabsContent value="social" className="space-y-6" >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">روابط التواصل الاجتماعي</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewSocialLink({
                          platform: 'facebook',
                          url: '',
                          active: true
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة رابط جديد
                    </Button>
                  </div>

                  {/* نموذج إضافة رابط جديد */}
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">إضافة رابط تواصل اجتماعي</CardTitle>
                      <CardDescription>أدخل تفاصيل رابط التواصل الاجتماعي الجديد</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="socialPlatform">المنصة</Label>
                            <select
                              id="socialPlatform"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={newSocialLink.platform}
                              onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value as SocialPlatform })}
                            >
                              <option value="facebook">فيسبوك</option>
                              <option value="instagram">انستغرام</option>
                              <option value="twitter">تويتر</option>
                              <option value="youtube">يوتيوب</option>
                              <option value="linkedin">لينكد إن</option>
                              <option value="whatsapp">واتساب</option>
                              <option value="telegram">تيليجرام</option>
                              <option value="tiktok">تيك توك</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="socialUrl">الرابط</Label>
                            <Input
                              id="socialUrl"
                              value={newSocialLink.url}
                              onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                              placeholder="أدخل رابط الصفحة أو الحساب"
                            />
                            <p className="text-xs text-muted-foreground">
                              أدخل الرابط كاملاً بما في ذلك https://
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              id="socialActive"
                              checked={newSocialLink.active}
                              onCheckedChange={(checked) => setNewSocialLink({ ...newSocialLink, active: checked as boolean })}
                            />
                            <Label htmlFor="socialActive">نشط</Label>
                          </div>
                        </div>

                        <div className="flex items-center justify-center p-6 border rounded-md">
                          <div className="text-center">
                            <div className="flex justify-center mb-4">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                {getSocialIcon(newSocialLink.platform)}
                              </div>
                            </div>
                            <h4 className="font-medium mb-2">معاينة</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              {newSocialLink.platform === 'facebook' && 'فيسبوك'}
                              {newSocialLink.platform === 'instagram' && 'انستغرام'}
                              {newSocialLink.platform === 'twitter' && 'تويتر'}
                              {newSocialLink.platform === 'youtube' && 'يوتيوب'}
                              {newSocialLink.platform === 'linkedin' && 'لينكد إن'}
                              {newSocialLink.platform === 'whatsapp' && 'واتساب'}
                              {newSocialLink.platform === 'telegram' && 'تيليجرام'}
                              {newSocialLink.platform === 'tiktok' && 'تيك توك'}
                            </p>
                            <p className="text-xs text-blue-500 break-all">
                              {newSocialLink.url || 'https://example.com/username'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button onClick={handleAddSocialLink}>إضافة الرابط</Button>
                    </CardFooter>
                  </Card>

                  {/* قائمة روابط التواصل الاجتماعي الحالية */}
                  <div className="space-y-4">
                    <h4 className="font-medium">روابط التواصل الاجتماعي الحالية</h4>

                    {settings.socialLinks.length === 0 ? (
                      <div className="text-center py-8 border rounded-md">
                        <p className="text-muted-foreground">لا توجد روابط تواصل اجتماعي حالياً</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {settings.socialLinks.map((link) => (
                          <Card key={link.id} className={!link.active ? "opacity-60" : undefined}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                    {getSocialIcon(link.platform)}
                                  </div>
                                  <div>
                                    <h5 className="font-medium">
                                      {link.platform === 'facebook' && 'فيسبوك'}
                                      {link.platform === 'instagram' && 'انستغرام'}
                                      {link.platform === 'twitter' && 'تويتر'}
                                      {link.platform === 'youtube' && 'يوتيوب'}
                                      {link.platform === 'linkedin' && 'لينكد إن'}
                                      {link.platform === 'whatsapp' && 'واتساب'}
                                      {link.platform === 'telegram' && 'تيليجرام'}
                                      {link.platform === 'tiktok' && 'تيك توك'}
                                    </h5>
                                    <p className="text-xs text-blue-500 break-all">{link.url}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteSocialLink(link.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="mt-2 text-xs">
                                <span className="text-muted-foreground">الحالة: </span>
                                <span>{link.active ? "نشط" : "غير نشط"}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent >

              {/* تبويب معلومات الاتصال */}
              < TabsContent value="contact" className="space-y-6" >
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">معلومات الاتصال</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">البريد الإلكتروني</Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          value={settings.contactEmail}
                          onChange={(e) => setSettings({
                            ...settings,
                            contactEmail: e.target.value
                          })}
                          placeholder="example@domain.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          البريد الإلكتروني الرئيسي للتواصل مع العملاء
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">رقم الهاتف</Label>
                        <Input
                          id="contactPhone"
                          value={settings.contactPhone}
                          onChange={(e) => setSettings({
                            ...settings,
                            contactPhone: e.target.value
                          })}
                          placeholder="+20 123 456 7890"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactWhatsapp">رقم الواتساب</Label>
                        <Input
                          id="contactWhatsapp"
                          value={settings.whatsappNumber}
                          onChange={(e) => setSettings({
                            ...settings,
                            whatsappNumber: e.target.value
                          })}
                          placeholder="+20 123 456 7890"
                        />
                        <p className="text-xs text-muted-foreground">
                          رقم الواتساب للتواصل المباشر (يمكن أن يكون مختلفًا عن رقم الهاتف)
                        </p>
                      </div>


                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactAddress">العنوان</Label>
                        <textarea
                          id="contactAddress"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.contactAddress}
                          onChange={(e) => setSettings({
                            ...settings,
                            contactAddress: e.target.value
                          })}
                          placeholder="أدخل العنوان الكامل"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="workingHours">ساعات العمل</Label>
                        <Input
                          id="workingHours"
                          value={settings.footerText || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            footerText: e.target.value
                          })}
                          placeholder="مثال: من السبت إلى الخميس، 9 صباحًا - 5 مساءً"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="returnPolicy">سياسة الإرجاع والاستبدال</Label>
                        <textarea
                          id="returnPolicy"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.returnPolicy}
                          onChange={(e) => setSettings({
                            ...settings,
                            returnPolicy: e.target.value
                          })}
                          placeholder="أدخل سياسة الإرجاع والاستبدال"
                        />
                        <p className="text-xs text-muted-foreground">
                          اشرح سياسة الإرجاع والاستبدال بوضوح للعملاء
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aboutPageContent">محتوى صفحة "عن المنصة"</Label>
                        <textarea
                          id="aboutPageContent"
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.aboutPageContent || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            aboutPageContent: e.target.value
                          })}
                          placeholder="أدخل محتوى صفحة عن المنصة (يمكنك استخدام HTML)"
                        />
                        <p className="text-xs text-muted-foreground">
                          هذا النص سيظهر عند الضغط على "عن المنصة" في صفحة تسجيل الدخول والفوتر. يمكنك كتابة نص عادي أو HTML بسيط.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="googleMapsEmbed">رمز تضمين خرائط جوجل (اختياري)</Label>
                    <textarea
                      id="googleMapsEmbed"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={settings.googleMapsEmbed || ""}
                      onChange={(e) => setSettings({
                        ...settings,
                        googleMapsEmbed: e.target.value
                      })}
                      placeholder='<iframe src="https://www.google.com/maps/embed?..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
                    />
                    <p className="text-xs text-muted-foreground">
                      أدخل رمز تضمين خرائط جوجل لعرض موقعك على الخريطة في صفحة الاتصال
                    </p>
                  </div>

                  {settings.googleMapsEmbed && settings.googleMapsEmbed.includes('<iframe') && (
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">معاينة الخريطة</h4>
                      <div className="aspect-video w-full overflow-hidden rounded-md" dangerouslySetInnerHTML={{ __html: settings.googleMapsEmbed }} />
                    </div>
                  )}
                </div>
              </TabsContent >

              {/* تبويب إعدادات الفاتورة */}
              <TabsContent value="invoice" className="space-y-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">إعدادات الفاتورة المطبوعة</h3>
                  <p className="text-sm text-muted-foreground">
                    هذه البيانات ستظهر في الفاتورة المطبوعة. يمكنك تخصيص بيانات مختلفة عن بيانات المتجر إذا لزم الأمر.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">

                      <div className="space-y-2">
                        <Label htmlFor="companyName">اسم الشركة في الفاتورة</Label>
                        <Input
                          id="companyName"
                          value={settings.companyName || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            companyName: e.target.value
                          })}
                          placeholder={settings.displayName || "اسم المتجر"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyEmail">بريد الفاتورة (Email)</Label>
                        <Input
                          id="companyEmail"
                          type="email"
                          value={settings.companyEmail || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            companyEmail: e.target.value
                          })}
                          placeholder={settings.contactEmail || "used@for.billing"}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyPhone">هاتف الفاتورة</Label>
                        <Input
                          id="companyPhone"
                          value={settings.companyPhone || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            companyPhone: e.target.value
                          })}
                          placeholder={settings.contactPhone || "+20 123 456 7890"}
                        />
                        <p className="text-xs text-muted-foreground">
                          هنا يظهر الرقم الذي تريد تغييره/حذفه من الفاتورة
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shippingFollowUpNumberInvoice">رقم متابعة الشحن</Label>
                        <Input
                          id="shippingFollowUpNumberInvoice"
                          value={settings.shippingFollowUpNumber || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            shippingFollowUpNumber: e.target.value
                          })}
                          placeholder="+20 123 456 7890"
                        />
                        <p className="text-xs text-muted-foreground">
                          نفس الرقم الموجود في تبويب معلومات الاتصال
                        </p>
                      </div>

                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress">عنوان الفاتورة</Label>
                        <textarea
                          id="companyAddress"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.companyAddress || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            companyAddress: e.target.value
                          })}
                          placeholder={settings.contactAddress || "العنوان بالتفصيل"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* تبويب SEO */}
              < TabsContent value="seo" className="space-y-6" >
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">إعدادات تحسين محركات البحث (SEO)</h3>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="seoTitle">عنوان الصفحة الرئيسية (Title)</Label>
                        <Input
                          id="seoTitle"
                          value={settings.seoTitle || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            seoTitle: e.target.value
                          })}
                          placeholder="مثال: متجر الكتروني | تسوق أونلاين"
                        />
                        <p className="text-xs text-muted-foreground">
                          عنوان الصفحة الذي سيظهر في نتائج البحث وعلامة تبويب المتصفح
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seoDescription">وصف الموقع (Meta Description)</Label>
                        <textarea
                          id="seoDescription"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.seoDescription || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            seoDescription: e.target.value
                          })}
                          placeholder="أدخل وصفًا مختصرًا للموقع (150-160 حرف)"
                        />
                        <p className="text-xs text-muted-foreground">
                          وصف الموقع الذي سيظهر في نتائج البحث (يفضل ألا يتجاوز 160 حرفًا)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seoKeywords">الكلمات المفتاحية (Meta Keywords)</Label>
                        <Input
                          id="seoKeywords"
                          value={settings.seoKeywords || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            seoKeywords: e.target.value
                          })}
                          placeholder="مثال: متجر, تسوق, أونلاين, منتجات, بيع"
                        />
                        <p className="text-xs text-muted-foreground">
                          الكلمات المفتاحية مفصولة بفواصل (ملاحظة: تأثيرها محدود في محركات البحث الحديثة)
                        </p>
                      </div>
                    </div>

                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">معاينة نتائج البحث</h4>
                      <div className="p-4 border rounded-md bg-white">
                        <div className="text-blue-600 text-lg font-medium mb-1 truncate">
                          {settings.seoTitle || "عنوان الموقع"}
                        </div>
                        <div className="text-green-700 text-sm mb-1 truncate">
                          www.example.com
                        </div>
                        <div className="text-gray-600 text-sm line-clamp-2">
                          {settings.seoDescription || "وصف الموقع الذي سيظهر في نتائج البحث. أدخل وصفًا مختصرًا ومفيدًا للموقع لتحسين ظهوره في محركات البحث."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent >

              {/* تبويب العمولات والطلبات */}
              < TabsContent value="commissions" className="space-y-6" >
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">إعدادات العمولات والطلبات</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="minCommission">الحد الأدنى للعمولة</Label>
                        <Input
                          id="minCommission"
                          type="number"
                          min="0"
                          value={settings.minCommission || 0}
                          onChange={(e) => setSettings({
                            ...settings,
                            minCommission: Number(e.target.value)
                          })}
                          placeholder="مثال: 50"
                        />
                        <p className="text-xs text-muted-foreground">
                          الحد الأدنى للعمولة التي يمكن أن يحصل عليها المسوق
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxCommission">الحد الأقصى للعمولة</Label>
                        <Input
                          id="maxCommission"
                          type="number"
                          min="0"
                          value={settings.maxCommission || 0}
                          onChange={(e) => setSettings({
                            ...settings,
                            maxCommission: Number(e.target.value)
                          })}
                          placeholder="مثال: 500"
                        />
                        <p className="text-xs text-muted-foreground">
                          الحد الأقصى للعمولة التي يمكن أن يحصل عليها المسوق
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxOrders">الحد الأقصى للمنتجات في الطلب</Label>
                        <Input
                          id="maxOrders"
                          type="number"
                          min="0"
                          value={settings.maxOrders}
                          onChange={(e) => setSettings({
                            ...settings,
                            maxOrders: Number(e.target.value)
                          })}
                          placeholder="مثال: 5"
                        />
                        <p className="text-xs text-muted-foreground">
                          الحد الأقصى لعدد المنتجات في الطلب الواحد
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minWithdrawal">الحد الأدنى للسحب</Label>
                        <Input
                          id="minWithdrawal"
                          type="number"
                          min="0"
                          value={settings.minWithdrawal || 0}
                          onChange={(e) => setSettings({
                            ...settings,
                            minWithdrawal: Number(e.target.value)
                          })}
                          placeholder="مثال: 200"
                        />
                        <p className="text-xs text-muted-foreground">
                          الحد الأدنى للمبلغ الذي يمكن سحبه من رصيد المسوق
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent >

              {/* تبويب الواتساب */}
              < TabsContent value="whatsapp" className="space-y-6" >
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">إعدادات زر الواتساب</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">رقم الواتساب</Label>
                        <Input
                          id="whatsappNumber"
                          value={settings.whatsappNumber || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            whatsappNumber: e.target.value
                          })}
                          placeholder="مثال: +201234567890"
                        />
                        <p className="text-xs text-muted-foreground">
                          أدخل رقم الواتساب كاملاً مع كود الدولة (مثال: +20)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsappMessage">الرسالة الافتراضية</Label>
                        <textarea
                          id="whatsappMessage"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.whatsappMessage || ""}
                          onChange={(e) => setSettings({
                            ...settings,
                            whatsappMessage: e.target.value
                          })}
                          placeholder="مثال: مرحباً، أرغب في الاستفسار عن منتجاتكم"
                        />
                        <p className="text-xs text-muted-foreground">
                          الرسالة التي ستظهر تلقائياً عند النقر على زر الواتساب
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="showWhatsappButton"
                          checked={settings.showWhatsappButton !== false}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            showWhatsappButton: !!checked
                          })}
                        />
                        <Label htmlFor="showWhatsappButton">إظهار زر الواتساب</Label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="whatsappButtonPosition">موضع زر الواتساب</Label>
                        <select
                          id="whatsappButtonPosition"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.whatsappButtonPosition || "bottom-right"}
                          onChange={(e) => setSettings({
                            ...settings,
                            whatsappButtonPosition: e.target.value as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
                          })}
                        >
                          <option value="bottom-right">أسفل اليمين</option>
                          <option value="bottom-left">أسفل اليسار</option>
                          <option value="top-right">أعلى اليمين</option>
                          <option value="top-left">أعلى اليسار</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          موضع ظهور زر الواتساب في الموقع
                        </p>
                      </div>

                      <div className="border rounded-md p-4 mt-6">
                        <h4 className="font-medium mb-4">معاينة زر الواتساب</h4>
                        <div className="relative h-40 border rounded-md bg-gray-50">
                          <div className={`absolute ${settings.whatsappButtonPosition === 'bottom-right' ? 'bottom-4 right-4' :
                            settings.whatsappButtonPosition === 'bottom-left' ? 'bottom-4 left-4' :
                              settings.whatsappButtonPosition === 'top-right' ? 'top-4 right-4' :
                                'top-4 left-4'
                            }`}>
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg cursor-pointer">
                              <MessageSquare className="h-6 w-6" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent >

              {/* تبويب اللغة والعملة */}
              < TabsContent value="language" className="space-y-6" >
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">إعدادات اللغة والعملة</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultLanguage">اللغة الافتراضية</Label>
                        <select
                          id="defaultLanguage"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.language}
                          onChange={(e) => setSettings({
                            ...settings,
                            language: e.target.value as 'ar' | 'en'
                          })}
                        >
                          <option value="ar">العربية</option>
                          <option value="en">الإنجليزية</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          اللغة الافتراضية التي سيتم عرض الموقع بها للزوار
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>اللغات المتاحة</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              id="langArabic"
                              checked={settings.language === 'ar'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSettings({
                                    ...settings,
                                    language: 'ar'
                                  });
                                }
                              }}
                            />
                            <Label htmlFor="langArabic">العربية</Label>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              id="langEnglish"
                              checked={settings.language === 'en'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSettings({
                                    ...settings,
                                    language: 'en'
                                  });
                                }
                              }}
                            />
                            <Label htmlFor="langEnglish">الإنجليزية</Label>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          اللغات التي سيتمكن الزوار من التبديل بينها في الموقع
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="defaultCurrency">العملة الافتراضية</Label>
                        <select
                          id="defaultCurrency"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.currency}
                          onChange={(e) => setSettings({
                            ...settings,
                            currency: e.target.value
                          })}
                        >
                          <option value="EGP">جنيه مصري (EGP)</option>
                          <option value="USD">دولار أمريكي (USD)</option>
                          <option value="EUR">يورو (EUR)</option>
                          <option value="SAR">ريال سعودي (SAR)</option>
                          <option value="AED">درهم إماراتي (AED)</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          العملة الافتراضية التي سيتم عرض الأسعار بها
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currencySymbol">رمز العملة</Label>
                        <Input
                          id="currencySymbol"
                          value={settings.currencySymbol}
                          onChange={(e) => setSettings({
                            ...settings,
                            currencySymbol: e.target.value
                          })}
                          placeholder="مثال: ج.م"
                        />
                        <p className="text-xs text-muted-foreground">
                          الرمز الذي سيظهر بجانب الأسعار (مثال: ج.م، $، €)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="currencyPosition">موضع رمز العملة</Label>
                        <select
                          id="currencyPosition"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={settings.currencyPosition}
                          onChange={(e) => setSettings({
                            ...settings,
                            currencyPosition: e.target.value as 'before' | 'after'
                          })}
                        >
                          <option value="before">قبل السعر (مثال: $100)</option>
                          <option value="after">بعد السعر (مثال: 100 ج.م)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="thousandSeparator">فاصل الآلاف</Label>
                        <Input
                          id="thousandSeparator"
                          value={settings.thousandSeparator || ","}
                          onChange={(e) => setSettings({
                            ...settings,
                            thousandSeparator: e.target.value
                          })}
                          placeholder="مثال: ,"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="decimalSeparator">فاصل الكسور العشرية</Label>
                        <Input
                          id="decimalSeparator"
                          value={settings.decimalSeparator || "."}
                          onChange={(e) => setSettings({
                            ...settings,
                            decimalSeparator: e.target.value
                          })}
                          placeholder="مثال: ."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">معاينة تنسيق العملة</h4>
                    <div className="flex flex-wrap gap-4">
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground mb-1">سعر بسيط:</p>
                        <p className="font-medium">
                          {settings.currencyPosition === 'before'
                            ? `${settings.currencySymbol}100`
                            : `100 ${settings.currencySymbol}`}
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground mb-1">سعر بالآلاف:</p>
                        <p className="font-medium">
                          {settings.currencyPosition === 'before'
                            ? `${settings.currencySymbol}1,000`
                            : `1,000 ${settings.currencySymbol}`}
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground mb-1">سعر بكسور عشرية:</p>
                        <p className="font-medium">
                          {settings.currencyPosition === 'before'
                            ? `${settings.currencySymbol}99.99`
                            : `99.99 ${settings.currencySymbol}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent >

              {/* تبويب قفل المتجر */}
              < TabsContent value="store-status" className="space-y-6" >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">إدارة حالة المتجر</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        تحكم في فتح وإغلاق المتجر أثناء العطل والإجازات
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {settings.storeStatus === 'open' ? (
                        <Unlock className="h-5 w-5 text-green-500" />
                      ) : (
                        <Lock className="h-5 w-5 text-red-500" />
                      )}
                      <Badge variant={settings.storeStatus === 'open' ? 'default' : 'destructive'}>
                        {settings.storeStatus === 'open' ? 'مفتوح' : 'مغلق'}
                      </Badge>
                    </div>
                  </div>

                  {/* حالة المتجر الحالية */}
                  <Card className={settings.storeStatus === 'open' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${settings.storeStatus === 'open' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {settings.storeStatus === 'open' ? (
                            <Unlock className="h-6 w-6 text-green-600" />
                          ) : (
                            <Lock className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {settings.storeStatus === 'open' ? 'المتجر مفتوح حالياً' : 'المتجر مغلق حالياً'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {settings.storeStatus === 'open'
                              ? 'العملاء يمكنهم تصفح المنتجات وإجراء الطلبات'
                              : 'العملاء سيرون رسالة الإغلاق المخصصة'
                            }
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            const newStatus = settings.storeStatus === 'open' ? 'closed' : 'open';
                            setSettings({ ...settings, storeStatus: newStatus });
                          }}
                          variant={settings.storeStatus === 'open' ? 'destructive' : 'default'}
                        >
                          {settings.storeStatus === 'open' ? (
                            <>
                              <Lock className="h-4 w-4 ml-2" />
                              إغلاق المتجر
                            </>
                          ) : (
                            <>
                              <Unlock className="h-4 w-4 ml-2" />
                              فتح المتجر
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* قوالب رسائل الإغلاق الجاهزة */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        قوالب رسائل جاهزة
                      </CardTitle>
                      <CardDescription>
                        اختر من القوالب الجاهزة أو أنشئ رسالة مخصصة
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {closureTemplates.map((template, index) => (
                          <Card
                            key={index}
                            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                            onClick={() => {
                              if (settings) {
                                setSettings({
                                  ...settings,
                                  closureTitle: template.title,
                                  closureMessage: template.message
                                });
                                toast.success(`تم اختيار قالب: ${template.title}`);
                              }
                            }}
                          >
                            <CardContent className="p-4 text-center">
                              <div className="text-3xl mb-2">{template.emoji}</div>
                              <h4 className="font-medium text-sm mb-2">{template.title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-3">
                                {template.message}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* إعدادات الإغلاق */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        إعدادات الإغلاق
                      </CardTitle>
                      <CardDescription>
                        تخصيص رسالة الإغلاق والخيارات المتاحة للعملاء
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="closureTitle">عنوان رسالة الإغلاق</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSettings({
                                    ...settings,
                                    closureTitle: "المتجر مغلق مؤقتاً",
                                    closureMessage: "نعتذر، المتجر مغلق حالياً. سنعود قريباً بخدمة أفضل!"
                                  });
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3 ml-1" />
                                مسح ومن جديد
                              </Button>
                            </div>
                            <Input
                              id="closureTitle"
                              value={settings.closureTitle}
                              onChange={(e) => setSettings({ ...settings, closureTitle: e.target.value })}
                              placeholder="مثال: المتجر مغلق مؤقتاً"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="closureMessage">رسالة الإغلاق</Label>
                            <textarea
                              id="closureMessage"
                              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={settings.closureMessage}
                              onChange={(e) => setSettings({ ...settings, closureMessage: e.target.value })}
                              placeholder="أدخل رسالة مخصصة للعملاء أثناء إغلاق المتجر"
                            />

                            {/* أزرار الإيموشنات السريعة */}
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">إضافة إيموشنات سريعة:</p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  '😊', '🙏', '💙', '✨', '🌟', '🎉', '🔧', '⚡',
                                  '🚀', '💪', '🌙', '☀️', '❄️', '🏖️', '🔥', '🎊',
                                  '💎', '🌈', '⭐', '🎯', '🎪', '🎨', '🎭', '🎮'
                                ].map((emoji) => (
                                  <Button
                                    key={emoji}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-lg hover:scale-110 transition-transform"
                                    onClick={() => {
                                      const textarea = document.getElementById('closureMessage') as HTMLTextAreaElement;
                                      if (textarea) {
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        const newMessage = settings.closureMessage.substring(0, start) + emoji + settings.closureMessage.substring(end);
                                        setSettings({ ...settings, closureMessage: newMessage });

                                        // إعادة تركيز المؤشر
                                        setTimeout(() => {
                                          textarea.focus();
                                          textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                                        }, 0);
                                      }
                                    }}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              هذه الرسالة ستظهر للعملاء عند زيارة المتجر أثناء الإغلاق
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="closureStartDate">تاريخ بداية الإغلاق (اختياري)</Label>
                            <Input
                              id="closureStartDate"
                              type="datetime-local"
                              value={settings.closureStartDate || ''}
                              onChange={(e) => setSettings({ ...settings, closureStartDate: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                              اتركه فارغاً للإغلاق الفوري
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="closureEndDate">تاريخ نهاية الإغلاق (اختياري)</Label>
                            <Input
                              id="closureEndDate"
                              type="datetime-local"
                              value={settings.closureEndDate || ''}
                              onChange={(e) => setSettings({ ...settings, closureEndDate: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                              سيتم فتح المتجر تلقائياً في هذا التاريخ
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">خيارات إضافية</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              id="allowBrowsing"
                              checked={settings.allowBrowsing}
                              onCheckedChange={(checked) => setSettings({ ...settings, allowBrowsing: checked as boolean })}
                            />
                            <div className="space-y-1">
                              <Label htmlFor="allowBrowsing">السماح بتصفح المنتجات</Label>
                              <p className="text-xs text-muted-foreground">
                                يمكن للعملاء تصفح المنتجات لكن لا يمكنهم الطلب
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              id="showContactInfo"
                              checked={settings.showContactInfo}
                              onCheckedChange={(checked) => setSettings({ ...settings, showContactInfo: checked as boolean })}
                            />
                            <div className="space-y-1">
                              <Label htmlFor="showContactInfo">إظهار معلومات الاتصال</Label>
                              <p className="text-xs text-muted-foreground">
                                عرض أرقام الهاتف والبريد الإلكتروني في صفحة الإغلاق
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* معاينة رسالة الإغلاق */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        معاينة رسالة الإغلاق
                      </CardTitle>
                      <CardDescription>
                        هكذا ستبدو الرسالة للعملاء
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                        <div className="max-w-md mx-auto space-y-4">
                          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                            <Lock className="h-8 w-8 text-red-600" />
                          </div>

                          <h2 className="text-2xl font-bold text-gray-900">
                            {settings.closureTitle}
                          </h2>

                          <p className="text-gray-600 leading-relaxed">
                            {settings.closureMessage}
                          </p>

                          {(settings.closureStartDate || settings.closureEndDate) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                              {settings.closureStartDate && (
                                <p className="flex items-center gap-2 text-blue-700">
                                  <Calendar className="h-4 w-4" />
                                  بداية الإغلاق: {new Date(settings.closureStartDate).toLocaleString('ar-EG')}
                                </p>
                              )}
                              {settings.closureEndDate && (
                                <p className="flex items-center gap-2 text-blue-700 mt-1">
                                  <Clock className="h-4 w-4" />
                                  نهاية الإغلاق: {new Date(settings.closureEndDate).toLocaleString('ar-EG')}
                                </p>
                              )}
                            </div>
                          )}

                          {settings.showContactInfo && (
                            <div className="bg-gray-100 rounded-md p-4 text-sm">
                              <h3 className="font-medium mb-2">للاستفسارات:</h3>
                              <p>📧 {settings.contactEmail}</p>
                              <p>📞 {settings.contactPhone}</p>
                            </div>
                          )}

                          {settings.allowBrowsing && (
                            <Button variant="outline" disabled>
                              تصفح المنتجات (بدون إمكانية الطلب)
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="help-info" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      إدارة معلومات المتجر (القائمة الجانبية)
                    </CardTitle>
                    <CardDescription>
                      هذه النصوص ستظهر للمستخدمين عند الضغط على أزرار القائمة الجانبية في المتجر.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="isPriceInclusive">💰 كام العمولة ؟</Label>
                          <textarea
                            id="isPriceInclusive"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.isPriceInclusive || ""}
                            onChange={(e) => setSettings({ ...settings, isPriceInclusive: e.target.value })}
                            placeholder="مثال: نعم، الأسعار شاملة العمولة..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shippingPrices">🚚 أسعار الشحن</Label>
                          <textarea
                            id="shippingPrices"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.shippingPrices || ""}
                            onChange={(e) => setSettings({ ...settings, shippingPrices: e.target.value })}
                            placeholder="مثال: تبدأ أسعار الشحن من..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="infoAddCommission">💰 إضافة العمولة</Label>
                          <textarea
                            id="infoAddCommission"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.infoAddCommission || ""}
                            onChange={(e) => setSettings({ ...settings, infoAddCommission: e.target.value })}
                            placeholder="مثال: يمكنك إضافة عمولتك الخاصة عبر..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="infoMaxOrders">📦 الحد الأقصى للقطع</Label>
                          <textarea
                            id="infoMaxOrders"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.infoMaxOrders || ""}
                            onChange={(e) => setSettings({ ...settings, infoMaxOrders: e.target.value })}
                            placeholder="مثال: الحد الأقصى لكل طلب هو..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="minWithdrawalLimit">💵 سحب الأرباح</Label>
                          <textarea
                            id="minWithdrawalLimit"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.minWithdrawalLimit || ""}
                            onChange={(e) => setSettings({ ...settings, minWithdrawalLimit: e.target.value })}
                            placeholder="مثال: الحد الأدنى هو..."
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="infoReturnPolicy">🔁 استرجاع / استبدال</Label>
                          <textarea
                            id="infoReturnPolicy"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.infoReturnPolicy || ""}
                            onChange={(e) => setSettings({ ...settings, infoReturnPolicy: e.target.value })}
                            placeholder="مثال: يمكن الاسترجاع خلال..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="aboutUs">👤 من نحن</Label>
                          <textarea
                            id="aboutUs"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.aboutUs || ""}
                            onChange={(e) => setSettings({ ...settings, aboutUs: e.target.value })}
                            placeholder="مثال: نحن متخصصون في..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contactUs">📞 اتصل بنا</Label>
                          <textarea
                            id="contactUs"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.contactUs || ""}
                            onChange={(e) => setSettings({ ...settings, contactUs: e.target.value })}
                            placeholder="مثال: يمكنك التواصل معنا عبر..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customerService">🎧 خدمة العملاء</Label>
                          <textarea
                            id="customerService"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={settings.customerService || ""}
                            onChange={(e) => setSettings({ ...settings, customerService: e.target.value })}
                            placeholder="مثال: فريق الدعم متوفر..."
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">إعدادات أمان لوحة التحكم</h3>
                    <div className="grid gap-2">
                      <Label htmlFor="adminPassword">كلمة مرور الأدمن (الرئيسية)</Label>
                      <div className="relative">
                        <Input
                          id="adminPassword"
                          type={showPasswords.admin ? "text" : "password"}
                          value={settings.adminMasterPassword || ""}
                          onChange={(e) => setSettings({ ...settings, adminMasterPassword: e.target.value })}
                          placeholder="كلمة مرور الأدمن"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('admin')}
                        >
                          {showPasswords.admin ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">تستخدم لتأكيد العمليات الحساسة في لوحة التحكم.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SiteSettingsPage;