import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "./button";
import SafeImage from "@/components/common/SafeImage";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] p-0 overflow-hidden">
        <DialogHeader className="p-4 bg-gray-50 flex justify-between items-center">
          <DialogTitle className="text-lg">{title || "عرض الصورة"}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-1">
          <div className="w-[500px] h-[500px] mx-auto">
            <SafeImage
              src={imageUrl || "/placeholder.svg"}
              alt={title || "صورة المنتج"}
              className="w-full h-full object-contain"
              fallbackSeed={title || 'image'}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
