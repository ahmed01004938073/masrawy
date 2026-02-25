// خدمة Webhook للتكامل مع المتجر الإلكتروني

import { registerMarketerFromStore, StoreMarketerData } from './marketerIntegrationService';

// واجهة طلب Webhook
export interface WebhookRequest {
  event: 'marketer.registered' | 'marketer.updated' | 'marketer.deleted';
  data: StoreMarketerData;
  timestamp: string;
  signature?: string; // للتحقق من صحة الطلب
  source: 'store' | 'admin';
}

// واجهة استجابة Webhook
export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// التحقق من صحة التوقيع (محاكاة)
const verifySignature = (payload: string, signature: string): boolean => {
  // في التطبيق الحقيقي، يتم التحقق من التوقيع باستخدام مفتاح سري
  // هنا نقوم بمحاكاة التحقق
  const expectedSignature = `sha256=${Buffer.from(payload).toString('base64')}`;
  return signature === expectedSignature;
};

// معالج webhook لتسجيل المسوقين
export const handleMarketerWebhook = async (request: WebhookRequest): Promise<WebhookResponse> => {
  try {
    console.log('🔗 استقبال webhook:', request);

    // التحقق من صحة الطلب
    if (!request.event || !request.data) {
      return {
        success: false,
        message: 'بيانات الطلب غير صالحة',
        error: 'Missing event or data'
      };
    }

    // التحقق من التوقيع (في البيئة الحقيقية)
    if (request.signature) {
      const payload = JSON.stringify(request.data);
      if (!verifySignature(payload, request.signature)) {
        return {
          success: false,
          message: 'فشل في التحقق من صحة الطلب',
          error: 'Invalid signature'
        };
      }
    }

    // معالجة الأحداث المختلفة
    switch (request.event) {
      case 'marketer.registered':
        return await handleMarketerRegistration(request.data);

      case 'marketer.updated':
        return await handleMarketerUpdate(request.data);

      case 'marketer.deleted':
        return await handleMarketerDeletion(request.data);

      default:
        return {
          success: false,
          message: 'نوع الحدث غير مدعوم',
          error: `Unsupported event: ${request.event}`
        };
    }

  } catch (error) {
    console.error('❌ خطأ في معالجة webhook:', error);

    return {
      success: false,
      message: 'حدث خطأ أثناء معالجة الطلب',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// معالجة تسجيل مسوق جديد
const handleMarketerRegistration = async (data: StoreMarketerData): Promise<WebhookResponse> => {
  console.log('📝 معالجة تسجيل مسوق جديد:', data);

  const result = await registerMarketerFromStore(data);

  return {
    success: result.success,
    message: result.message,
    data: result.marketer,
    error: result.error
  };
};

// معالجة تحديث بيانات مسوق
const handleMarketerUpdate = async (data: StoreMarketerData): Promise<WebhookResponse> => {
  console.log('✏️ معالجة تحديث بيانات مسوق:', data);

  // Note: This is a simulation/placeholder function
  // In production, implement updateMarketerFromStore in marketerIntegrationService

  return {
    success: true,
    message: 'تم تحديث بيانات المسوق بنجاح (محاكاة)',
    data: data
  };
};

// معالجة حذف مسوق
const handleMarketerDeletion = async (data: StoreMarketerData): Promise<WebhookResponse> => {
  console.log('🗑️ معالجة حذف مسوق:', data);

  // Note: This is a simulation/placeholder function
  // In production, implement deleteMarketerFromStore in marketerIntegrationService

  return {
    success: true,
    message: 'تم حذف المسوق بنجاح (محاكاة)',
    data: data
  };
};

// محاكاة استقبال webhook من المتجر الإلكتروني
export const simulateWebhookFromStore = async (marketerData: StoreMarketerData): Promise<WebhookResponse> => {
  console.log('🎭 محاكاة webhook من المتجر الإلكتروني...');

  const webhookRequest: WebhookRequest = {
    event: 'marketer.registered',
    data: marketerData,
    timestamp: new Date().toISOString(),
    signature: `sha256=${Buffer.from(JSON.stringify(marketerData)).toString('base64')}`,
    source: 'store'
  };

  // محاكاة تأخير الشبكة
  await new Promise(resolve => setTimeout(resolve, 500));

  return handleMarketerWebhook(webhookRequest);
};

// إعداد webhook endpoint (للاستخدام مع Express.js)
export const setupWebhookEndpoint = (app: any) => {
  app.post('/api/webhooks/marketer', async (req: any, res: any) => {
    try {
      const webhookRequest: WebhookRequest = {
        event: req.body.event,
        data: req.body.data,
        timestamp: req.body.timestamp || new Date().toISOString(),
        signature: req.headers['x-signature'],
        source: req.body.source || 'store'
      };

      const response = await handleMarketerWebhook(webhookRequest);

      if (response.success) {
        res.status(200).json(response);
      } else {
        res.status(400).json(response);
      }

    } catch (error) {
      console.error('خطأ في webhook endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('✅ تم إعداد webhook endpoint: POST /api/webhooks/marketer');
};

// دالة اختبار التكامل
export const testIntegration = async (): Promise<void> => {
  console.log('🧪 اختبار التكامل...');

  const testMarketer: StoreMarketerData = {
    name: "مسوق تجريبي",
    phone: "01000000000",
    email: "test.marketer@example.com",
    storeId: "test-store-123",
    registrationDate: new Date().toISOString(),
    address: "عنوان تجريبي"
  };

  try {
    const result = await simulateWebhookFromStore(testMarketer);

    if (result.success) {
      console.log('✅ نجح اختبار التكامل:', result.message);
    } else {
      console.log('❌ فشل اختبار التكامل:', result.message);
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار التكامل:', error);
  }
};

// إحصائيات Webhook
export const getWebhookStats = () => {
  // يمكن إضافة تتبع إحصائيات Webhook هنا
  return {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastRequestTime: null,
    averageResponseTime: 0
  };
};
