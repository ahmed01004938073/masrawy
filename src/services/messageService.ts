// خدمة الرسائل والدردشة (Refactored to use API)
import { API_URL } from "@/config/apiConfig";

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isAdmin: boolean;
  status?: 'sent' | 'delivered' | 'read';
  attachments?: {
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: number;
  }[];
  orderId?: string; // للرسائل المتعلقة بطلب معين
  productId?: string; // للرسائل المتعلقة بمنتج معين
  archived?: boolean; // هل الرسالة مؤرشفة
  archivedAt?: string; // تاريخ الأرشفة
}

export interface Conversation {
  id: string;
  type: 'order' | 'product' | 'general';
  orderId?: string;
  productId?: string;
  marketerId: string;
  marketerName: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

const fetchJson = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return await res.json();
};

const getStoredMessages = async (): Promise<Message[]> => {
  try {
    const data = await fetchJson(`${API_URL}/kv/messages`);
    return data || [];
  } catch {
    return [];
  }
};

const saveStoredMessages = async (items: Message[]) => {
  await fetchJson(`${API_URL}/kv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'messages', value: items })
  });
};

const getStoredConversations = async (): Promise<Conversation[]> => {
  try {
    const data = await fetchJson(`${API_URL}/kv/conversations`);
    return data || [];
  } catch {
    return [];
  }
};

const saveStoredConversations = async (items: Conversation[]) => {
  await fetchJson(`${API_URL}/kv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'conversations', value: items })
  });
};


// الحصول على جميع الرسائل
export const getAllMessages = async (): Promise<Message[]> => {
  return await getStoredMessages();
};

// حفظ الرسائل
export const saveMessages = async (messages: Message[]): Promise<void> => {
  await saveStoredMessages(messages);
};

// الحصول على رسائل محادثة معينة
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  const allMessages = await getAllMessages();
  return allMessages.filter(msg =>
    (msg.orderId === conversationId) ||
    (msg.productId === conversationId) ||
    (msg.senderId === conversationId)
  );
};

// إضافة رسالة جديدة
export const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
  const newMessage: Message = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    status: 'sent'
  };

  const allMessages = await getAllMessages();
  allMessages.push(newMessage);
  await saveMessages(allMessages);

  // إضافة إشعار للمسوق إذا كانت الرسالة من الإدارة
  if (message.isAdmin && message.orderId) {
    await addNotificationForMessage(newMessage); // Note: this must be async now
  }

  return newMessage;
};

// تحديث حالة الرسالة
export const updateMessageStatus = async (messageId: string, status: 'sent' | 'delivered' | 'read'): Promise<void> => {
  const allMessages = await getAllMessages();
  const updatedMessages = allMessages.map(msg =>
    msg.id === messageId ? { ...msg, status } : msg
  );
  await saveMessages(updatedMessages);
};

