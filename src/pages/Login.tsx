
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Loader2 } from "lucide-react";
import { getSiteSettings } from "@/services/siteSettingsService";
import { useQuery } from "@tanstack/react-query";

const Login = () => {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // جلب إعدادات الموقع
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // إذا كان التطبيق في حالة تحميل، نعرض شاشة تحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  // إذا كان المستخدم مسجل الدخول بالفعل، ننتقل إلى لوحة التحكم
  if (user) {
    return <Navigate to="/admin/dashboard" />;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // التحقق من وجود البيانات
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      setIsSubmitting(false);
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      console.error("Login Error:", err);
      const errorMessage = err instanceof Error ? err.message : "خطأ غير معروف";
      setError(`خطأ في تسجيل الدخول: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-green-950/50 via-transparent to-black/40"></div>
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#166534 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>

      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 mx-auto flex flex-col h-full justify-center p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500 ring-1 ring-white/5">

            {/* Header */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4 ring-1 ring-green-500/30">
                <Activity className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 font-cairo">{settings?.siteName || "نظام الأفلييت"}</h1>
              <p className="text-gray-400 text-sm">تسجيل الدخول للوصول إلى لوحة التحكم</p>
            </div>

            {/* Login Form */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 text-right">
                  اسم المستخدم أو البريد الإلكتروني
                </label>
                <Input
                  id="email"
                  name={`email_${Date.now()}`}
                  type="text"
                  placeholder="أدخل الاسم أو البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin(e as any)}
                  className="w-full text-right py-6 text-base rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-end">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    كلمة المرور
                  </label>
                </div>
                <Input
                  id="password"
                  name={`password_${Date.now()}`}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin(e as any)}
                  className="w-full py-6 text-base rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all duration-300"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-form-type="other"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-center text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              <Button
                type="button"
                onClick={(e) => handleLogin(e as any)}
                className="w-full bg-green-600 hover:bg-green-700 text-white border-none py-6 text-lg font-bold shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.01] transition-all duration-300 rounded-xl mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                ) : null}
                تسجيل الدخول
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm">
                نظام إدارة الأفلييت - جميع الحقوق محفوظة © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
