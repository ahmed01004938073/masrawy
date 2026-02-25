
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Employee } from "@/types/employeeTypes";

// بيانات الموظفين مع الصلاحيات
import { getEmployees, getEmployeeByNameOrEmail, loginEmployee, sendHeartbeat } from "@/services/employeeService";
import { setCookie, getCookie, deleteCookie } from "@/utils/cookieUtils";


interface AuthContextType {
  user: Employee | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (section: string, action?: string) => boolean;
  trackAction: (actionType: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// مساعدة لترجمة أسماء الصفحات للعربية
const getArabicPageName = (pathname: string): string => {
  if (pathname === '/') return 'لوحة التحكم';
  if (pathname.includes('/products')) return 'المنتجات';
  if (pathname.includes('/categories')) return 'الأقسام';
  if (pathname.includes('/orders')) return 'الطلبات';
  if (pathname.includes('/warehouse')) return 'المخزن';
  if (pathname.includes('/shipping')) return 'الشحن';
  if (pathname.includes('/delivery')) return 'جاري التوصيل';
  if (pathname.includes('/archive')) return 'الأرشيف';
  if (pathname.includes('/marketers')) return 'المسوقين';
  if (pathname.includes('/commissions')) return 'العمولات';
  if (pathname.includes('/reports')) return 'التقارير';
  if (pathname.includes('/settings')) return 'الإعدادات';
  if (pathname.includes('/site-settings')) return 'إعدادات الموقع';
  return pathname;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const location = useLocation();

  // تتبع النشاط الفعلي يدوياً
  const trackAction = useCallback((actionType: string) => {
    if (!user) return;
    const pageName = getArabicPageName(location.pathname);
    sendHeartbeat(user.id, pageName, actionType);
  }, [user, location.pathname]);

  // إرسال نبضات القلب دورياً مع اسم الصفحة
  useEffect(() => {
    if (!user) return;

    const reportHeartbeat = () => {
      const pageName = getArabicPageName(location.pathname);
      sendHeartbeat(user.id, pageName);
    };

    // إبلاغ فوري عند تغيير الصفحة
    reportHeartbeat();

    // إبلاغ دوري كل دقيقة
    const interval = setInterval(reportHeartbeat, 60000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  useEffect(() => {
    const initAuth = async () => {
      console.log('🔄 تهيئة نظام المصادقة...');

      // مسح sessionStorage القديم - REMOVED to prevent signing out store users
      // try {
      //   sessionStorage.clear();
      // } catch (e) { }

      // استعادة الجلسة من التخزين المؤقت (sessionStorage)
      const token = sessionStorage.getItem('admin_auth_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/session/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            console.log('✅ تم استعادة الجلسة من السيرفر');
          } else {
            console.warn('⚠️ جلسة غير صالحة');
            sessionStorage.removeItem('admin_auth_token');
          }
        } catch (error) {
          console.warn("⚠️ خطأ في الاتصال بالسيرفر:", error);
        }
      }

      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔄 Sending login request to /api/auth/login');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password })
      });

      console.log('📡 Response status:', res.status);

      if (!res.ok) {
        const err = await res.json();
        console.error('❌ Login failed:', err);
        throw new Error(err.error || "فشل تسجيل الدخول");
      }

      const data = await res.json();
      console.log('📦 Response data:', data);
      console.log('📦 Response data stringified:', JSON.stringify(data, null, 2));
      console.log('👤 User from response:', data.user);
      console.log('🔑 Token from response:', data.token);

      const { user, token } = data;

      console.log('🔍 Extracted - User:', user, 'Token:', token);
      console.log('✅ Condition check - user && token:', user && token);

      if (user && token) {
        // حفظ التوكن في التخزين المؤقت (ينتهي بمجرد غلق المتصفح)
        console.log('💾 Saving token to sessionStorage...');
        sessionStorage.setItem('admin_auth_token', token);
        console.log('✅ Token saved. Checking:', sessionStorage.getItem('admin_auth_token'));

        setUser(user);
        console.log('✅ User state set');
        toast.success(`مرحباً ${user.name}! تم تسجيل الدخول`);
      } else {
        console.error('❌ Missing user or token in response!');
        throw new Error('استجابة غير كاملة من السيرفر');
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      toast.error(error instanceof Error ? error.message : "خطأ");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = sessionStorage.getItem('admin_auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      } catch (e) {
        console.error("Logout API failed", e);
      }
    }

    sessionStorage.removeItem('admin_auth_token');
    setUser(null);
    toast.success("تم تسجيل الخروج");
  };

  const checkPermission = (section: string, action: string = "view") => {
    if (!user) {
      console.log('❌ لا يوجد مستخدم مسجل دخول');
      return false;
    }

    console.log(`🔍 فحص صلاحية: ${user.name} | القسم: ${section} | الإجراء: ${action}`);

    // المدير لديه جميع الصلاحيات
    if (user.role === "admin") {
      console.log('✅ مدير - صلاحية كاملة');
      return true;
    }

    // التحقق من الصلاحيات المحددة
    if (user.permissions) {
      const sectionPermission = user.permissions.find(p => p.section === section);
      if (sectionPermission && sectionPermission.actions.includes(action)) {
        console.log('✅ صلاحية محددة موجودة');
        return true;
      }
    }

    // التحقق من الأقسام المتاحة (للعرض فقط)
    if (action === "view" && user.accessibleSections) {
      // We assume section string corresponds to SystemSection or is valid check
      const hasAccess = user.accessibleSections.includes(section as any);
      console.log(`${hasAccess ? '✅' : '❌'} صلاحية عرض: ${hasAccess}`);
      return hasAccess;
    }

    console.log('❌ لا توجد صلاحية');
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission: checkPermission, trackAction }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
