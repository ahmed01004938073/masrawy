import React from "react";
import { Separator } from "@/components/ui/separator";
import { CardFooter } from "@/components/ui/card";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";

interface OrderSummaryProps {
  productTotal: number;
  shippingFee: number;
  commission: number;
  discount?: number;
  paidAmount?: number;
  province?: string;
  items?: { quantity: number }[];
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  productTotal,
  shippingFee,
  commission,
  discount = 0,
  paidAmount = 0,
  province = "القاهرة",
  items = []
}) => {
  const { formatPrice } = usePriceFormatter();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  // Ensure numeric addition and subtract discount
  const totalPrice = Number(productTotal) + Number(shippingFee) - Number(discount);
  const collectibleTotal = totalPrice - Number(paidAmount);

  return (
    <CardFooter className="flex-col items-end border-t p-5 bg-gray-50 rounded-b-lg">
      <div className="space-y-3 text-base w-full sm:w-72 md:w-80">
        <div className="flex justify-between">
          <span>عدد المنتجات:</span>
          <span className="font-medium">{totalItems} منتج</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>إجمالي سعر المنتجات:</span>
          <span className="font-medium">{formatPrice(productTotal)} ج.م</span>
        </div>
        <div className="flex justify-between">
          <span>تكلفة الشحن ({province || 'غير محدد'}):</span>
          <span className="font-medium">{formatPrice(shippingFee)} ج.م</span>
        </div>
        <div className="flex justify-between text-blue-600">
          <span>العمولة:</span>
          <span className="font-medium">{formatPrice(commission)} ج.م</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span>الخصم:</span>
            <span className="text-red-500 font-medium">- {formatPrice(discount)} ج.م</span>
          </div>
        )}
        {paidAmount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>تم دفعه مقدماً:</span>
            <span>- {formatPrice(paidAmount)} ج.م</span>
          </div>
        )}
        <Separator className="my-3" />
        <div className="flex justify-between items-center font-bold text-xl py-4 px-5 bg-primary-100 rounded-lg border-2 border-primary-300 shadow-md">
          <span className="font-cairo leading-relaxed">
            {paidAmount > 0 ? "المتبقي للتحصيل:" : "الإجمالي:"}
          </span>
          <span className="text-primary-900">{formatPrice(collectibleTotal)} ج.م</span>
        </div>
        {paidAmount > 0 && (
          <div className="text-[10px] text-center w-full text-muted-foreground mt-1">
            إجمالي الفاتورة الأصلي: {formatPrice(totalPrice)} ج.م
          </div>
        )}
      </div>
    </CardFooter>
  );
};

export default OrderSummary;