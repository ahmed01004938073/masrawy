import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/store/UserContext";
import bcrypt from "bcryptjs";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getAllUsers, login, register } = useUser();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من صحة البيانات
    if (!name || !email || !phone || !password) {
      toast({
        title: "خطأ في التسجيل",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمة المرور وتأكيد كلمة المرور غير متطابقين",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "كلمة المرور ضعيفة",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    // التحقق من تكرار الإيميل ورقم الهاتف
    const users = await getAllUsers();
    const isEmailRegistered = users.some((user: any) => user.email.toLowerCase() === email.toLowerCase());
    const isPhoneRegistered = users.some((user: any) => user.phone === phone);

    if (isEmailRegistered) {
      toast({
        title: "خطأ في التسجيل",
        description: "هذا البريد الإلكتروني مسجل بالفعل",
        variant: "destructive",
      });
      return;
    }

    if (isPhoneRegistered) {
      toast({
        title: "خطأ في التسجيل",
        description: "رقم الهاتف هذا مسجل بالفعل",
        variant: "destructive",
      });
      return;
    }

    // تشفير كلمة المرور
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // تسجيل المستخدم الجديد
    const success = await register({
      name,
      email,
      phone,
      password: hashedPassword,
      city: "",
      pages: []
    });

    if (success) {
      // Auto login
      await login(email, password); // Pass plain password for comparison

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحباً بك في عالم الدروبشيبينغ!",
      });

      navigate("/products");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: "url('/images/register-bg.png')" }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0"></div>

      <Card className="w-full max-w-lg shadow-2xl relative z-10 border border-white/10 bg-black/30 backdrop-blur-xl text-white overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>

        <CardHeader className="text-center space-y-2 pt-8">
          <CardTitle className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
            انضم إلينا الآن
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            ابدأ رحلتك في عالم التجارة الإلكترونية والدروبشيبينغ
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-5 px-6 md:px-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">الاسم الكامل *</Label>
              <Input
                id="name"
                placeholder="أدخل اسمك الكريم"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-yellow-400/50 transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-yellow-400/50 transition-all duration-300 ltr:text-left text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-200">رقم الهاتف (واتساب) *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-yellow-400/50 transition-all duration-300 ltr:text-left text-left"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">كلمة المرور *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-yellow-400/50 transition-all duration-300 ltr:text-left text-left"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-200">تأكيد كلمة المرور *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-yellow-400/50 transition-all duration-300 ltr:text-left text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 px-6 md:px-8 pb-8">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black font-bold text-lg py-6 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:scale-[1.01] transition-all duration-300 rounded-xl"
            >
              تسجيل حساب جديد
            </Button>

            <div className="text-center text-sm text-gray-400 mt-4">
              لديك حساب بالفعل؟{" "}
              <Link to="/login" className="text-yellow-400 hover:text-yellow-300 hover:underline font-medium transition-colors">
                تسجيل الدخول
              </Link>
            </div>

            <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-white/10 w-full">
              <span className="text-xs text-gray-500">أمان وحماية تامة لبياناتك</span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">دعم فني متميز</span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
