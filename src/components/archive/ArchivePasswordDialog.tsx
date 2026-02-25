import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";

interface ArchivePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ArchivePasswordDialog: React.FC<ArchivePasswordDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);

    // التحقق من كلمة المرور
    if (password === "ahmed3990") {
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        toast.success("تم التحقق بنجاح");
      }, 800); // تأخير قصير لتحسين تجربة المستخدم
    } else {
      setTimeout(() => {
        setIsSubmitting(false);
        setError(true);
        toast.error("كلمة المرور غير صحيحة");
      }, 800);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <span>التحقق من الصلاحية</span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-center">
            هذا القسم محمي. يرجى إدخال كلمة المرور للوصول إلى إدارة الأرشيف.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className={error ? "border-red-500" : ""}
              autoComplete="off"
            />
            {error && (
              <p className="text-sm text-red-500">كلمة المرور غير صحيحة</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !password}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  جاري التحقق...
                </>
              ) : (
                "تأكيد"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ArchivePasswordDialog;
