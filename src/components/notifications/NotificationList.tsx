import React from "react";
import NotificationItem, { Notification } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Bell } from "lucide-react";

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string, link?: string) => void;
  onMarkAllAsRead: () => void;
  onViewAll: () => void;
  onRemove?: (id: string) => void;
  loading?: boolean;
}

const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll,
  onRemove,
  loading = false,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-full max-w-sm bg-white rounded-lg shadow-lg border overflow-hidden">
      <div className="p-3 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-lg">الإشعارات</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllAsRead}
            className="text-xs h-8 px-2"
          >
            <Check className="h-4 w-4 ml-1" />
            تعيين الكل كمقروء
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Bell className="h-8 w-8 mb-2 text-gray-300" />
            <p>لا توجد إشعارات جديدة</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onRemove={onRemove}
            />
          ))
        )}
      </ScrollArea>

      <div className="p-3 border-t bg-gray-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewAll}
          className="w-full text-sm"
        >
          عرض كل الإشعارات
        </Button>
      </div>
    </div>
  );
};

export default NotificationList;