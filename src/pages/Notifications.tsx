import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, Bell, MessageSquare, ShoppingCart, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Importamos el tipo Notification de NotificationItem para mantener consistencia
import NotificationItem, { Notification as NotificationType } from "@/components/notifications/NotificationItem";

// بيانات الإشعارات الواقعية
const mockNotifications: NotificationType[] = [
  {
    id: "1",
    type: "message",
    title: "رسالة جديدة في دردشة المنتج",
    message: "المسوق أحمد محمود: هل يتوفر هذا المنتج بمقاسات أخرى؟",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 دقائق مضت
    link: "/product/123",
    sender: {
      id: "m3",
      name: "أحمد محمود",
    },
    visibleTo: ["admin", "manager"],
  },
  {
    id: "2",
    type: "message",
    title: "رد على استفسار العميل",
    message: "المسوق فاطمة حسن: نعم، المنتج متوفر باللون الأزرق وسنقوم بتوصيله خلال يومين",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 دقيقة مضت
    link: "/product/123",
    sender: {
      id: "m2",
      name: "فاطمة حسن",
    },
    visibleTo: ["admin", "m1"],
  },
  {
    id: "3",
    type: "message",
    title: "تنبيه: منتج على وشك النفاد",
    message: "المنتج 'ساعة ذكية XYZ' متبقي منه 3 قطع فقط في المخزن",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // ساعتان مضت
    link: "/warehouse",
    sender: {
      id: "system",
      name: "النظام",
    },
    visibleTo: ["admin"],
  },
  {
    id: "4",
    type: "message",
    title: "رد على استفسارك حول المنتج",
    message: "المسوق محمد علي: شكراً للرد، سأقوم بإبلاغ العميل بتوفر المنتج",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 ساعات مضت
    link: "/product/456",
    sender: {
      id: "m1",
      name: "محمد علي",
    },
    visibleTo: ["admin"],
  },
  {
    id: "5",
    type: "message",
    title: "رسالة جديدة من مسوق",
    message: "أريد معرفة مواصفات المنتج رقم #789 بالتفصيل",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // يوم مضى
    link: "/product/789",
    sender: {
      id: "m3",
      name: "أحمد محمود",
    },
    visibleTo: ["admin"],
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Cargar notificaciones (simulando una llamada a API)
  useEffect(() => {
    // Filtrar notificaciones según el دور del usuario
    const filteredNotifications = mockNotifications.filter(notification => {
      // Admin puede ver todas las notificaciones
      if (user?.role === "admin") return true;

      // Verificar si la notificación es visible para este usuario
      return notification.visibleTo.includes(user?.id || "") ||
             notification.visibleTo.includes("all");
    });

    setNotifications(filteredNotifications);
  }, [user]);

  // Filtrar notificaciones según la pestaña activa
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.isRead;
    return notification.type === activeTab;
  });

  // Manejar clic en una notificación
  const handleNotificationClick = (notification: NotificationType) => {
    // Marcar como leída
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      // En una aplicación real, aquí se llamaría a una API o se actualizaría localStorage
      // markNotificationAsRead(notification.id);
      // queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }

    // Navegar al enlace correspondiente
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Eliminar una notificación
  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast.success("تم إزالة الإشعار");
  };

  // Marcar todas las notificaciones como leídas
  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );

    // En una aplicación real, aquí se llamaría a una API o se actualizaría localStorage
    toast.success("تم تعيين جميع الإشعارات كمقروءة");
  };

  // Obtener icono según el tipo de notificación
  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "order":
        return <ShoppingCart className="h-5 w-5 text-green-500" />;
      case "system":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Formatear fecha relativa
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: arEG,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">الإشعارات</h1>
            <p className="text-muted-foreground mt-1">
              عرض وإدارة جميع الإشعارات الخاصة بك
            </p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <Check className="ml-2 h-4 w-4" />
              تعيين الكل كمقروء
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="unread">غير المقروءة</TabsTrigger>
                <TabsTrigger value="message">الرسائل</TabsTrigger>
                <TabsTrigger value="order">الطلبات</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 opacity-50 mb-4" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleNotificationClick}
                    onRemove={handleRemoveNotification}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
