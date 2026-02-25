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

import { getSiteSettings } from "@/services/siteSettingsService";

interface AdminSecurityDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
    passwordType?: 'admin' | 'archive';
}

const AdminSecurityDialog: React.FC<AdminSecurityDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title = "التحقق من الصلاحية",
    description = "هذا الإجراء محمي. يرجى إدخال كلمة المرور للمتابعة.",
    passwordType = 'admin',
}) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const normalizeNumerals = (str: string) => {
        const arabicNumerals = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
        for (let i = 0; i < 10; i++) {
            str = str.replace(arabicNumerals[i], i.toString());
        }
        return str;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(false);

        try {
            const settings = await getSiteSettings();
            const adminPassword = settings?.adminMasterPassword || "3990";
            const archivePassword = settings?.archiveMasterPassword || "3990";

            const targetPassword = passwordType === 'archive' ? archivePassword : adminPassword;

            const normalizedInput = normalizeNumerals(password.trim());
            const normalizedTarget = normalizeNumerals(String(targetPassword).trim());

            if (normalizedInput === normalizedTarget) {
                setIsSubmitting(false);
                setPassword(""); // Clear password
                onSuccess();
                toast.success("تم التحقق بنجاح");
            } else {
                setIsSubmitting(false);
                setError(true);
                toast.error("كلمة المرور غير صحيحة");
            }
        } catch (err) {
            console.error("Error verifying admin password:", err);
            setIsSubmitting(false);
            toast.error("حدث خطأ أثناء التحقق");
        }
    };

    const handleClose = () => {
        setPassword("");
        setError(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">
                        <div className="flex items-center justify-center gap-2">
                            <Lock className="h-5 w-5 text-primary" />
                            <span>{title}</span>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-password">كلمة المرور</Label>
                        <Input
                            id="admin-password"
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

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            إلغاء
                        </Button>
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

export default AdminSecurityDialog;
