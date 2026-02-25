
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  // إذا كان التطبيق في حالة تحميل، نعرض شاشة تحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // إذا كان المستخدم مسجل الدخول، ننتقل إلى لوحة التحكم
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 p-4">
      <div className="max-w-5xl w-full text-center">
        <div className="flex justify-center mb-6">
          <Activity className="h-16 w-16 text-primary-600" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">نظام إدارة الأفلييت</h1>

        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          منصة متكاملة لإدارة المسوقين وعمليات البيع والشحن والعمولات
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="px-8 py-6 text-lg rounded-full">
            <a href="/login">تسجيل الدخول للوحة التحكم</a>
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-3">لوحة تحكم متكاملة</h3>
            <p className="text-gray-600">إدارة شاملة للمنتجات والطلبات والمسوقين من مكان واحد</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-3">نظام عمولات متطور</h3>
            <p className="text-gray-600">إدارة العمولات والمدفوعات للمسوقين بسهولة وشفافية</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-3">تتبع الطلبات والشحن</h3>
            <p className="text-gray-600">تتبع حالة الطلبات من الاستلام وحتى التسليم بشكل فوري</p>
          </div>
        </div>
      </div>

      <footer className="mt-16 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} نظام إدارة الأفلييت - جميع الحقوق محفوظة
      </footer>
    </div>
  );
};

export default Index;
