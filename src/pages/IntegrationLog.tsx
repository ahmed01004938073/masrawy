import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  getIntegrationLog, 
  getIntegrationStats,
  simulateStoreRegistration,
  StoreMarketerData 
} from "@/services/marketerIntegrationService";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw,
  Users,
  TrendingUp,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import { toast } from "sonner";

const IntegrationLogPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // تحميل البيانات
  const loadData = () => {
    setLogs(getIntegrationLog());
    setStats(getIntegrationStats());
  };

  useEffect(() => {
    loadData();
  }, []);

  // تحديث البيانات
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadData();
      setIsRefreshing(false);
      toast.success("تم تحديث البيانات");
    }, 1000);
  };

  // محاكاة تسجيل جديد
  const handleSimulateRegistration = async () => {
    setIsSimulating(true);
    
    try {
      const randomNames = ["محمد أحمد", "فاطمة علي", "أحمد محمود", "سارة خالد", "عمر حسن"];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randomPhone = `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      const randomEmail = `${randomName.replace(/\s+/g, '.').toLowerCase()}@example.com`;

      const storeMarketerData: StoreMarketerData = {
        name: randomName,
        phone: randomPhone,
        email: randomEmail,
        storeId: `store-${Date.now()}`,
        registrationDate: new Date().toISOString(),
        address: "القاهرة، مصر"
      };

      const result = await simulateStoreRegistration(storeMarketerData);
      
      if (result.success) {
        toast.success(result.message);
        loadData(); // تحديث البيانات
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء المحاكاة");
    } finally {
      setIsSimulating(false);
    }
  };

  // فلترة السجلات
  const filteredLogs = logs.filter(log => 
    !searchQuery || 
    log.marketerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.marketerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // الحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // الحصول على أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان والأزرار */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">سجل التكامل</h1>
            <p className="text-muted-foreground">
              سجل عمليات التكامل مع المتجر الإلكتروني
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button 
              onClick={handleSimulateRegistration}
              disabled={isSimulating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSimulating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري المحاكاة...
                </>
              ) : (
                <>
                  <ExternalLink className="ml-2 h-4 w-4" />
                  محاكاة تسجيل جديد
                </>
              )}
            </Button>
          </div>
        </div>

        {/* إحصائيات التكامل */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-900 to-blue-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                إجمالي العمليات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total || 0}</div>
              <p className="text-xs text-blue-200 mt-1">
                {stats.todayRegistrations || 0} تسجيل اليوم
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900 to-green-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                عمليات ناجحة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.successful || 0}</div>
              <p className="text-xs text-green-200 mt-1">
                {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}% نسبة النجاح
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900 to-red-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-100 flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                عمليات فاشلة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.failed || 0}</div>
              <p className="text-xs text-red-200 mt-1">
                {stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0}% نسبة الفشل
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900 to-yellow-700 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                عمليات معلقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pending || 0}</div>
              <p className="text-xs text-yellow-200 mt-1">
                في انتظار المعالجة
              </p>
            </CardContent>
          </Card>
        </div>

        {/* خانة البحث */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في السجل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                >
                  مسح
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* سجل العمليات */}
        <Card>
          <CardHeader>
            <CardTitle>سجل العمليات</CardTitle>
            <CardDescription>
              {filteredLogs.length} عملية
              {searchQuery && ` (نتائج البحث عن: "${searchQuery}")`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-lg font-semibold text-gray-600">
                  {searchQuery ? "لا توجد نتائج" : "لا توجد عمليات"}
                </p>
                <p className="text-gray-500 mt-1">
                  {searchQuery ? "جرب البحث بكلمات أخرى" : "لم يتم تسجيل أي عمليات تكامل بعد"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getStatusColor(log.status)}>
                            {getStatusIcon(log.status)}
                            <span className="mr-1">
                              {log.status === 'success' ? 'نجح' : 
                               log.status === 'failed' ? 'فشل' : 'معلق'}
                            </span>
                          </Badge>
                          <span className="font-semibold">{log.marketerName}</span>
                          <span className="text-gray-500 text-sm">{log.marketerEmail}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{log.details}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            {formatDistanceToNow(new Date(log.timestamp), { 
                              addSuffix: true, 
                              locale: arEG 
                            })}
                          </span>
                          {log.storeId && (
                            <span>معرف المتجر: {log.storeId}</span>
                          )}
                          {log.adminId && (
                            <span>معرف الإدارة: {log.adminId}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IntegrationLogPage;
