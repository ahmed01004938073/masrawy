import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Home,
  ShoppingBag
} from 'lucide-react';
import { getSiteSettings } from '@/services/siteSettingsService';
import { Link } from 'react-router-dom';

interface StoreClosureProps {
  allowNavigation?: boolean;
}

const StoreClosure: React.FC<StoreClosureProps> = ({ allowNavigation = false }) => {
  const [settings, setSettings] = React.useState<any>(null); // Use loose type or import SiteSettings
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSiteSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="h-10 w-10 text-red-600" />
          </div>

          <Badge variant="destructive" className="text-sm px-4 py-2">
            المتجر مغلق مؤقتاً
          </Badge>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900 font-cairo">
                {settings.closureTitle}
              </h1>

              <div className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto whitespace-pre-line">
                {settings.closureMessage}
              </div>
            </div>

            {/* Closure Dates */}
            {(settings.closureStartDate || settings.closureEndDate) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                {settings.closureStartDate && (
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      بداية الإغلاق: {new Date(settings.closureStartDate).toLocaleString('ar-EG')}
                    </span>
                  </div>
                )}
                {settings.closureEndDate && (
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      متوقع إعادة الفتح: {new Date(settings.closureEndDate).toLocaleString('ar-EG')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Contact Information */}
            {settings.showContactInfo && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">للاستفسارات والدعم:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {settings.contactEmail && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">البريد الإلكتروني</p>
                        <p>{settings.contactEmail}</p>
                      </div>
                    </div>
                  )}

                  {settings.contactPhone && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">رقم الهاتف</p>
                        <p>{settings.contactPhone}</p>
                      </div>
                    </div>
                  )}

                  {settings.contactAddress && (
                    <div className="flex items-center gap-3 text-gray-600 md:col-span-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">العنوان</p>
                        <p>{settings.contactAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {settings.allowBrowsing && (
                <Button variant="outline" size="lg" asChild>
                  <Link to="/products">
                    <ShoppingBag className="h-5 w-5 ml-2" />
                    تصفح المنتجات
                  </Link>
                </Button>
              )}

              {allowNavigation && (
                <Button size="lg" asChild>
                  <Link to="/">
                    <Home className="h-5 w-5 ml-2" />
                    العودة للرئيسية
                  </Link>
                </Button>
              )}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                شكراً لتفهمكم، ونعتذر عن أي إزعاج
              </p>
              {settings.copyrightText && (
                <p className="text-xs text-gray-400 mt-2">
                  {settings.copyrightText}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auto Refresh Notice */}
        {settings.closureEndDate && (
          <div className="text-center">
            <p className="text-sm text-gray-500">
              ستتم إعادة توجيهك تلقائياً عند إعادة فتح المتجر
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreClosure;
