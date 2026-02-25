import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Database, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface StorageItem {
    key: string;
    size: number;
    sizeKB: string;
    percentage: number;
}

const StorageAnalyzer = () => {
    const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
    const [totalSize, setTotalSize] = useState(0);
    const [maxSize] = useState(5 * 1024 * 1024); // 5MB typical limit
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const analyzeStorage = () => {
        const items: StorageItem[] = [];
        let total = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key) || '';
                const size = new Blob([value]).size;
                total += size;

                items.push({
                    key,
                    size,
                    sizeKB: (size / 1024).toFixed(2),
                    percentage: 0, // Will calculate after we know total
                });
            }
        }

        // Calculate percentages
        items.forEach(item => {
            item.percentage = (item.size / total) * 100;
        });

        // Sort by size descending
        items.sort((a, b) => b.size - a.size);

        setStorageItems(items);
        setTotalSize(total);
    };

    useEffect(() => {
        analyzeStorage();
    }, []);

    const handleDelete = (key: string) => {
        localStorage.removeItem(key);
        toast.success(`تم حذف "${key}" بنجاح`);
        analyzeStorage(); // Refresh
        setItemToDelete(null);
    };

    const totalPercentage = (totalSize / maxSize) * 100;
    const isNearLimit = totalPercentage > 80;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    محلل استخدام المساحة (LocalStorage)
                </CardTitle>
                <CardDescription>
                    تحليل تفصيلي لاستخدام ذاكرة التخزين المحلية
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overall Usage */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>الاستخدام الكلي</span>
                        <span className={isNearLimit ? 'text-red-500 font-bold' : ''}>
                            {(totalSize / 1024).toFixed(2)} KB / {(maxSize / 1024).toFixed(0)} KB ({totalPercentage.toFixed(1)}%)
                        </span>
                    </div>
                    <Progress value={totalPercentage} className={isNearLimit ? 'bg-red-100' : ''} />
                    {isNearLimit && (
                        <div className="flex items-center gap-2 text-red-500 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>تحذير: المساحة المستخدمة تقترب من الحد الأقصى!</span>
                        </div>
                    )}
                </div>

                {/* Storage Items List */}
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">تفاصيل العناصر المحفوظة:</h4>
                    <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                        {storageItems.map((item) => (
                            <div key={item.key} className="p-3 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{item.key}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.sizeKB} KB ({item.percentage.toFixed(1)}%)
                                        </div>
                                        <Progress value={item.percentage} className="mt-1 h-1" />
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setItemToDelete(item.key)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {storageItems.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground">
                                لا توجد بيانات محفوظة
                            </div>
                        )}
                    </div>
                </div>

                <Button onClick={analyzeStorage} variant="outline" className="w-full">
                    تحديث التحليل
                </Button>
            </CardContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            أنت على وشك حذف "<strong>{itemToDelete}</strong>" من ذاكرة التخزين.
                            <br />
                            <span className="text-red-600 font-bold block mt-2">
                                هذا الإجراء لا يمكن التراجع عنه. تأكد أنك لا تحتاج هذه البيانات.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => itemToDelete && handleDelete(itemToDelete)}
                            className="bg-destructive text-destructive-foreground"
                        >
                            تأكيد الحذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default StorageAnalyzer;
