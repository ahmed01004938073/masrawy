import React from "react";
import { formatDistanceToNow } from "date-fns";
import { arEG } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MessageSquare, ShoppingCart, Bell, User, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export type NotificationType = "message" | "order" | "system" | "user";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
  user_id?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string, link?: string) => void;
  onRemove?: (id: string) => void;
  onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onRemove,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Mark notification as read
    if (!notification.read) {
      onMarkAsRead(notification.id, notification.link);
    } else if (notification.link) {
      // إذا كان مقروءًا بالفعل ولكن لديه رابط، الانتقال مباشرة
      navigate(notification.link);
    }

    // Execute custom onClick if provided
    if (onClick) {
      onClick();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(notification.id);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "message":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "order":
        return <ShoppingCart className="h-5 w-5 text-green-500" />;
      case "user":
        return <User className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: arEG,
  });

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b",
        !notification.read && "bg-blue-50"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">{getIcon()}</div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h4 className={cn("text-sm font-semibold", !notification.read && "font-bold")}>
            {notification.title}
          </h4>
          <span className="text-xs text-gray-500 whitespace-nowrap mr-2">{timeAgo}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        {onRemove && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleRemove}
            >
              <Check className="h-3 w-3 ml-1" />
              تم
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        {!notification.read && (
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;