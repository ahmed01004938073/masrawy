import { useEffect, useState } from "react";
import { getSiteSettings, SiteSettings } from "@/services/siteSettingsService";
import {
    Facebook, Twitter, Instagram, Youtube, Linkedin,
    MessageCircle, Send, Video, Phone, Mail, MapPin, Heart,
    HelpCircle, Truck, PlusCircle, Package, Wallet,
    RefreshCcw, Info, Headset
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface SocialLink {
    id: number;
    platform: string;
    url: string;
    active: boolean;
}

interface InfoItem {
    id: string;
    label: string;
    icon: React.ElementType;
    key: keyof SiteSettings;
    description: string;
    color: string;
}

const infoItems: InfoItem[] = [
    {
        id: "commission-amount",
        label: "💰 كام العمولة؟",
        icon: HelpCircle,
        key: "isPriceInclusive",
        description: "معلومات عن مبالغ العمولة وأرباحك",
        color: "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/20",
    },
    {
        id: "shipping-prices",
        label: "🚚 أسعار الشحن",
        icon: Truck,
        key: "shippingPrices",
        description: "أسعار الشحن لمختلف المناطق والمحافظات",
        color: "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/20",
    },
    {
        id: "add-commission",
        label: "💰 إضافة العمولة",
        icon: PlusCircle,
        key: "infoAddCommission",
        description: "كيفية إضافة عمولتك الخاصة على الطلبات",
        color: "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/20",
    },
    {
        id: "max-pieces",
        label: "📦 الحد الأقصى",
        icon: Package,
        key: "infoMaxOrders",
        description: "أقصى عدد مسموح به من القطع في الفاتورة الواحدة",
        color: "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border-rose-500/20",
    },
    {
        id: "withdraw-profit",
        label: "💵 سحب الأرباح",
        icon: Wallet,
        key: "minWithdrawalLimit",
        description: "شروط ومواعيد طلب سحب الأرباح من المحفظة",
        color: "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border-purple-500/20",
    },
    {
        id: "return-policy",
        label: "🔁 استرجاع / استبدال",
        icon: RefreshCcw,
        key: "infoReturnPolicy",
        description: "سياسة الإرجاع والاستبدال المتبعة في المنصة",
        color: "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border-orange-500/20",
    },
    {
        id: "about-us",
        label: "👤 من نحن",
        icon: Info,
        key: "aboutUs",
        description: "تعرف على المنصة وأهدافنا في خدمتكم",
        color: "bg-zinc-500/20 text-zinc-300 hover:bg-zinc-500/30 border-zinc-500/20",
    },
    {
        id: "customer-service",
        label: "🎧 خدمة العملاء",
        icon: Headset,
        key: "customerService",
        description: "الدعم الفني والمساعدة للمسوقين",
        color: "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border-teal-500/20",
    },
];

const getSocialIcon = (platform: string) => {
    const cls = "w-4 h-4";
    switch (platform.toLowerCase()) {
        case "facebook": return <Facebook className={cls} />;
        case "twitter": return <Twitter className={cls} />;
        case "instagram": return <Instagram className={cls} />;
        case "youtube": return <Youtube className={cls} />;
        case "linkedin": return <Linkedin className={cls} />;
        case "whatsapp": return <MessageCircle className={cls} />;
        case "telegram": return <Send className={cls} />;
        case "tiktok": return <Video className={cls} />;
        default: return null;
    }
};

const StoreFooter = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [selectedItem, setSelectedItem] = useState<InfoItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        getSiteSettings().then(setSettings);
    }, []);

    const activeSocials: SocialLink[] = ((settings as any)?.socialLinks || []).filter(
        (l: SocialLink) => l.active
    );

    const year = new Date().getFullYear();

    const handleClick = (item: InfoItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    return (
        <>
            <footer className="bg-gray-900 text-gray-300 mt-16 font-cairo" dir="rtl">
                {/* Gradient top bar */}
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600" />

                <div className="max-w-[1440px] mx-auto px-6 pt-10 pb-6">


                    <div className="border-t border-white/10 pt-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                        {/* Column 1: Brand (Start / Right) */}
                        <div className="space-y-4 text-right">
                            <h2 className="text-lg font-extrabold text-white">
                                {settings?.siteName || "متجرنا"}
                            </h2>
                            <p className="text-sm text-gray-400 leading-relaxed max-w-xs ml-auto">
                                {(settings as any)?.footerAbout ||
                                    "نقدّم لك أفضل المنتجات بأسعار مناسبة وجودة عالية. نسعى دائماً لإرضاء عملائنا."}
                            </p>
                            {activeSocials.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1 justify-start">
                                    {activeSocials.map((link) => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={link.platform}
                                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-emerald-500 flex items-center justify-center transition-all duration-300 hover:scale-110"
                                        >
                                            {getSocialIcon(link.platform)}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Column 2: Info Buttons (Center) */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 text-center">
                                مركز المعلومات
                            </h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {infoItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleClick(item)}
                                        className={`flex-none flex items-center justify-center px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap ${item.color}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Column 3: Contact (End / Left) */}
                        <div className="space-y-3 flex flex-col items-start md:items-end">
                            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 w-full text-left md:text-left">
                                تواصل معنا
                            </h3>
                            <ul className="space-y-2 text-sm text-gray-400 w-full flex flex-col items-start md:items-end">
                                {(settings as any)?.whatsappNumber && (
                                    <li className="flex items-center gap-2 justify-end">
                                        <a href={`https://wa.me/${(settings as any).whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                                            {(settings as any).whatsappNumber}
                                        </a>
                                        <Phone className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                    </li>
                                )}
                                {(settings as any)?.contactEmail && (
                                    <li className="flex items-center gap-2 justify-end">
                                        <a href={`mailto:${(settings as any).contactEmail}`} className="hover:text-emerald-400 transition-colors">
                                            {(settings as any).contactEmail}
                                        </a>
                                        <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    </li>
                                )}
                                {(settings as any)?.address && (
                                    <li className="flex items-start gap-2 justify-end text-left">
                                        <span className="text-right">{(settings as any).address}</span>
                                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    </li>
                                )}
                                {!(settings as any)?.whatsappNumber && !(settings as any)?.contactEmail && !(settings as any)?.address && (
                                    <li className="text-gray-600 text-xs text-left w-full">يمكن إضافة بيانات التواصل من إعدادات الموقع</li>
                                )}
                            </ul>
                        </div>

                    </div>


                    {/* Bottom bar */}
                    <div className="border-t border-white/10 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
                        <p>© {year} {settings?.siteName || "المتجر"}. جميع الحقوق محفوظة.</p>
                        <p className="flex items-center gap-1">
                            صُنع بـ <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> لخدمتكم
                        </p>
                    </div>
                </div>
            </footer>

            {/* Info Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[2rem] overflow-hidden p-0 bg-white dark:bg-slate-900">
                    <div className="relative p-8 pt-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[5rem] -z-10" />
                        <DialogHeader className="mb-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    {selectedItem && <selectedItem.icon className="w-6 h-6" />}
                                </div>
                                <div className="text-right">
                                    <DialogTitle className="text-2xl font-black font-cairo text-slate-900 dark:text-white">
                                        {selectedItem?.label}
                                    </DialogTitle>
                                    <DialogDescription className="font-cairo text-slate-500 mt-1">
                                        {selectedItem?.description}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 min-h-[120px]">
                            <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 font-cairo whitespace-pre-wrap text-right">
                                {settings && selectedItem
                                    ? ((settings[selectedItem.key] as string) || "لا يوجد نص متاح حالياً")
                                    : "جاري التحميل..."}
                            </p>
                        </div>
                        <div className="mt-6 flex justify-center">
                            <Button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-full px-10 h-11 font-bold font-cairo shadow-lg shadow-primary/20"
                            >
                                إغلاق
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default StoreFooter;