// إضافة إشعار للمسوق عند وصول رسالة جديدة
const addNotificationForMessage = async (message: Message): Promise<void> => {
  // استيراد دالة الإشعارات
  // Using dynamic import or direct logic if possible
  // To avoid circular dependencies, ideally we move shared types or use API directly here too.
  // But for now, we'll try to use the refactored localStorageService which uses API.
  const { addNotification, getOrderById } = require('./orderService');

  if (message.orderId) {
    // We need marketerId. 
    // getOrderMarketerId was using localStorageService.getOrders.
    // We should use getOrderById (async now).

    let marketerId = 'admin';
    if (message.senderId === 'admin') {
      const order = await getOrderById(message.orderId);
      marketerId = order?.marketerId || '';
    }

    if (marketerId) {
      await addNotification({
        id: `msg-not-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: marketerId,
        title: "رسالة جديدة",
        message: `رسالة جديدة بخصوص الطلب رقم ${message.orderId}`,
        type: "system",
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  }
};

// الحصول على معرف المسوق من الطلب (Deprecated/Internal helper refactored above)

// الحصول على جميع المحادثات
export const getAllConversations = async (): Promise<Conversation[]> => {
  return await getStoredConversations();
};

// إنشاء محادثة جديدة
export const createConversation = async (conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation> => {
  const newConversation: Conversation = {
    ...conversation,
    id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const allConversations = await getAllConversations();
  allConversations.push(newConversation);
  await saveStoredConversations(allConversations);

  return newConversation;
};

// تحديث محادثة
export const updateConversation = async (conversationId: string, updates: Partial<Conversation>): Promise<void> => {
  const allConversations = await getAllConversations();
  const updatedConversations = allConversations.map(conv =>
    conv.id === conversationId
      ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
      : conv
  );
  await saveStoredConversations(updatedConversations);
};

// أرشفة رسائل الطلب عند اكتماله
export const archiveOrderMessages = async (orderId: string): Promise<void> => {
  const allMessages = await getAllMessages();
  const updatedMessages = allMessages.map(msg =>
    msg.orderId === orderId
      ? { ...msg, archived: true, archivedAt: new Date().toISOString() }
      : msg
  );
  await saveMessages(updatedMessages);
};

// الحصول على الرسائل النشطة فقط (غير المؤرشفة)
export const getActiveMessages = async (orderId: string): Promise<Message[]> => {
  const allMessages = await getAllMessages();
  return allMessages.filter(msg =>
    msg.orderId === orderId && !msg.archived
  );
};

// الحصول على الرسائل المؤرشفة
export const getArchivedMessages = async (orderId: string): Promise<Message[]> => {
  const allMessages = await getAllMessages();
  return allMessages.filter(msg =>
    msg.orderId === orderId && msg.archived
  );
};

// إحصائيات الرسائل
export const getMessageStats = async () => {
  const allMessages = await getAllMessages();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    total: allMessages.length,
    active: allMessages.filter(msg => !msg.archived).length,
    archived: allMessages.filter(msg => msg.archived).length,
    thisWeek: allMessages.filter(msg => new Date(msg.timestamp) > oneWeekAgo).length,
    thisMonth: allMessages.filter(msg => new Date(msg.timestamp) > oneMonthAgo).length,
    byMarketer: allMessages.reduce((acc, msg) => {
      if (!msg.isAdmin) {
        acc[msg.senderId] = (acc[msg.senderId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  };
};

// حذف جميع رسائل طلب معين (عند حذف الطلب من الأرشيف)
export const deleteOrderMessages = async (orderId: string): Promise<number> => {
  const allMessages = await getAllMessages();
  const messagesToKeep = allMessages.filter(msg => msg.orderId !== orderId);
  const deletedCount = allMessages.length - messagesToKeep.length;

  await saveMessages(messagesToKeep);
  return deletedCount;
};

// حذف رسائل متعددة الطلبات (عند حذف مجموعة من الأرشيف)
export const deleteMultipleOrderMessages = async (orderIds: string[]): Promise<number> => {
  const allMessages = await getAllMessages();
  const messagesToKeep = allMessages.filter(msg => !orderIds.includes(msg.orderId || ''));
  const deletedCount = allMessages.length - messagesToKeep.length;

  await saveMessages(messagesToKeep);
  return deletedCount;
};

// تنظيف الرسائل القديمة (اختياري)
export const cleanOldMessages = async (olderThanDays: number = 180): Promise<number> => {
  const allMessages = await getAllMessages();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const messagesToKeep = allMessages.filter(msg =>
    new Date(msg.timestamp) > cutoffDate || !msg.archived
  );

  const deletedCount = allMessages.length - messagesToKeep.length;
  await saveMessages(messagesToKeep);

  return deletedCount;
};

// إحصائيات التوفير في المساحة
export const getStorageStats = async () => {
  const allMessages = await getAllMessages();
  const messageSize = JSON.stringify(allMessages).length;
  const averageMessageSize = messageSize / allMessages.length || 0;

  return {
    totalMessages: allMessages.length,
    totalSizeBytes: messageSize,
    totalSizeKB: Math.round(messageSize / 1024),
    averageMessageSizeBytes: Math.round(averageMessageSize),
    estimatedSavingPerOrder: Math.round(averageMessageSize * 5) // متوسط 5 رسائل لكل طلب
  };
};

