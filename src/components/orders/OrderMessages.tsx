import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Image, Paperclip, Smile, X } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Message,
  addMessage,
  getConversationMessages,
  updateMessageStatus
} from "@/services/messageService";
import { sendNotification } from "@/services/notificationService";



interface OrderMessagesProps {
  orderId: string;
  orderNumber: string;
  marketerId?: string;
  marketerName?: string;
}

const OrderMessages: React.FC<OrderMessagesProps> = ({
  orderId,
  orderNumber,
  marketerId = "m2",
  marketerName = "فاطمة حسن",
}) => {
  const [messages, setMessages] = useState<Message[]>([]);

  // تحميل الرسائل عند بدء التشغيل
  useEffect(() => {
    const loadMessages = async () => {
      const conversationMessages = await getConversationMessages(orderId);
      setMessages(conversationMessages);
    };

    loadMessages();
  }, [orderId]);

  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<{
    id: string;
    file: File;
    previewUrl?: string;
  }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    setIsLoading(true);

    try {
      // Process attachments
      const messageAttachments = attachments.map(attachment => ({
        id: attachment.id,
        type: (attachment.file.type.startsWith('image/') ? 'image' : 'file') as 'image' | 'file',
        url: attachment.previewUrl || '',
        name: attachment.file.name,
        size: attachment.file.size,
      }));

      // إنشاء الرسالة وحفظها في النظام
      const savedMessage = await addMessage({
        senderId: "admin",
        senderName: "مدير النظام",
        senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        content: newMessage.trim(),
        isAdmin: true,
        attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
        orderId: orderId
      });

      // تحديث الرسائل المحلية
      setMessages(prev => [...prev, savedMessage]);
      setNewMessage("");
      setAttachments([]);
      setShowEmojiPicker(false);
      toast.success("تم إرسال الرسالة بنجاح");

      // إرسال إشعار للمسوق
      if (marketerId) {
        sendNotification(
          marketerId,
          "رسالة جديدة",
          `رسالة جديدة بخصوص الطلب رقم ${orderNumber}`,
          "info",
          `/orders`
        );
        toast.info(`تم إرسال إشعار إلى ${marketerName} بالرد الجديد`);
      }

      // تحديث حالة الرسالة إلى "تم التسليم" بعد ثانيتين
      setTimeout(async () => {
        await updateMessageStatus(savedMessage.id, 'delivered');
        setMessages(prev =>
          prev.map(msg =>
            msg.id === savedMessage.id ? { ...msg, status: 'delivered' } : msg
          )
        );
      }, 2000);
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments = Array.from(files).map(file => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      let previewUrl;

      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      return { id, file, previewUrl };
    });

    setAttachments(prev => [...prev, ...newAttachments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const filtered = prev.filter(attachment => attachment.id !== id);

      // Revoke object URLs to prevent memory leaks
      const removed = prev.find(attachment => attachment.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }

      return filtered;
    });
  };

  return (
    <Card className="border-2 mt-6">
      <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
        <CardTitle className="text-xl flex items-center">
          <MessageSquare className="ml-3 h-5 w-5 text-primary-500" />
          <span className="font-cairo">رسائل المسوق</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-lg font-semibold">لا توجد رسائل</p>
              <p className="text-sm">ابدأ محادثة جديدة مع المسوق</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isAdmin ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`flex max-w-[80%] ${message.isAdmin
                    ? "bg-primary-100 text-primary-900"
                    : "bg-gray-100 text-gray-900"
                    } rounded-lg p-3`}
                >
                  {message.isAdmin && (
                    <Avatar className="h-8 w-8 ml-3 flex-shrink-0">
                      <AvatarImage src={message.senderAvatar} />
                      <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{message.senderName}</span>
                      <span className="text-xs text-gray-500 mr-2">
                        {new Date(message.timestamp).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {message.content && (
                      <p className="mt-1 text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map(attachment => (
                          <div key={attachment.id} className="rounded-md overflow-hidden border border-gray-200">
                            {attachment.type === 'image' ? (
                              <div className="relative">
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="max-w-full rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(attachment.url, '_blank')}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center p-2 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                <Paperclip className="h-4 w-4 ml-2 text-gray-500" />
                                <span className="text-sm truncate">{attachment.name}</span>
                                <span className="text-xs text-gray-500 mr-2">
                                  {(attachment.size && attachment.size < 1024 * 1024)
                                    ? `${Math.round(attachment.size / 1024)} KB`
                                    : `${Math.round((attachment.size || 0) / (1024 * 1024))} MB`}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {message.isAdmin && message.status && (
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-gray-500">
                          {message.status === 'sent' && 'تم الإرسال'}
                          {message.status === 'delivered' && 'تم التسليم'}
                          {message.status === 'read' && 'تمت القراءة'}
                        </span>
                      </div>
                    )}
                  </div>
                  {!message.isAdmin && (
                    <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
                      <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="border-t p-3 bg-gray-50 rounded-b-lg flex-col relative">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="w-full mb-3 p-2 bg-white rounded-md border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">المرفقات ({attachments.length})</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setAttachments([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map(attachment => (
                <div key={attachment.id} className="relative group">
                  {attachment.previewUrl ? (
                    <div className="w-16 h-16 rounded-md overflow-hidden border">
                      <img
                        src={attachment.previewUrl}
                        alt={attachment.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center">
                      <Paperclip className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <button
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="flex w-full">
          <div className="flex items-center ml-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>إضافة مرفق</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              multiple
            />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-5 w-5 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>إضافة مشاعر</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 ml-2 resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!newMessage.trim() && attachments.length === 0)}
            className="h-full"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Emoji picker placeholder - in a real app, you would integrate an emoji picker library */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4 bg-white border rounded-lg shadow-lg p-2 z-10">
            <div className="grid grid-cols-8 gap-1">
              {["😀", "😄", "😍", "😔", "😡", "👍", "👏", "💪",
                "🔥", "🎉", "🚀", "💯", "💡", "🎁", "🙏", "🤔"].map((emoji, index) => (
                  <button
                    key={index}
                    className="text-xl p-1 hover:bg-gray-100 rounded"
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default OrderMessages;

