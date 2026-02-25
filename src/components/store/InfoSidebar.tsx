import React, { useState, useEffect } from "react";
import {
    HelpCircle,
    Truck,
    Clock,
    CreditCard,
    Currency,
    RefreshCcw,
    Info,
    MessageSquare,
    X,
    CheckCircle2,
    Users,
    ShieldCheck,
    Zap,
    Phone,
    Headset,
    Package,
    PlusCircle,
    Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSiteSettings, SiteSettings } from "@/services/siteSettingsService";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InfoItem {
    id: string;
    label: string;
    icon: React.ElementType;
    key: keyof SiteSettings;
    description: string;
}

const InfoSidebar = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [selectedItem, setSelectedItem] = useState<InfoItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await getSiteSettings();
            setSettings(data);
        };
        fetchSettings();
    }, []);

    const infoItems: (InfoItem & { color?: string })[] = [
        {
            id: "commission-amount",
            label: "💰 كام العمولة ؟",
            icon: HelpCircle,
            key: "isPriceInclusive",
            description: "معلومات عن مبالغ العمولة وأرباحك",
            color: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:hover:bg-amber-900/20 border-amber-100/50 dark:border-amber-900/30"
        },
        {
            id: "shipping-prices",
            label: "🚚 أسعار الشحن",
            icon: Truck,
            key: "shippingPrices",
            description: "أسعار الشحن لمختلف المناطق والمحافظات",
            color: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/10 dark:text-blue-400 dark:hover:bg-blue-900/20 border-blue-100/50 dark:border-blue-900/30"
        },
        {
            id: "add-commission",
            label: "💰 إضافة العمولة",
            icon: PlusCircle,
            key: "infoAddCommission",
            description: "كيفية إضافة عمولتك الخاصة على الطلبات",
            color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:hover:bg-emerald-900/20 border-emerald-100/50 dark:border-emerald-900/30"
        },
        {
            id: "max-pieces",
            label: "📦 الحد الأقصى للقطع",
            icon: Package,
            key: "infoMaxOrders",
            description: "أقصى عدد مسموح به من القطع في الفاتورة الواحدة",
            color: "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:hover:bg-rose-900/20 border-rose-100/50 dark:border-rose-900/30"
        },
        {
            id: "withdraw-profit",
            label: "💵 سحب الأرباح",
            icon: Wallet,
            key: "minWithdrawalLimit",
            description: "شروط ومواعيد طلب سحب الأرباح من المحفظة",
            color: "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/10 dark:text-purple-400 dark:hover:bg-purple-900/20 border-purple-100/50 dark:border-purple-900/30"
        },
        {
            id: "return-policy",
            label: "🔁 استرجاع / استبدال",
            icon: RefreshCcw,
            key: "infoReturnPolicy",
            description: "سياسة الإرجاع والاستبدال المتبعة في المنصة",
            color: "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:hover:bg-orange-900/20 border-orange-100/50 dark:border-orange-900/30"
        },
        {
            id: "about-us",
            label: "👤 من نحن",
            icon: Info,
            key: "aboutUs",
            description: "تعرف على المنصة وأهدافنا في خدمتكم",
            color: "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 border-zinc-100 dark:border-zinc-700"
        },
        {
            id: "contact-us",
            label: "📞 اتصل بنا",
            icon: Phone,
            key: "contactUs",
            description: "طرق التواصل المباشر مع إدارة المنصة",
            color: "bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/10 dark:text-sky-400 dark:hover:bg-sky-900/20 border-sky-100/50 dark:border-sky-900/30"
        },
        {
            id: "customer-service",
            label: "🎧 خدمة العملاء",
            icon: Headset,
            key: "customerService",
            description: "الدعم الفني والمساعدة للمسوقين",
            color: "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/10 dark:text-teal-400 dark:hover:bg-teal-900/20 border-teal-100/50 dark:border-teal-900/30"
        },
    ];

    const handleItemClick = (item: InfoItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col pt-0 pb-6 px-3 sticky top-6">
            {/* The "Beautiful Frame" Container - Perfect Symmetry and Prominent Buttons */}
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-2 border-gray-100 dark:border-zinc-800 rounded-[2.5rem] p-5 pb-6 shadow-[0_8px_40px_rgba(0,0,0,0.03)] flex flex-col h-fit overflow-hidden">
                {/* Decorative Header Area */}
                <div className="px-2 py-1.5 mb-3 border-b border-gray-50 dark:border-zinc-800 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] font-cairo">مركز المعلومات</span>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400/30" />
                        <div className="w-2 h-2 rounded-full bg-emerald-400/30" />
                    </div>
                </div>

                {/* Coordinated Color Buttons - Larger Size and Tighter Gaps */}
                <div className="flex flex-col gap-3">
                    {infoItems.map((item) => (
                        <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                                "flex items-center justify-start px-5 py-5 text-sm md:text-md lg:text-lg font-bold rounded-2xl transition-all w-full border font-cairo h-auto shadow-sm hover:shadow-md hover:-translate-y-0.5 group/btn relative overflow-hidden shrink-0",
                                item.color
                            )}
                            onClick={() => handleItemClick(item)}
                        >
                            <span className="truncate flex-1 text-right leading-tight">
                                {item.label}
                            </span>
                        </Button>
                    ))}
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[2rem] overflow-hidden p-0 bg-white dark:bg-slate-900">
                    <div className="relative p-8 pt-10">
                        {/* Background Accent */}
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

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 min-h-[150px]">
                            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-cairo whitespace-pre-wrap text-right">
                                {settings && selectedItem ? (settings[selectedItem.key] as string || "لا يوجد نص متاح حالياً") : "جاري التحميل..."}
                            </p>
                        </div>

                        <div className="mt-8 flex justify-center">
                            <Button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-full px-10 h-12 font-bold font-cairo shadow-lg shadow-primary/20"
                            >
                                إغلاق النافذة
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default InfoSidebar;
