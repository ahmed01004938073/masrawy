// Order utility functions

export const getStatusText = (status: string): string => {
    switch (status) {
        case "pending": return "قيد الانتظار";
        case "confirmed": return "مؤكد";
        case "processing": return "قيد التجهيز";
        case "shipped": return "تم الشحن";
        case "in_delivery": return "جاري التوصيل";
        case "delivered": return "تم التوصيل";
        case "partially_delivered": return "تم التوصيل جزئياً";
        case "cancelled": return "ملغي";
        case "completed": return "مكتمل";
        case "partial": return "جزئي";
        default: return status;
    }
};

export const getStatusBadge = (status: string): string => {
    switch (status) {
        case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "confirmed": return "bg-blue-100 text-blue-800 border-blue-200";
        case "processing": return "bg-purple-100 text-purple-800 border-purple-200";
        case "shipped": return "bg-indigo-100 text-indigo-800 border-indigo-200";
        case "in_delivery": return "bg-orange-100 text-orange-800 border-orange-200";
        case "delivered": return "bg-green-100 text-green-800 border-green-200";
        case "partially_delivered": return "bg-amber-100 text-amber-800 border-amber-200";
        case "cancelled": return "bg-red-100 text-red-800 border-red-200";
        case "completed": return "bg-green-100 text-green-800 border-green-200";
        case "partial": return "bg-yellow-100 text-yellow-800 border-yellow-200";
        default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
};
