
import React from "react";
import { User, Phone, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit, Save } from "lucide-react";

// List of Egyptian provinces
const egyptianProvinces = [
  "القاهرة",
  "الإسكندرية",
  "الجيزة",
  "الشرقية",
  "القليوبية",
  "الدقهلية",
  "البحيرة",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "أسوان",
  "الأقصر",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "كفر الشيخ",
];

interface CustomerInformationProps {
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerAddress: string;
  province?: string;
  city?: string;
  customerNotes?: string;
  isEditing: boolean;
  canEditOrder: boolean;
  onEditToggle: () => void;
  onInputChange: (field: string, value: any) => void;
}

const CustomerInformation: React.FC<CustomerInformationProps> = ({
  customerName,
  customerPhone,
  customerPhone2 = "",
  customerAddress,
  province,
  city,
  customerNotes = "",
  isEditing,
  canEditOrder,
  onEditToggle,
  onInputChange,
}) => {
  return (
    <Card className="border-2">
      <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
        <CardTitle className="text-xl flex justify-between items-center">
          <div className="flex items-center">
            <User className="ml-3 h-5 w-5 text-primary-500" />
            <span className="font-cairo">معلومات العميل</span>
          </div>
          {canEditOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditToggle}
              className="h-10 text-base"
            >
              {isEditing ? (
                <>
                  <Save className="ml-2 h-5 w-5" />
                  حفظ
                </>
              ) : (
                <>
                  <Edit className="ml-2 h-5 w-5" />
                  تعديل
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <Label className="text-base font-cairo mb-2 block">الاسم</Label>
            {isEditing ? (
              <Input
                value={customerName}
                onChange={(e) => onInputChange("customerName", e.target.value)}
                className="py-6 text-base"
              />
            ) : (
              <div className="text-lg p-2 bg-gray-50 rounded-md border border-gray-100">{customerName}</div>
            )}
          </div>
          <div>
            <Label className="text-base font-cairo mb-2 block">رقم الهاتف الأساسي</Label>
            {isEditing ? (
              <Input
                value={customerPhone}
                onChange={(e) => onInputChange("customerPhone", e.target.value)}
                className="py-6 text-base"
              />
            ) : (
              <div className="flex items-center text-lg p-2 bg-gray-50 rounded-md border border-gray-100">
                <Phone className="ml-2 h-4 w-4 text-gray-500" />
                {customerPhone}
              </div>
            )}
          </div>

          <div>
            <Label className="text-base font-cairo mb-2 block">رقم هاتف آخر</Label>
            {isEditing ? (
              <Input
                value={customerPhone2}
                onChange={(e) => onInputChange("customerPhone2", e.target.value)}
                className="py-6 text-base"
                placeholder="رقم هاتف بديل (اختياري)"
              />
            ) : (
              <div className="flex items-center text-lg p-2 bg-gray-50 rounded-md border border-gray-100">
                <Phone className="ml-2 h-4 w-4 text-gray-500" />
                {customerPhone2 || "-"}
              </div>
            )}
          </div>

          {/* Province */}
          <div>
            <Label className="text-base font-cairo mb-2 block">المحافظة</Label>
            {isEditing ? (
              <select
                value={province || "القاهرة"}
                onChange={(e) => onInputChange("province", e.target.value)}
                className="w-full py-2.5 px-3 border rounded-md text-base"
              >
                {egyptianProvinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center text-lg p-2 bg-gray-50 rounded-md border border-gray-100">
                <MapPin className="ml-2 h-4 w-4 text-gray-500" />
                {province || "القاهرة"}
              </div>
            )}
          </div>

          {/* City */}
          <div>
            <Label className="text-base font-cairo mb-2 block">المدينة</Label>
            {isEditing ? (
              <Input
                value={city || ""}
                onChange={(e) => onInputChange("city", e.target.value)}
                placeholder="المدينة"
                className="py-6 text-base"
              />
            ) : (
              <div className="text-lg p-2 bg-gray-50 rounded-md border border-gray-100">{city || "-"}</div>
            )}
          </div>

          <div className="col-span-1 md:col-span-2">
            <Label className="text-base font-cairo mb-2 block">العنوان بالكامل</Label>
            {isEditing ? (
              <Textarea
                value={customerAddress}
                onChange={(e) => onInputChange("customerAddress", e.target.value)}
                className="text-base min-h-[100px]"
              />
            ) : (
              <div className="text-lg p-3 bg-gray-50 rounded-md border border-gray-100 min-h-[80px]">
                {customerAddress}
              </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-2">
            <Label className="text-base font-cairo mb-2 block">ملاحظات العميل</Label>
            {isEditing ? (
              <Textarea
                value={customerNotes}
                onChange={(e) => onInputChange("customerNotes", e.target.value)}
                className="text-base min-h-[80px]"
                placeholder="ملاحظات إضافية عن العميل (اختياري)"
              />
            ) : (
              <div className="text-lg p-3 bg-gray-50 rounded-md border border-gray-100 min-h-[60px]">
                {customerNotes || "-"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerInformation;
