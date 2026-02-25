import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SocialLinks from "@/components/store/SocialLinks";

const RefundPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("general");

  const policySections = [
    {
      id: "general",
      title: "السياسات العامة",
      content: `
        <h3 class="text-lg font-semibold mb-2">الشروط العامة للاسترجاع:</h3>
        <ul class="list-disc pr-5 space-y-2">
          <li>يمكن استرجاع المنتج خلال 14 يوم من تاريخ الاستلام</li>
          <li>يجب أن يكون المنتج في حالته الأصلية مع جميع الملحقات</li>
          <li>يجب تقديم إيصال الشراء أو إثبات الطلب</li>
          <li>لا تشمل سياسة الاسترجاع المنتجات المخصصه أو المطبوعة حسب الطلب</li>
        </ul>
      `
    },
    {
      id: "process",
      title: "إجراءات الاسترجاع",
      content: `
        <h3 class="text-lg font-semibold mb-2">خطوات طلب الاسترجاع:</h3>
        <ol class="list-decimal pr-5 space-y-2">
          <li>التواصل مع خدمة العملاء عبر صفحة "تواصل معنا"</li>
          <li>تقديم تفاصيل الطلب وسبب الاسترجاع</li>
          <li>انتظار موافقة طلب الاسترجاع من الفريق المختص</li>
          <li>تعبئة المنتج في عبوته الأصلية وإرساله للعنوان المحدد</li>
          <li>استلام المبلغ بعد التحقق من سلامة المنتج</li>
        </ol>
      `
    },
    {
      id: "exceptions",
      title: "الاستثناءات",
      content: `
        <h3 class="text-lg font-semibold mb-2">المنتجات غير القابلة للاسترجاع:</h3>
        <ul class="list-disc pr-5 space-y-2">
          <li>المنتجات المطبوعة حسب الطلب أو المخصصة</li>
          <li>المنتجات التي تم فتحها واستخدامها</li>
          <li>المنتجات التي تم إتلافها بعد الاستلام</li>
          <li>المنتجات التي تم شراؤها بخصم أكثر من 50%</li>
        </ul>
      `
    },
    {
      id: "timeline",
      title: "الجدول الزمني",
      content: `
        <h3 class="text-lg font-semibold mb-2">التوقيت المتوقع لكل مرحلة:</h3>
        <ul class="list-disc pr-5 space-y-2">
          <li>مراجعة طلب الاسترجاع: 1-2 يوم عمل</li>
          <li>موافقة الطلب: 1-3 يوم عمل</li>
          <li>استلام المنتج: 5-7 أيام عمل</li>
          <li>استرجاع المبلغ: 3-5 أيام عمل بعد استلام المنتج</li>
        </ul>
      `
    }
  ];

  const currentSection = policySections.find(section => section.id === activeSection);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">سياسة الاسترجاع</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            العودة
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>سياسات واستراتيجيات الاسترجاع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {policySections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "outline"}
                  onClick={() => setActiveSection(section.id)}
                  className="rounded-full"
                >
                  {section.title}
                </Button>
              ))}
            </div>

            <div className="prose prose-lg max-w-none">
              {currentSection && (
                <div dangerouslySetInnerHTML={{ __html: currentSection.content }} />
              )}
            </div>

            <div className="mt-6">
              <SocialLinks />
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h3 className="font-semibold text-lg mb-2">هل تحتاج مساعدة إضافية؟</h3>
              <p className="mb-3">
                إذا كانت لديك أي استفسارات حول سياسة الاسترجاع أو تحتاج مساعدة في طلب استرجاع،
                لا تتردد في التواصل مع فريق خدمة العملاء لدينا.
              </p>
              <Button onClick={() => navigate("/contact")}>
                تواصل مع خدمة العملاء
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefundPolicy;
