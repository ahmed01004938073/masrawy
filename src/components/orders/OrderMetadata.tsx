
import React from "react";
import { CreditCard } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderMetadataProps {
  paymentMethod: string;
  paymentStatus: "paid" | "unpaid";
  marketerName?: string;
  updatedAt: string;
  notes?: string;
  isEditing: boolean;
  onInputChange: (field: string, value: any) => void;
}

// Helper function to translate payment method to Arabic
const translatePaymentMethod = (method: string) => {
  switch (method) {
    case "cash":
      return "الدفع عند الاستلام";
    case "card":
      return "بطاقة ائتمان";
    case "bank_transfer":
      return "تحويل بنكي";
    default:
      return method;
  }
};

const OrderMetadata: React.FC<OrderMetadataProps> = ({
  paymentMethod,
  paymentStatus,
  marketerName,
  updatedAt,
  notes,
  isEditing,
  onInputChange,
}) => {
  return (
    <Card className="border-2">
      <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
        <CardTitle className="text-xl flex items-center">
          <CreditCard className="ml-3 h-5 w-5 text-primary-500" />
          <span className="font-cairo">تفاصيل أخرى</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label className="text-base font-cairo mb-2 block">طريقة الدفع</Label>
            {isEditing ? (
              <select
                value={paymentMethod} 
                onChange={(e) => onInputChange("paymentMethod", e.target.value)}
                className="w-full py-2.5 px-3 border rounded-md text-base"
              >
                <option value="cash">الدفع عند الاستلام</option>
                <option value="card">بطاقة ائتمان</option>
                <option value="bank_transfer">تحويل بنكي</option>
              </select>
            ) : (
              <div className="text-lg p-2 bg-gray-50 rounded-md border border-gray-100">
                {translatePaymentMethod(paymentMethod)}
              </div>
            )}
          </div>
          <div>
            <Label className="text-base font-cairo mb-2 block">حالة الدفع</Label>
            {isEditing ? (
              <select
                value={paymentStatus} 
                onChange={(e) => onInputChange("paymentStatus", e.target.value as "paid" | "unpaid")}
                className="w-full py-2.5 px-3 border rounded-md text-base"
              >
                <option value="paid">تم الدفع</option>
                <option value="unpaid">لم يتم الدفع</option>
              </select>
            ) : (
              <div className="text-lg p-2 bg-gray-50 rounded-md border border-gray-100">
                {paymentStatus === "paid" ? "تم الدفع" : "لم يتم الدفع"}
              </div>
            )}
          </div>
          <div>
            <Label className="text-base font-cairo mb-2 block">المسوق</Label>
            <div className="text-lg p-2 bg-gray-50 rounded-md border border-gray-100">
              {marketerName || "غير متوفر"}
            </div>
          </div>
          <div>
            <Label className="text-base font-cairo mb-2 block">تاريخ التحديث</Label>
            <div className="text-lg p-2 bg-gray-50 rounded-md border border-gray-100">
              {new Date(updatedAt).toLocaleDateString("ar-EG", { 
                year: "numeric", 
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </div>
          <div className="col-span-1 md:col-span-2">
            <Label className="text-base font-cairo mb-2 block">ملاحظات</Label>
            {isEditing ? (
              <Textarea 
                value={notes || ""} 
                onChange={(e) => onInputChange("notes", e.target.value)}
                placeholder="أضف ملاحظات خاصة بالطلب"
                className="text-base min-h-[100px]"
              />
            ) : (
              <div className="text-lg p-3 bg-gray-50 rounded-md border border-gray-100 min-h-[80px]">
                {notes || "لا توجد ملاحظات"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderMetadata;
