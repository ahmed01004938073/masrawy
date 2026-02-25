import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Unlock, Calendar, Globe, DollarSign, ShoppingCart, TrendingUp, Box, Package } from "lucide-react";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { getOrderStats } from "@/services/orderService";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { user } = useAuth();
  const { storeOpen, settings, loading } = useStoreStatus();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["order-summary-stats"],
    queryFn: () => getOrderStats(),
    refetchInterval: 60000,
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">مرحباً, {user?.name} 👋</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800 font-cairo">
                    {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            هذه نظرة عامة على أداء منصة الأفلييت الخاصة بك
          </p>
        </div>



        {/* Store Status Alert */}
        {!storeOpen && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Lock className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-red-900">المتجر مغلق حالياً</h4>
                  </div>
                  <p className="text-sm text-red-700">
                    {settings.closureMessage}
                  </p>
                  {settings.closureEndDate && (
                    <p className="text-xs text-red-600 mt-1">
                      متوقع إعادة الفتح: {new Date(settings.closureEndDate).toLocaleString('ar-EG')}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {storeOpen && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Unlock className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-green-900">المتجر مفتوح</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    العملاء يمكنهم تصفح المنتجات وإجراء الطلبات بشكل طبيعي
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Beautiful design with "مخزني" in the center */}
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            {settings?.dashboardLogoType === 'image' && settings.dashboardLogoUrl ? (
              <img
                src={settings.dashboardLogoUrl}
                alt={settings.dashboardTitle || "Dashboard Logo"}
                className="mx-auto max-h-[120px] sm:max-h-[200px] md:max-h-[300px] object-contain mb-8 px-4"
              />
            ) : (
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                {settings?.dashboardTitle || "مخزني"}
              </h1>
            )}
            <p className="text-md sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              {settings?.siteDescription || "إدارة متكاملة لمنتجاتك ومخزونك وعمليات البيع"}
            </p>
            <div className="mt-8 flex justify-center px-4">
              <div className={`grid gap-3 sm:gap-4 ${settings?.dashboardWebsiteLink ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border hover:border-blue-200 transition-colors">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Box className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  </div>
                  <p className="mt-2 text-xs sm:text-sm font-medium">المنتجات</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border hover:border-green-200 transition-colors">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                  </div>
                  <p className="mt-2 text-xs sm:text-sm font-medium">المخزون</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border hover:border-purple-200 transition-colors">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                  </div>
                  <p className="mt-2 text-xs sm:text-sm font-medium">الطلبات</p>
                </div>
                {settings?.dashboardWebsiteLink && (
                  <a
                    href={settings.dashboardWebsiteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 transition-colors cursor-pointer block hover:scale-105 transform duration-200"
                    title="زيارة الموقع"
                  >
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                      <Globe className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="mt-2 text-sm font-medium">الموقع</p>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;