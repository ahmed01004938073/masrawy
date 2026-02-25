import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/store/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/contexts/store/NotificationsContext";
import { Bell, Trash2, CheckCheck } from "lucide-react";

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const formatTime = (date: Date | string | number) => {
    const now = new Date();
    const dateObj = date instanceof Date ? date : new Date(date);
    const diff = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diff < 60) return "الآن";
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(notificationId => notificationId !== id)
        : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    selectedNotifications.forEach(id => clearNotification(id));
    setSelectedNotifications([]);
  };

  const handleMarkSelectedAsRead = () => {
    selectedNotifications.forEach(id => markAsRead(id));
    setSelectedNotifications([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl pb-32 md:pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">الإشعارات</h1>
              <p className="text-muted-foreground">
                {notifications.length > 0
                  ? `لديك ${notifications.length} إشعار${notifications.length > 1 ? 'ات' : ''}`
                  : "لا توجد إشعارات جديدة"}
              </p>
            </div>
            {selectedNotifications.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                >
                  <CheckCheck className="w-4 h-4 ml-2" />
                  تعليم كمقروء
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف المحدد
                </Button>
              </div>
            )}
          </div>
        </div>

        <Card className="shadow-elegant">
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد إشعارات</h3>
                  <p>ستظهر الإشعارات هنا عندما تتلقى تحديثات</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b cursor-pointer transition-colors hover:bg-accent/50 ${!notif.read ? "bg-primary/5" : ""
                        } ${selectedNotifications.includes(notif.id) ? "bg-accent" : ""}`}
                      onClick={() => {
                        if (selectedNotifications.length > 0) {
                          handleSelectNotification(notif.id);
                        } else {
                          // Requirement: Mark as read (Delete) and Navigate if link exists
                          markAsRead(notif.id);
                          if (notif.link) {
                            navigate(notif.link);
                          }
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Icon/Color Indicator */}
                        <div className={`mt-1 p-2 rounded-full ${notif.type === 'success' ? 'bg-green-100 text-green-600' :
                          notif.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                            notif.type === 'error' ? 'bg-red-100 text-red-600' :
                              'bg-blue-100 text-blue-600'
                          }`}>
                          {notif.type === 'success' ? <CheckCheck className="w-4 h-4" /> :
                            notif.type === 'warning' ? <Bell className="w-4 h-4" /> : // Warning icon ideally
                              notif.type === 'error' ? <Bell className="w-4 h-4" /> :   // Error icon
                                <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{notif.title}</h3>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(notif.timestamp)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notif.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {notifications.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              تعليم الكل كمقروء
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
