import React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import SocialLinks from "@/components/store/SocialLinks";
import { getSiteSettings } from "@/services/siteSettingsService";
import { useEffect } from "react";

const Contact = () => {
  const navigate = useNavigate();

  const [contactInfo, setContactInfo] = useState([
    {
      icon: Phone,
      title: "الهاتف",
      content: "+20 123 456 7890",
      description: "متاح من 9 صباحاً حتى 6 مساءً، الأحد إلى الخميس"
    },
    {
      icon: Mail,
      title: "البريد الإلكتروني",
      content: "support@maa5zny.com",
      description: "سنتواصل معك خلال 24 ساعة كحد أقصى"
    },
    {
      icon: MapPin,
      title: "العنوان",
      content: "القاهرة، مصر",
      description: "مكتبنا الرئيسي"
    },
    {
      icon: Clock,
      title: "ساعات العمل",
      content: "الأحد - الخميس: 9:00 صباحاً - 6:00 مساءً",
      description: "الجمعة والسبت: إجازة رسمية"
    }
  ]);

  useEffect(() => {
    const loadContactInfo = async () => {
      const settings = await getSiteSettings();

      setContactInfo([
        {
          icon: Phone,
          title: "الهاتف",
          content: settings.contactPhone || "+20 123 456 7890",
          description: "متاح للتواصل المباشر"
        },
        {
          icon: Mail,
          title: "البريد الإلكتروني",
          content: settings.contactEmail || "support@example.com",
          description: "سنتواصل معك خلال 24 ساعة كحد أقصى"
        },
        {
          icon: MapPin,
          title: "العنوان",
          content: settings.contactAddress || "القاهرة، مصر",
          description: "مكتبنا الرئيسي"
        },
        {
          icon: Clock,
          title: "ساعات العمل",
          content: settings.footerText || "الأحد - الخميس: 9:00 صباحاً - 6:00 مساءً",
          description: "الجمعة والسبت: إجازة رسمية"
        }
      ]);

      // Add Google Maps embed if exists
      if (settings.googleMapsEmbed) {
        // This logic is missing from current Contact.tsx, user might want it soon
      }
    };

    loadContactInfo();
    window.addEventListener('storage', loadContactInfo);
    return () => window.removeEventListener('storage', loadContactInfo);
  }, []);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">تواصل معنا</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            العودة
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>معلومات الاتصال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => {
                const IconComponent = info.icon;
                return (
                  <div key={index} className="flex gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{info.title}</h3>
                      <p className="text-sm">{info.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <SocialLinks />

            <MapDisplay />

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h3 className="font-semibold mb-2">طرق التواصل السريع:</h3>
              <p className="text-sm">
                يمكنك التواصل معنا مباشرة عبر البريد الإلكتروني أو الواتساب للحصول على رد سريع.
                نحن متواجدون لخدمتك خلال ساعات العمل المذكورة أعلاه.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


const MapDisplay = () => {
  const [mapEmbed, setMapEmbed] = useState<string>("");

  useEffect(() => {
    const loadMap = async () => {
      const settings = await getSiteSettings();
      if (settings?.googleMapsEmbed) {
        setMapEmbed(settings.googleMapsEmbed);
      }
    };
    loadMap();
    window.addEventListener('storage', loadMap);
    return () => window.removeEventListener('storage', loadMap);
  }, []);

  if (!mapEmbed) return null;

  return (
    <div className="mt-8">
      <h3 className="font-semibold mb-4 text-lg">موقعنا على الخريطة</h3>
      <div className="rounded-lg overflow-hidden border shadow-sm aspect-video w-full" dangerouslySetInnerHTML={{ __html: mapEmbed }} />
    </div>
  );
};

export default Contact;
