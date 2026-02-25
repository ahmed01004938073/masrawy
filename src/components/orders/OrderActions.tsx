import React from "react";
import { Order, OrderStatus, OrderSection } from "@/pages/Orders";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { updateOrder } from "@/services/orderService";
import {
  Check,
  X,
  Pause,
  AlertTriangle,
  Truck,
  Package,
  XCircle,
  Clock,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface OrderActionsProps {
  order: Order;
  originalSection?: OrderSection; // القسم الأصلي للطلب
  onStatusChange: (status: OrderStatus) => Promise<void> | void;
}

const OrderActions: React.FC<OrderActionsProps> = ({ order, originalSection, onStatusChange }) => {
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [actionType, setActionType] = useState<"cancel" | "suspend">("cancel");
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [isAwaitingProcessing, setIsAwaitingProcessing] = useState(false);
  const [isAwaitingShipping, setIsAwaitingShipping] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isPending = order.status === "pending";
  const isSuspended = order.status === "suspended";
  const isConfirmed = order.status === "confirmed";
  const isProcessing = order.status === "processing";
  const originalIsWarehouse = originalSection === "warehouse"; // القسم الأصلي للطلب
  const isAnyAwaitingState = isAwaitingConfirmation || isAwaitingProcessing || isAwaitingShipping;

  const handleConfirmOrder = async () => {
    if (!isAwaitingConfirmation) {
      // First click - show confirmation state
      setIsAwaitingConfirmation(true);
    } else {
      // Second click - confirm and navigate
      try {
        setIsUpdating(true);
        await onStatusChange("confirmed");
        // Navigation and toasts are handled here or effectively by the parent, 
        // but ensuring we wait for update is key.
        // navigate(-1) is best done after we know update is successful.
        navigate(-1);
      } catch (error) {
        console.error("Failed to update status", error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleCompleteProcessing = async () => {
    if (!isAwaitingShipping) {
      // First click - show confirmation state
      setIsAwaitingShipping(true);
    } else {
      // Second click - confirm and navigate
      try {
        setIsUpdating(true);
        await onStatusChange("shipped");
        navigate(-1);
      } catch (error) {
        console.error("Failed to update status", error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleStartProcessing = async () => {
    if (!isAwaitingProcessing) {
      // First click - show confirmation state
      setIsAwaitingProcessing(true);
    } else {
      // Second click - confirm and navigate
      // Change status directly to shipped to skip the intermediate processing step
      try {
        setIsUpdating(true);
        await onStatusChange("shipped");
        toast.info("تم تحويل الطلب إلى قسم الشحن");
        navigate(-1);
      } catch (error) {
        console.error("Failed to update status", error);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleCancelClick = () => {
    setActionType("cancel");
    setShowCancelDialog(true);
  };

  const handleSuspendClick = () => {
    setActionType("suspend");
    setShowSuspendDialog(true);
  };

  const handleCancelOrder = async () => {
    try {
      setIsUpdating(true);
      await onStatusChange("cancelled");
      setShowCancelDialog(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSuspendOrder = async () => {
    try {
      setIsUpdating(true);
      await onStatusChange("suspended");
      setShowSuspendDialog(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReactivateOrder = async () => {
    try {
      setIsUpdating(true);
      await onStatusChange("pending");
      toast.success("تم إعادة تنشيط الطلب بنجاح");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-center gap-4 py-2">
        {/* Confirm Order - Show for pending AND suspended (to reactivate/confirm) */}
        {(isPending || isSuspended) && (
          <Button
            onClick={handleConfirmOrder}
            className={`w-full sm:w-auto text-base py-6 ${isAwaitingConfirmation ? 'bg-green-600 hover:bg-green-700' : ''}`}
            variant="default"
          >
            <Check className="ml-3 h-5 w-5" />
            {isAwaitingConfirmation ? 'تأكيد' : 'تأكيد الطلب وتحويله للمخزن'}
          </Button>
        )}

        {/* Cancel button to go back from confirmation state */}
        {isAwaitingConfirmation && (
          <Button
            onClick={() => setIsAwaitingConfirmation(false)}
            className="w-full sm:w-auto text-base py-6"
            variant="outline"
          >
            <X className="ml-3 h-5 w-5" />
            تراجع
          </Button>
        )}

        {/* Suspend Order - Show for active states (hide when any awaiting state) */}
        {!isAnyAwaitingState && (isPending || isConfirmed || isProcessing) && (
          <Button onClick={handleSuspendClick} className="w-full sm:w-auto text-base py-6" variant="outline">
            <Pause className="ml-3 h-5 w-5" />
            تعليق الطلب
          </Button>
        )}

        {/* Cancel Order - Show for all non-final states (hide when any awaiting state) */}
        {!isAnyAwaitingState && (isPending || isSuspended || isConfirmed || isProcessing) && (
          <Button onClick={handleCancelClick} className="w-full sm:w-auto text-base py-6" variant="destructive">
            <X className="ml-3 h-5 w-5" />
            إلغاء الطلب
          </Button>
        )}

        {/* Reactivate Suspended Order */}
        {isSuspended && (
          <Button onClick={handleReactivateOrder} className="w-full sm:w-auto text-base py-6">
            <Check className="ml-3 h-5 w-5" />
            إعادة تنشيط الطلب
          </Button>
        )}

        {/* Mark as Processing (للطلبات في قسم المخزن فقط) */}
        {isConfirmed && originalIsWarehouse && (
          <>
            <Button
              onClick={handleStartProcessing}
              className={`w-full sm:w-auto text-base py-6 ${isAwaitingProcessing ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
              variant="default"
            >
              <Package className="ml-3 h-5 w-5" />
              {isAwaitingProcessing ? 'تأكيد' : 'بدء تجهيز الطلب'}
            </Button>
            {isAwaitingProcessing && (
              <Button
                onClick={() => setIsAwaitingProcessing(false)}
                className="w-full sm:w-auto text-base py-6"
                variant="outline"
              >
                <X className="ml-3 h-5 w-5" />
                تراجع
              </Button>
            )}
          </>
        )}

        {/* Mark as Shipped (للطلبات في قسم المخزن فقط) */}
        {isProcessing && originalIsWarehouse && (
          <>
            <Button
              onClick={handleCompleteProcessing}
              className={`w-full sm:w-auto text-base py-6 ${isAwaitingShipping ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
              variant="default"
            >
              <Truck className="ml-3 h-5 w-5" />
              {isAwaitingShipping ? 'تأكيد' : 'إنهاء التجهيز والتحويل للشحن'}
            </Button>
            {isAwaitingShipping && (
              <Button
                onClick={() => setIsAwaitingShipping(false)}
                className="w-full sm:w-auto text-base py-6"
                variant="outline"
              >
                <X className="ml-3 h-5 w-5" />
                تراجع
              </Button>
            )}
          </>
        )}
      </div>

      {/* Cancel Order Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-cairo">إلغاء الطلب</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء وسيتم إشعار المسوق بذلك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="text-base">تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90 text-base">
              <AlertTriangle className="ml-2 h-5 w-5" />
              إلغاء الطلب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Order Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-cairo">تعليق الطلب</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              هل أنت متأكد من تعليق هذا الطلب؟ يمكنك إعادة تنشيطه لاحقًا وسيتم إشعار المسوق بذلك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="text-base">تراجع</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspendOrder} className="text-base">تعليق الطلب</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderActions;
