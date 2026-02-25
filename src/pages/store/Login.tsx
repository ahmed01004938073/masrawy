import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/store/UserContext";
import bcrypt from "bcryptjs";
import { useStoreStatus } from "@/hooks/useStoreStatus";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useUser();
  const { settings, loading } = useStoreStatus();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const success = await login(email, password, rememberMe);

      if (success) {
        toast({
          title: "✨ تسجيل دخول ناجح",
          description: "مرحباً بك مرة أخرى! نتمنى لك يوماً مثمراً",
          className: "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none shadow-xl shadow-green-500/20 rounded-xl",
        });

        navigate("/products");
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleShowLoginForm = () => {
    setShowLoginForm(true);
    setShowRegisterForm(false);
  };

  const handleShowRegisterForm = () => {
    setShowRegisterForm(true);
    setShowLoginForm(false);
  };

  const handleBackToOptions = () => {
    setShowLoginForm(false);
    setShowRegisterForm(false);
    setEmail("");
    setPassword("");
  };

  // إذا كان جاري التحميل لتجنب ظهور النص الافتراضي
  if (loading) {
    return (
      <div
        className="fixed inset-0 overflow-hidden bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
        style={{ backgroundImage: "url('/images/egypt-map.png')" }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
        <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl ring-1 ring-white/5 flex flex-col items-center justify-center gap-6">
          {/* Skeleton Loading */}
          <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse"></div>
          <div className="space-y-3 w-full flex flex-col items-center">
            <div className="h-8 w-3/4 bg-white/10 rounded-md animate-pulse"></div>
            <div className="h-4 w-1/2 bg-white/10 rounded-md animate-pulse"></div>
          </div>

          <div className="w-full space-y-3 mt-4">
            <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse"></div>
            <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // إذا كان يجب عرض نموذج تسجيل الدخول
  if (showLoginForm) {
    return (
      <div
        className="fixed inset-0 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/egypt-map.png')" }}
      >
        {/* Dark Overlay for consistency */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(#3b82f6 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>

        {/* محتوى الصفحة */}
        <div className="w-full max-w-md relative z-10 mx-auto my-2 flex flex-col h-full justify-center">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500 ring-1 ring-white/5">

              <div className="text-center mb-10 -mt-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center mb-4 ring-1 ring-primary/30">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                </div>
                {/* Logo/Title in Login Form Header */}
                {settings?.storeNameImage ? (
                  <img src={settings.storeNameImage} alt={settings.displayName || "Login"} className="h-12 mx-auto mb-4 object-contain" />
                ) : (
                  <h2 className="text-2xl font-bold text-white mb-2 font-cairo">
                    {settings?.displayName || "تسجيل الدخول"}
                  </h2>
                )}
                <p className="text-gray-400 text-sm">
                  أهلاً بك في عالم التجارة الإلكترونية والدروبشيبينغ
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right block text-sm font-medium text-gray-300">البريد الإلكتروني</Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                      className="pl-10 pr-4 py-6 text-base rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-right block text-sm font-medium text-gray-300">كلمة المرور</Label>
                    <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-4 py-6 text-base rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300 cursor-pointer"
                  >
                    تذكرني
                  </Label>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white border-none py-6 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] transition-all duration-300 rounded-xl mt-2">
                  تسجيل الدخول
                </Button>

                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <span>ليس لديك حساب؟</span>
                    <button
                      type="button"
                      onClick={handleShowRegisterForm}
                      className="text-primary font-bold hover:text-primary/80 hover:underline transition-all"
                    >
                      إنشاء حساب جديد
                    </button>
                  </div>

                  <div className="text-center w-full">
                    <button
                      type="button"
                      onClick={handleBackToOptions}
                      className="text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto group py-2 px-4 rounded-lg hover:bg-white/5"
                    >
                      <span className="group-hover:-translate-x-1 transition-transform duration-300">&larr;</span>
                      <span>العودة للخيارات</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // إذا كان يجب عرض نموذج التسجيل
  if (showRegisterForm) {
    // إعادة توجيه إلى صفحة التسجيل
    window.location.href = "/register";
    return null;
  }

  // العرض الافتراضي مع خيارين
  return (
    <div
      className="fixed inset-0 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/egypt-map.png')" }}
    >
      {/* Reduced overlay for better image visibility */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>



      {/* Top Info Links */}
      <div className="absolute top-4 left-4 z-20">
        <div className="flex gap-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-sm transition-all hover:bg-black/40">
          <a href="/refund-policy" className="text-gray-300 hover:text-primary text-sm font-medium transition-colors">
            سياسة الاسترجاع
          </a>
          <span className="text-white/20">|</span>
          <a href="/about" className="text-gray-300 hover:text-primary text-sm font-medium transition-colors">
            عن المنصة
          </a>
          <span className="text-white/20">|</span>
          <a href="/contact" className="text-gray-300 hover:text-primary text-sm font-medium transition-colors">
            تواصل معنا
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">

        {/* Glass Card - Dark Version */}
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500 ring-1 ring-white/5">


          {settings?.loginPageImage || settings?.storeNameImage ? (
            <img src={settings.loginPageImage || settings.storeNameImage} alt={settings.displayName || "Store"} className="mx-auto max-h-[120px] object-contain mb-4" />
          ) : (
            <h1 className="text-5xl font-bold text-white mb-4 font-cairo tracking-wide">
              {settings?.displayName}
              <span className="text-primary">.</span>
            </h1>
          )}
          <p className="text-gray-300 text-lg font-medium mt-0 mb-8 text-center mx-auto">{settings?.siteDescription || "أفضل نظام أفلييت"}</p>

          <div className="space-y-4">
            {/* Key Features Icons */}
            <div className="grid grid-cols-3 gap-2 mb-6 text-center text-xs text-gray-300">
              <div className="bg-white/5 rounded-lg p-2 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="block font-bold text-primary text-xl mb-1">%</span>
                أعلى عمولات
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="block font-bold text-primary text-xl mb-1">🚀</span>
                شحن سريع
              </div>
              <div className="bg-white/5 rounded-lg p-2 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="block font-bold text-primary text-xl mb-1">📦</span>
                منتجات متنوعة
              </div>
            </div>

            <Button
              onClick={handleShowLoginForm}
              className="w-full bg-primary hover:bg-primary/90 text-white border-none py-6 text-lg font-bold shadow-lg hover:shadow-primary/20 transition-all duration-300 rounded-xl"
            >
              تسجيل الدخول
            </Button>

            <Button
              onClick={handleShowRegisterForm}
              variant="outline"
              className="w-full bg-transparent hover:bg-white/5 text-white hover:text-white border-2 border-white/20 hover:border-primary/50 py-6 text-lg font-medium transition-all duration-300 rounded-xl"
            >
              ابدأ تجارتك الآن
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              ابدأ مشروعك الخاص بدون رأس مال مع أقوى المنتجات
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;