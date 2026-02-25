import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/store/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, Award, Plus, X, LogOut, User, Mail, Phone, MapPin, Lock,
  Wallet, ShieldCheck, ChevronLeft, Camera
} from "lucide-react";
import { toast } from "sonner";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { useUser } from "@/contexts/store/UserContext";
import { useOrders } from "@/contexts/store/OrdersContext";
import { useWallet } from "@/contexts/store/WalletContext";
import bcrypt from "bcryptjs";
import { getSavedWallets, saveWallet, SavedWallet } from "@/services/marketerService";

const Profile = () => {
  const { formatPrice } = usePriceFormatter();
  const navigate = useNavigate();
  const { user, updateUserInfo, addPage, removeUserPage, updateUserPassword } = useUser();
  const { orders } = useOrders();
  const { totalEarnedCommission } = useWallet();

  const [userData, setUserData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    alternativePhone: user?.alternativePhone || ""
  });

  // Sync with context user when it updates
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        alternativePhone: user.alternativePhone || ""
      });
    }
  }, [user]);

  // حالة تغيير كلمة المرور
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  // حالة الصفحات
  const [newPage, setNewPage] = useState("");

  // حالة المحافظ المحفوظة
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([]);
  const [isWalletsLoading, setIsWalletsLoading] = useState(false);

  // حساب المحافظ المحفوظة

  // تحديد مستوى المستخدم
  const getUserLevel = (commission: number) => {
    if (commission >= 5000) return { level: "مسوق ذهبي", color: "bg-yellow-500", gradient: "from-yellow-400 to-yellow-600", text: "text-yellow-700" };
    if (commission >= 2000) return { level: "مسوق فضي", color: "bg-gray-400", gradient: "from-gray-300 to-gray-500", text: "text-gray-700" };
    return { level: "مسوق برونزي", color: "bg-amber-700", gradient: "from-amber-600 to-amber-800", text: "text-amber-800" };
  };

  // تحديد نوع الصورة حسب الاسم
  const getAvatarSeed = (name: string) => {
    const femaleNames = ["فاطمة", "آمنة", "أسماء", "رحاب", "رحاب", "سما", "علا", "عهد", "منار", "مريم", "نورا", "هدى", "رحاب", "شهد", "رنا", "علا", "سماح", "أمل", "رحاب"];
    const isFemale = femaleNames.some(femaleName => name.includes(femaleName));
    return isFemale ? "female" : "male";
  };


  // جلب المحافظ المحفوظة
  useEffect(() => {
    const fetchWallets = async () => {
      if (user?.id) {
        setIsWalletsLoading(true);
        try {
          const wallets = await getSavedWallets(user.id);
          setSavedWallets(wallets);
        } catch (error) {
          console.error("Failed to fetch wallets", error);
        } finally {
          setIsWalletsLoading(false);
        }
      }
    };
    fetchWallets();
  }, [user?.id]);

  const walletProviders = [
    { id: "vodafone", name: "فودافون كاش", color: "bg-[#e60000]", text: "text-white" },
    { id: "etisalat", name: "اتصالات كاش", color: "bg-[#9ccb3b]", text: "text-white" },
    { id: "orange", name: "أورانج كاش", color: "bg-[#ff7900]", text: "text-white" },
    { id: "we", name: "وي كاش", color: "bg-[#5c2483]", text: "text-white" }
  ];

  const handleSaveWallet = async (providerId: string, number: string) => {
    if (!user?.id) return;
    if (!number || number.length < 11) {
      toast.error("رقم المحفظة يجب أن يكون 11 رقم");
      return;
    }

    try {
      await saveWallet(user.id, providerId, number);
      // Update local state by refetching
      const wallets = await getSavedWallets(user.id);
      setSavedWallets(wallets);
      toast.success(`تم حفظ رقم محفظة ${walletProviders.find(p => p.id === providerId)?.name} بنجاح`);
    } catch (error: any) {
      console.error("Wallet save error:", error);
      toast.error(error.message || "حدث خطأ أثناء حفظ رقم المحفظة");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateUserInfo({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      city: userData.city,
      alternativePhone: userData.alternativePhone
    });

    if (success) {
      toast.success("تم تحديث معلومات حسابك بنجاح");
    } else {
      toast.error("حدث خطأ أثناء حفظ التغييرات");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast.error("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    try {
      const hashedPassword = await bcrypt.hash(passwordData.new, 10);
      const passwordUpdated = await updateUserPassword(userData.email, hashedPassword);

      if (passwordUpdated) {
        toast.success("تم تغيير كلمة المرور بنجاح");
        setPasswordData({ current: "", new: "", confirm: "" });
      } else {
        throw new Error('فشل في تحديث كلمة المرور');
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تغيير كلمة المرور");
    }
  };

  const handleAddPage = async () => {
    if (newPage.trim() !== "") {
      await addPage(newPage.trim());
      setNewPage("");
      toast.success("تم إضافة الصفحة الجديدة");
    } else {
      toast.error("يرجى إدخال اسم الصفحة");
    }
  };

  const handleRemovePage = async (index: number) => {
    await removeUserPage(index);
    toast.success("تم حذف الصفحة");
  };

  const handleLogout = () => {
    navigate("/");
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const userLevel = getUserLevel(totalEarnedCommission);
  const avatarType = getAvatarSeed(userData.name);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Navbar />

      <div className="relative">
        {/* Premium Shiny Green Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white pt-10 pb-20 px-4 md:px-8 rounded-b-[2.5rem] shadow-lg mb-[-4rem]">
          <div className="container mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner group transition-all hover:bg-white/30">
                <User className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
              </div>
              <div className="bg-white/95 backdrop-blur-sm px-4 md:px-6 py-3 rounded-2xl shadow-xl border border-white/50 max-w-full overflow-hidden">
                <p className="text-zinc-900 text-[11px] sm:text-sm md:text-xl font-black whitespace-nowrap font-cairo">إدارة بياناتك الشخصية وإعدادات الحساب</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            {/* Title removed in favor of header banner */}
          </div>
          <Button variant="ghost" className="md:hidden" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Hero Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-3 border-none shadow-lg bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${userLevel.gradient} blur opacity-75 animate-pulse`}></div>
                  <Avatar className="w-28 h-28 border-4 border-white shadow-xl relative z-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarType}`} />
                    <AvatarFallback className="bg-white text-primary text-2xl font-bold">
                      {userData.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 text-center md:text-right space-y-2">
                  <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3">
                    <h2 className="text-3xl font-bold">{userData.name}</h2>
                    <span className={`${userLevel.color} text-white text-xs px-3 py-1 rounded-full shadow-md font-bold animate-in fade-in zoom-in duration-300`}>
                      {userLevel.level}
                    </span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-primary-foreground/80">
                    <Mail className="w-4 h-4" />
                    <span>{userData.email}</span>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 min-w-[140px] border border-white/20">
                      <p className="text-xs text-primary-foreground/70 mb-1">إجمالي العمولات</p>
                      <p className="text-2xl font-bold flex items-center gap-1">
                        {formatPrice(totalEarnedCommission)}
                        <span className="text-xs font-normal opacity-70">ج.م</span>
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 min-w-[140px] border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(user?.id || "");
                        toast.success("تم نسخ المعرف");
                      }}>
                      <p className="text-xs text-primary-foreground/70 mb-1">معرف المسوق</p>
                      <p className="text-lg font-mono font-bold flex items-center justify-between gap-2">
                        {user?.id}
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">نسخ</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-white shadow-sm border rounded-xl">
            <TabsTrigger value="profile" className="h-12 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary font-bold">
              <User className="w-4 h-4 ml-2" /> المعلومات
            </TabsTrigger>
            <TabsTrigger value="wallets" className="h-12 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary font-bold">
              <Wallet className="w-4 h-4 ml-2" /> المحافظ
            </TabsTrigger>
            <TabsTrigger value="security" className="h-12 rounded-lg data-[state=active]:bg-primary/5 data-[state=active]:text-primary font-bold">
              <ShieldCheck className="w-4 h-4 ml-2" /> الأمان
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="w-5 h-5 text-primary" /> تفاصيل الحساب
                </CardTitle>
                <CardDescription>قم بتحديث معلوماتك الشخصية وصفحات التواصل الاجتماعي</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">الاسم الكامل</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input className="pr-10" value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input className="pr-10 bg-gray-50 opacity-100" value={userData.email} onChange={(e) => setUserData({ ...userData, email: e.target.value })} disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input className="pr-10" value={userData.phone} onChange={(e) => setUserData({ ...userData, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">المدينة</Label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input className="pr-10" value={userData.city} onChange={(e) => setUserData({ ...userData, city: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="block mb-4 text-lg">صفحات السوشيال ميديا</Label>
                    <div className="flex gap-2 mb-4">
                      <Input placeholder="أضف رابط أو اسم الصفحة..." value={newPage} onChange={(e) => setNewPage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPage())}
                        className="flex-1" />
                      <Button type="button" onClick={handleAddPage}><Plus className="w-4 h-4" /></Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {user?.pages?.map((page, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border group hover:border-primary/30 transition-colors">
                          <span className="text-sm line-clamp-1">{page}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePage(index)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {(!user?.pages || user.pages.length === 0) && (
                        <div className="text-center p-4 py-8 text-muted-foreground bg-gray-50 rounded-lg border border-dashed col-span-2">
                          لا توجد صفحات مضافة حالياً
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="w-full md:w-auto bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                      حفظ التغييرات
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallets" className="mt-0">
            <div className="grid md:grid-cols-2 gap-6">
              {walletProviders.map((provider) => {
                const saved = savedWallets.find(w => w.provider === provider.id);
                return (
                  <Card key={provider.id} className="overflow-hidden border-none shadow-md group hover:shadow-lg transition-all duration-300">
                    <div className={`h-2 w-full ${provider.color}`}></div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${provider.color} flex items-center justify-center text-white shadow-md`}>
                            <Wallet className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-lg">{provider.name}</h3>
                        </div>
                        {saved && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> محفوظ</span>}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          id={`wallet-${provider.id}`}
                          defaultValue={saved?.number || ""}
                          placeholder="01xxxxxxxxx"
                          maxLength={11}
                          className="text-lg font-mono tracking-wider bg-gray-50 focus:bg-white transition-colors"
                        />
                        <Button
                          onClick={() => {
                            const input = document.getElementById(`wallet-${provider.id}`) as HTMLInputElement;
                            handleSaveWallet(provider.id, input.value);
                          }}
                          className={`${provider.color} text-white hover:opacity-90 shadow-md`}
                        >
                          حفظ
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <Card className="border-none shadow-md">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Lock className="w-5 h-5 text-primary" /> الأمان وكلمة المرور
                </CardTitle>
                <CardDescription>قم بتغيير كلمة المرور الخاصة بحسابك</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg mx-auto">
                  <div className="space-y-2">
                    <Label>كلمة المرور الحالية</Label>
                    <Input type="password" value={passwordData.current} onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور الجديدة</Label>
                    <Input type="password" value={passwordData.new} onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>تأكيد كلمة المرور</Label>
                    <Input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} />
                  </div>
                  <Button type="submit" variant="destructive" className="w-full mt-4">
                    تغيير كلمة المرور
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 flex justify-center">
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full md:w-auto" onClick={handleLogout}>
                <LogOut className="w-4 h-4 ml-2" /> تسجيل الخروج من كل الأجهزة
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
