import React from "react";
import {
    Clock,
    Package,
    Truck,
    CheckCircle,
    TrendingUp,
    XCircle,
} from "lucide-react";

interface OrderStatsProps {
    stats: {
        pending: number;
        processing: number;
        shipped: number;
        inDelivery: number;
        completed: number;
        cancelled: number;
        partial: number;
    };
}

const OrderStats: React.FC<OrderStatsProps> = ({ stats }) => {
    const statItems = [
        { label: "قيد الانتظار", value: stats.pending, icon: Clock, accent: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", glow: "shadow-amber-500/10" },
        { label: "جاري التجهيز", value: stats.processing, icon: Package, accent: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50", glow: "shadow-blue-500/10" },
        { label: "قيد الشحن", value: stats.shipped, icon: Truck, accent: "bg-indigo-500", text: "text-indigo-600", bg: "bg-indigo-50", glow: "shadow-indigo-500/10" },
        { label: "جاري التوصيل", value: stats.inDelivery, icon: Truck, accent: "bg-cyan-500", text: "text-cyan-600", bg: "bg-cyan-50", glow: "shadow-cyan-500/10" },
        { label: "تم التسليم", value: stats.completed, icon: CheckCircle, accent: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", glow: "shadow-emerald-500/10" },
        { label: "تسليم جزئي", value: stats.partial, icon: TrendingUp, accent: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50", glow: "shadow-orange-500/10" },
        { label: "ملغي", value: stats.cancelled, icon: XCircle, accent: "bg-red-500", text: "text-red-600", bg: "bg-red-50", glow: "shadow-red-500/10" },
    ];

    return (
        <div className="w-full">
            {/* Desktop View: Premium Soft-Rounded Cards Grid */}
            <div className="hidden md:block max-w-[1440px] mx-auto px-6">
                <div className="grid grid-cols-7 gap-6">
                    {statItems.map((item, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col items-center justify-center py-8 px-4 rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-slate-200 group cursor-default relative overflow-hidden`}
                        >
                            {/* Icon Circle */}
                            <div className={`w-12 h-12 rounded-full ${item.accent} flex items-center justify-center text-white shadow-lg ${item.glow} transition-transform duration-500 group-hover:scale-110 mb-4`}>
                                <item.icon className="w-6 h-6" />
                            </div>

                            {/* Info */}
                            <div className="flex flex-col items-center gap-1">
                                <span className={`text-4xl font-black ${item.text} tracking-tighter leading-none`}>
                                    {item.value}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-cairo text-center">
                                    {item.label}
                                </span>
                            </div>

                            {/* Subtle Background Accent */}
                            <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full ${item.bg} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile View: 3-and-4 "Triangle" Organized Layout */}
            <div className="flex md:hidden flex-col w-full px-4 gap-3 pb-8">
                {/* Row 1: 3 Items */}
                <div className="grid grid-cols-3 gap-2">
                    {statItems.slice(0, 3).map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-white relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-100 shadow-sm aspect-square active:scale-95 transition-all duration-200"
                        >
                            <div className={`w-9 h-9 rounded-full ${item.accent} flex items-center justify-center text-white shadow-md mb-2 flex-shrink-0`}>
                                <item.icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className={`text-xl font-black ${item.text} leading-none`}>{item.value}</span>
                                <span className="text-[8px] font-black text-slate-400 font-cairo uppercase text-center mt-1 leading-tight">{item.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Row 2: 4 Items */}
                <div className="grid grid-cols-4 gap-2">
                    {statItems.slice(3).map((item, idx) => (
                        <div
                            key={idx + 3}
                            className="bg-white relative overflow-hidden flex flex-col items-center justify-center py-4 px-1 rounded-xl border border-slate-100 shadow-sm active:scale-95 transition-all duration-200"
                        >
                            <div className={`w-8 h-8 rounded-full ${item.accent} flex items-center justify-center text-white shadow-sm mb-2 flex-shrink-0`}>
                                <item.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className={`text-lg font-black ${item.text} leading-none`}>{item.value}</span>
                                <span className="text-[7px] font-black text-slate-400 font-cairo uppercase text-center mt-1 leading-tight">{item.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrderStats;
