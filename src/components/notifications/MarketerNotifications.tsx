import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, markNotificationAsRead, Notification } from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const MarketerNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // جلب إشعارات المستخدم
  const { data: notifications = [] } = useQuery({
    queryKey: ["marketer-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return getNotifications(user.id);
    },
    refetchInterval: 30000, // إعادة جلب البيانات كل 30 ثانية
  });

  // عدد الإشعارات غير المقروءة
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // تحديث حالة قراءة الإشعار
  const handleNotificationClick = async (notificationId: string) => {
    if (user?.id) {
      await markNotificationAsRead(user.id, notificationId);
      queryClient.invalidateQueries({ queryKey: ["marketer-notifications", user?.id] });
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // تحديد لون الإشعار حسب النوع
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "status":
        return "border-blue-500";
      case "commission":
        return "border-green-500";
      case "system":
        return "border-yellow-500";
      default:
        return "border-gray-300";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">الإشعارات</h3>
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              لا توجد إشعارات
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.read ? "bg-blue-50" : ""
                    }`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className={`border-r-4 pr-3 ${getNotificationColor(notification.type)}`}>
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(notification.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default MarketerNotifications;

