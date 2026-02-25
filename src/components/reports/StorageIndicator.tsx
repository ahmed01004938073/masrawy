import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, AlertCircle, RefreshCw } from 'lucide-react';

interface DBStats {
    totalSize: number;
    quota: number;
    percentage: number;
}

export const StorageIndicator: React.FC = () => {
    const [stats, setStats] = useState<DBStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchStats = async () => {
        try {
            setError(false);
            const response = await fetch('/api/system/db-stats?_t=' + Date.now());
            if (!response.ok) throw new Error();
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Storage Fetch Error');
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const timer = setInterval(fetchStats, 60000);
        return () => clearInterval(timer);
    }, []);

    if (loading) return <div className="h-48 flex items-center justify-center"><RefreshCw className="animate-spin text-blue-500" /></div>;

    if (error || !stats) return (
        <Card className="border-dashed border-red-200 bg-red-50/30">
            <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
                <AlertCircle className="text-red-500 h-8 w-8" />
                <p className="text-sm font-bold text-red-700">السيرفر غير مستجيب</p>
                <p className="text-xs text-red-500">برجاء إغلاق السيرفر وتشغيله (Restart) لتفعيل الحساسات</p>
                <button onClick={() => { setLoading(true); fetchStats(); }} className="text-xs text-blue-600 underline mt-2">إعادة محاولة</button>
            </CardContent>
        </Card>
    );

    const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (stats.percentage / 100) * circumference;

    return (
        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="pb-2 text-center">
                <CardTitle className="text-sm font-bold flex items-center justify-center gap-2 text-gray-700">
                    <Database className="h-4 w-4 text-blue-600" />
                    مساحة البيانات
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-6">
                <div className="relative flex items-center justify-center">
                    {/* Gauge SVG */}
                    <svg className="w-40 h-40 transform -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-gray-100"
                        />
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            fill="transparent"
                            className="text-blue-600 transition-all duration-1000 ease-out"
                        />
                    </svg>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                        <span className="text-3xl font-black text-gray-900">{Math.round(stats.percentage)}%</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">مستخدم</span>
                    </div>
                </div>

                {/* Details */}
                <div className="mt-4 grid grid-cols-2 gap-8 w-full px-4">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 font-bold mb-1">المحجوز</p>
                        <p className="text-sm font-black text-gray-800">{formatMB(stats.totalSize)}</p>
                    </div>
                    <div className="text-center border-r border-gray-100">
                        <p className="text-[10px] text-gray-500 font-bold mb-1">المتبقي</p>
                        <p className="text-sm font-black text-green-600">{formatMB(stats.quota - stats.totalSize)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
