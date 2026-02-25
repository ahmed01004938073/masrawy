import React, { useState, useEffect } from "react";
import { Order, OrderStatus, OrderItem } from "@/pages/Orders";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { X, ClipboardList, Plus, Printer, MessageSquare } from "lucide-react";
import { updateOrder, updateOrderStatus as updateStorageOrderStatus } from "@/services/orderService";
import { useQueryClient } from "@tanstack/react-query";
import OrderMessages from "./OrderMessages";
import PrintableInvoice from "./PrintableInvoice";
import { printInvoice, InvoiceData, CompanySettings } from "@/utils/invoiceTemplate";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Import new components
import CustomerInformation from "./CustomerInformation";
import OrderItemsTable from "./OrderItemsTable";
import OrderSummary from "./OrderSummary";
import OrderActions from "./OrderActions";
import MarketerInformation from "./MarketerInformation";

import { translateStatus, getStatusBadgeColor, shippingRates, calculateCommission } from "./orderUtils";

interface OrderDetailsProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Order>(order);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission } = useAuth();

  // Reset states when order changes
  useEffect(() => {
    setEditedOrder(order);
    setError(null);
    setIsLoading(false);
  }, [order]);

  if (!order) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-cairo">خطأ في تحميل الطلب</DialogTitle>
          </DialogHeader>
          <p className="text-red-500 text-center py-4">لا يمكن تحميل تفاصيل الطلب. يرجى المحاولة مرة أخرى.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const canEditOrder = hasPermission("orders", "edit");
  const canConfirmCancelOrder = hasPermission("orders", "confirm");

  // Calculate financials whenever order items change
  useEffect(() => {
    if (isEditing) {
      const productTotal = editedOrder.items.reduce((sum, item) => sum + item.total, 0);
      const commission = calculateCommission({ productId: editedOrder.items[0]?.productId || '', price: productTotal });
      const shippingFee = shippingRates[editedOrder.province || "القاهرة"] || 50;

      setEditedOrder(prev => ({
        ...prev,
        shippingFee,
        commission,
        totalAmount: productTotal + shippingFee - (prev.discount || 0)
      }));
    }
  }, [editedOrder.items, editedOrder.province, isEditing]);

  const handleEditToggle = async () => {
    try {
      if (isEditing) {
        setIsLoading(true);
        // Save changes
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update order in localStorage
        updateOrder({
          ...editedOrder,
          updatedAt: new Date().toISOString()
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["orders"] });

        toast.success("تم حفظ التغييرات بنجاح");
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    } catch (err) {
      setError("حدث خطأ أثناء حفظ التغييرات");
      toast.error("فشل في حفظ التغييرات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Order, value: any) => {
    setEditedOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const queryClient = useQueryClient();

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 1. Update order status in local state
      const updatedOrder = {
        ...editedOrder,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      setEditedOrder(updatedOrder);

      // 2. Update order in localStorage
      // 2. Update order in localStorage
      await updateStorageOrderStatus(updatedOrder.id, newStatus);

      // 3. Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-orders"] });
      queryClient.invalidateQueries({ queryKey: ["shipping-orders"] });
      queryClient.invalidateQueries({ queryKey: ["section-counts"] });

      // 4. Show success message
      toast.success(`تم تغيير حالة الطلب إلى ${translateStatus(newStatus)}`);

      // 5. If confirmed, notify about transferring to warehouse
      if (newStatus === "confirmed") {
        toast.info("تم تحويل الطلب إلى قسم المخازن للتجهيز");
        // إغلاق النافذة بعد التأكيد
        setTimeout(() => {
          onClose();
        }, 1500);
      }

      // 6. Notify marketer (in real app, this would be an API call)
      toast.info(`تم إرسال إشعار للمسوق ${editedOrder.marketerName} بتحديث حالة الطلب`);
    } catch (err) {
      setError("حدث خطأ أثناء تحديث حالة الطلب");
      toast.error("فشل في تحديث حالة الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    try {
      // إعداد بيانات الفاتورة
      const invoiceData: InvoiceData = {
        orderNumber: editedOrder.orderNumber,
        customerName: editedOrder.customerName,
        customerPhone: editedOrder.customerPhone,
        customerAddress: editedOrder.customerAddress,
        notes: editedOrder.customerNotes,
        items: editedOrder.items.map(item => ({
          id: item.id,
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          color: item.color,
          size: item.size
        })),
        subtotal: editedOrder.items.reduce((sum, item) => sum + item.total, 0),
        shippingFee: editedOrder.shippingFee,
        total: editedOrder.items.reduce((sum, item) => sum + item.total, 0) + editedOrder.shippingFee - (editedOrder.discount || 0),
        paidAmount: editedOrder.paid_amount || 0,
        date: new Date(editedOrder.createdAt).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        province: editedOrder.province,
        city: editedOrder.city,
        page: editedOrder.page
      };

      // إعداد بيانات الشركة
      const companyData: CompanySettings = {
        companyName: companySettings.companyName,
        companyLogo: companySettings.companyLogo,
        companyPhone: companySettings.companyPhone,
        companyEmail: companySettings.companyEmail,
        companyAddress: companySettings.companyAddress
      };

      // طباعة الفاتورة
      printInvoice(invoiceData, companyData);
      toast.success("جاري طباعة الفاتورة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء طباعة الفاتورة");
    }
  };

  // Company information for invoice - load from localStorage or use defaults
  const [companySettings, setCompanySettings] = useState({
    companyName: "شركة أفليت للتجارة الإلكترونية",
    companyLogo: "/logo.png",
    companyPhone: "01XXXXXXXXX",
    companyEmail: "info@afleet.com",
    companyAddress: "القاهرة، مصر",
  });

  // Load company settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("companySettings");
    if (savedSettings) {
      try {
        setCompanySettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Error parsing saved company settings:", error);
      }
    }
  }, []);



  const handleRemoveProduct = (itemId: string) => {
    setEditedOrder(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));

    toast.success("تم حذف المنتج من الطلب");
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setEditedOrder(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            total: item.price * newQuantity
          };
        }
        return item;
      })
    }));
  };



  const productTotal = editedOrder.items.reduce((sum, item) => sum + item.total, 0);
  const commission = calculateCommission({ productId: editedOrder.items[0]?.productId || '', price: productTotal });

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl flex justify-between items-center font-cairo">
            <span>تفاصيل الطلب #{editedOrder.orderNumber}</span>
            <div className="flex items-center gap-3">
              {isLoading && <span className="text-sm text-gray-500">جاري التحميل...</span>}
              <Badge className={`${getStatusBadgeColor(editedOrder.status)} border-none text-base px-4 py-1.5`}>
                {translateStatus(editedOrder.status)}
              </Badge>
            </div>
          </DialogTitle>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mt-2">
              {error}
            </div>
          )}
          <DialogDescription className="text-base mt-2">
            تاريخ الطلب: {new Date(editedOrder.createdAt).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-3">
          {/* Marketer Information Component */}
          <MarketerInformation
            marketerId={editedOrder.marketerId}
            marketerName={editedOrder.marketerName}
          />

          {/* Customer Information Component */}
          <CustomerInformation
            customerName={editedOrder.customerName}
            customerPhone={editedOrder.customerPhone}
            customerPhone2={editedOrder.customerPhone2}
            customerAddress={editedOrder.customerAddress}
            province={editedOrder.province}
            city={editedOrder.city}
            customerNotes={editedOrder.customerNotes}
            isEditing={isEditing}
            canEditOrder={canEditOrder}
            onEditToggle={handleEditToggle}
            onInputChange={handleInputChange}
          />

          {/* Order Items */}
          <Card className="border-2">
            <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
              <CardTitle className="text-xl flex justify-between items-center">
                <div className="flex items-center">
                  <ClipboardList className="ml-3 h-5 w-5 text-primary-500" />
                  <span className="font-cairo">المنتجات</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">


              {/* Order Items Table Component */}
              <OrderItemsTable
                items={editedOrder.items}
                isEditing={isEditing}
                onQuantityChange={handleQuantityChange}
                onRemoveProduct={handleRemoveProduct}
              />
            </CardContent>

            {/* Order Summary Component */}
            <OrderSummary
              productTotal={productTotal}
              shippingFee={editedOrder.shippingFee}
              commission={commission}
              discount={editedOrder.discount}
              paidAmount={editedOrder.paid_amount || 0}
              province={editedOrder.province}
              items={editedOrder.items}
            />
          </Card>



          {/* Order Messages Component */}
          <OrderMessages
            orderId={editedOrder.id}
            orderNumber={editedOrder.orderNumber}
            marketerId={editedOrder.marketerId}
            marketerName={editedOrder.marketerName}
          />

          {/* Actions */}
          {canConfirmCancelOrder && (
            <Card className="border-2 bg-gray-50">
              <CardContent className="p-5">
                <OrderActions
                  order={editedOrder}
                  onStatusChange={handleStatusChange}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="sm:justify-center gap-2 border-t pt-4">
          <Button variant="default" onClick={onClose} className="text-base py-6 px-5 bg-blue-600 hover:bg-blue-700">
            <X className="ml-2 h-5 w-5" />
            إغلاق
          </Button>
        </DialogFooter>

        {/* Printable Invoice - Hidden until print */}
        <PrintableInvoice
          order={editedOrder}
          companyName={companySettings.companyName}
          companyLogo={companySettings.companyLogo}
        />
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetails;

