
import React, { useState } from "react";
import { OrderItem } from "@/pages/Orders";
import { calculateCommission } from "./orderUtils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Plus, Minus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SafeImage from "@/components/common/SafeImage";

interface OrderItemsTableProps {
  items: OrderItem[];
  isEditing: boolean;
  onQuantityChange: (itemId: string, newQuantity: number) => void;
  onRemoveProduct: (itemId: string) => void;
}

const OrderItemsTable: React.FC<OrderItemsTableProps> = ({
  items,
  isEditing,
  onQuantityChange,
  onRemoveProduct
}) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  return (
    <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-primary/5">
          <TableRow className="hover:bg-primary/5">
            <TableHead className="w-16 text-base font-cairo font-semibold text-center"></TableHead>
            <TableHead className="text-center text-base font-cairo font-semibold w-1/4 px-6">المنتج</TableHead>
            <TableHead className="text-center text-base font-cairo font-semibold w-1/6 px-4">اللون</TableHead>
            <TableHead className="text-center text-base font-cairo font-semibold w-1/6 px-4">المقاس</TableHead>
            <TableHead className="text-center text-base font-cairo font-semibold w-1/6 px-4">السعر</TableHead>
            <TableHead className="text-center text-base font-cairo font-semibold w-1/6 px-4">العمولة</TableHead>
            <TableHead className="text-center text-base font-cairo font-semibold w-1/6 px-4">الكمية</TableHead>
            <TableHead className="text-center text-base font-cairo font-semibold w-1/6 px-4">المجموع</TableHead>
            {isEditing && <TableHead className="w-10"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
              <TableCell>
                <div
                  className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden border cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedImage({ url: item.image || "/placeholder.svg", name: item.productName })}
                >
                  <SafeImage
                    src={item.image || "/placeholder.svg"}
                    alt={item.productName}
                    className="w-full h-full object-contain"
                    fallbackSeed={item.id || item.productName}
                  />
                </div>
              </TableCell>
              <TableCell className="w-12 h-12 text-center">{item.productName}</TableCell>
              <TableCell className="text-base px-4 text-center">{item.color || "-"}</TableCell>
              <TableCell className="text-base px-4 text-center">{item.size || "-"}</TableCell>
              <TableCell className="text-base px-4 text-center">{item.price} ج.م</TableCell>
              <TableCell className="text-base px-4 text-center">{calculateCommission(item, item.quantity).toFixed(2)} ج.م</TableCell>
              <TableCell className="text-base px-4 text-center">
                {isEditing ? (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => onQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 h-9 text-center text-base"
                    />

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-base">{item.quantity}</div>
                )}
              </TableCell>
              <TableCell className="text-base font-medium px-4">{item.total} ج.م</TableCell>
              {isEditing && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveProduct(item.id)}
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash className="h-5 w-5" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-cairo flex justify-between items-center">
              <span>{selectedImage?.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <SafeImage
              src={selectedImage?.url || "/placeholder.svg"}
              alt={selectedImage?.name || "صورة المنتج"}
              className="max-w-full max-h-[70vh] object-contain"
              fallbackSeed={selectedImage?.name || 'product'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderItemsTable;
