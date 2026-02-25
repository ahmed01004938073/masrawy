import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import NotificationList from "./NotificationList";
import { Notification } from "./NotificationItem";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// بيانات الإشعارات الواقعية
const mockNotifications: Notification[] = [
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

const NotificationButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useOnClickOutside(ref, () => setIsOpen(false));

  // تحميل حالة قراءة الإشعارات من التخزين المحلي
  const loadReadStatus = () => {
    try {
      const savedReadStatus = localStorage.getItem('notification_read_status');
      return savedReadStatus ? JSON.parse(savedReadStatus) : {};
    } catch (error) {
      console.error('Error loading notification read status:', error);
      return {};
    }
  };

  // حفظ حالة قراءة الإشعارات في التخزين المحلي
  const saveReadStatus = (readStatus: Record<string, boolean>) => {
    try {
      localStorage.setItem('notification_read_status', JSON.stringify(readStatus));
    } catch (error) {
      console.error('Error saving notification read status:', error);
    }
  };

  // Filter notifications based on user role and permissions
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // تحميل حالة القراءة المحفوظة
      const readStatus = loadReadStatus();

      // تصفية الإشعارات بناءً على دور المستخدم والصلاحيات
      const filteredNotifications = mockNotifications.filter(notification => {
        // المسؤول يمكنه رؤية جميع الإشعارات
        if (user?.role === "admin") return true;

        // التحقق مما إذا كان الإشعار مرئيًا لهذا المستخدم
        return notification.visibleTo.includes(user?.id || "") ||
               notification.visibleTo.includes("all");
      }).map(notification => ({
        ...notification,
        // تطبيق حالة القراءة المحفوظة
        isRead: readStatus[notification.id] || notification.isRead
      }));

      setNotifications(filteredNotifications);
      setLoading(false);
    }, 500);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string, link?: string) => {
    // تحديث الحالة المحلية
    setNotifications(prev => {
      const updatedNotifications = prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      );

      // حفظ حالة القراءة في التخزين المحلي
      const readStatus = loadReadStatus();
      readStatus[id] = true;
      saveReadStatus(readStatus);

      return updatedNotifications;
    });

    // عرض إشعار التأكيد
    toast.success("تم تعيين الإشعار كمقروء", {
      duration: 1500,
      position: "bottom-left"
    });

    // إذا كان هناك رابط، الانتقال إلى الصفحة المقابلة
    if (link) {
      setIsOpen(false); // إغلاق قائمة الإشعارات
      navigate(link);
    }
  };

  const handleRemoveNotification = (id: string) => {
    // تحديث الحالة المحلية
    setNotifications(prev => {
      const updatedNotifications = prev.filter(notification => notification.id !== id);
      
      // حفظ حالة القراءة في التخزين المحلي
      const readStatus = loadReadStatus();
      delete readStatus[id];
      saveReadStatus(readStatus);

      return updatedNotifications;
    });

    // عرض إشعار التأكيد
    toast.success("تم إزالة الإشعار", {
      duration: 1500,
      position: "bottom-left"
    });
  };

  const handleMarkAllAsRead = () => {
    // تحديث الحالة المحلية
    setNotifications(prev => {
      const updatedNotifications = prev.map(notification => ({ ...notification, isRead: true }));

      // حفظ حالة القراءة في التخزين المحلي
      const readStatus = loadReadStatus();
      prev.forEach(notification => {
        readStatus[notification.id] = true;
      });
      saveReadStatus(readStatus);

      return updatedNotifications;
    });

    // عرض إشعار التأكيد
    toast.success("تم تعيين جميع الإشعارات كمقروءة", {
      duration: 1500,
      position: "bottom-left"
    });
  };

  const handleViewAll = () => {
    // Navigate to notifications page
    setIsOpen(false);
    navigate("/notifications");
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="icon"
        className="relative h-10 w-10 bg-primary-100 hover:bg-primary-200 border-primary-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-primary-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50">
          <NotificationList
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onViewAll={handleViewAll}
            onRemove={handleRemoveNotification}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationButton;