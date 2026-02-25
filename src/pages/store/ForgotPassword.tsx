import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/store/UserContext";
import bcrypt from "bcryptjs";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // إضافة حقل رقم الهاتف
  const [step, setStep] = useState<"email" | "code" | "reset">("email"); // مراحل إعادة تعيين كلمة المرور
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedCode, setGeneratedCode] = useState(""); // الكود المُولّد (في بيئة حقيقية يُرسل بالبريد)
  const [isLoading, setIsLoading] = useState(false); // حالة التحميل
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getAllUsers, updateUserPassword } = useUser();

  // التعامل مع إرسال البريد الإلكتروني
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من أن البريد الإلكتروني ورقم الهاتف مسجلين في النظام
    try {
      const response = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "خطأ",
          description: errorData.error || "لا يوجد حساب مسجل بهذه البيانات",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Error verifying details:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الاتصال بالنظام",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // إنشاء كود التحقق
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // كود من 6 أرقام
    setGeneratedCode(code);

    try {
      // لا حاجة لإرسال بريد إلكتروني - الرمز ظاهر للمستخدم مباشرة

      // الانتقال إلى مرحلة إدخال الرمز
      setStep("code");

      toast({
        title: "تم إنشاء رمز التحقق",
        description: "الرمز ظاهر في الصفحة - أدخله للمتابعة",
      });
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "خطأ في إنشاء الرمز",
        description: "حدث خطأ أثناء إنشاء رمز التحقق، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من صحة رمز التحقق
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      if (verificationCode === generatedCode) {
        setStep("reset");
        toast({
          title: "رمز صحيح",
          description: "الآن يمكنك تعيين كلمة مرور جديدة",
        });
      } else {
        toast({
          title: "رمز غير صحيح",
          description: "يرجى التحقق من رمز التحقق وإعادة المحاولة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحقق من الرمز",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تعيين كلمة المرور الجديدة
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      if (newPassword !== confirmPassword) {
        toast({
          title: "خطأ في تأكيد كلمة المرور",
          description: "كلمة المرور وتأكيد كلمة المرور غير متطابقين",
          variant: "destructive",
        });
        return;
      }

      if (newPassword.length < 6) {
        toast({
          title: "كلمة المرور ضعيفة",
          description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
          variant: "destructive",
        });
        return;
      }

      // تشفير كلمة المرور الجديدة
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // تحديث كلمة المرور في قاعدة البيانات عبر الـ API العام
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, newPassword }),
      });

      if (response.ok) {
        toast({
          title: "تم تغيير كلمة المرور",
          description: "تم تغيير كلمة المرور بنجاح، سيتم تحويلك إلى صفحة تسجيل الدخول",
        });

        // التوجيه إلى صفحة تسجيل الدخول
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحديث كلمة المرور');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {step === "email" && "نسيت كلمة المرور"}
            {step === "code" && "رمز التحقق"}
            {step === "reset" && "تعيين كلمة مرور جديدة"}
          </CardTitle>
          <CardDescription>
            {step === "email" && "أدخل بريدك الإلكتروني لإنشاء رمز التحقق"}
            {step === "code" && "رمز التحقق ظاهر أدناه - أدخله للمتابعة"}
            {step === "reset" && "أنشئ كلمة مرور جديدة لحسابك"}
          </CardDescription>
        </CardHeader>

        {step === "email" && (
          <form onSubmit={handleSendCode}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                <p className="font-medium mb-1">تعليمات مهمة:</p>
                <ul className="list-disc mr-4 space-y-1">
                  <li>تأكد من إدخال البريد الإلكتروني ورقم الهاتف الصحيحين اللذين استخدمتهما عند التسجيل</li>
                  <li>بعد الضغط على "إنشاء رمز التحقق" سيظهر لك الرمز مباشرة في الصفحة</li>
                  <li>الرمز صالح لمرة واحدة فقط وي expire بعد 10 دقائق</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full gradient-primary shadow-glow"
                disabled={isLoading}
              >
                {isLoading ? "جارٍ الإنشاء..." : "إنشاء رمز التحقق"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  العودة إلى تسجيل الدخول
                </Link>
              </div>
            </CardFooter>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">رمز التحقق</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="أدخل الرمز المكون من 6 أرقام"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
                {/* عرض الرمز مباشرة للمستخدم في بيئة التطوير */}
                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md">
                  <p className="text-sm font-medium text-yellow-800">رمز التحقق الخاص بك:</p>
                  <p className="text-2xl font-bold text-center mt-2 text-yellow-900">{generatedCode}</p>
                  <p className="text-xs text-yellow-700 mt-2">أدخل الرمز أعلاه في الحقل لإكمال عملية إعادة تعيين كلمة المرور</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded-md">
                <p className="font-medium mb-1">تعليمات مهمة:</p>
                <ul className="list-disc mr-4 space-y-1">
                  <li>الرمز مكون من 6 أرقام كما هو موضح أعلاه</li>
                  <li>الرمز ظهر لك بعد التحقق من بياناتك (البريد الإلكتروني ورقم الهاتف)</li>
                  <li>الرمز صالح لمدة 10 دقائق فقط من وقت الإنشاء</li>
                  <li>احتفظ بالرمز في مكان آمن ولا تشاركه مع أحد</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full gradient-primary shadow-glow"
                disabled={isLoading}
              >
                {isLoading ? "جارٍ التحقق..." : "التحقق من الرمز"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                لم يصلك الرمز؟{" "}
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                >
                  إعادة الإنشاء
                </button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  العودة إلى تسجيل الدخول
                </Link>
              </div>
            </CardFooter>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded-md">
                <p className="font-medium mb-1">تعليمات مهمة:</p>
                <ul className="list-disc mr-4 space-y-1">
                  <li>استخدم كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة، أرقام، ورموز خاصة</li>
                  <li>يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل</li>
                  <li>تجنب استخدام كلمة المرور نفسها التي كنت تستخدمها من قبل</li>
                  <li>احفظ كلمة المرور في مكان آمن ولا تشاركها مع أي شخص</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full gradient-primary shadow-glow"
                disabled={isLoading}
              >
                {isLoading ? "جارٍ التعيين..." : "تعيين كلمة المرور الجديدة"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  العودة إلى تسجيل الدخول
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
