import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSiteSettings } from '@/services/siteSettingsService';

/**
 * مكون لتحديث الـ Favicon ديناميكياً من إعدادات الموقع
 */
export function DynamicFavicon() {
    const { data: settings } = useQuery({
        queryKey: ['site-settings'],
        queryFn: getSiteSettings,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    useEffect(() => {
        if (settings?.favicon) {
            // إزالة جميع favicon links القديمة
            const oldLinks = document.querySelectorAll('link[rel*="icon"]');
            oldLinks.forEach(link => link.remove());

            // إنشاء favicon جديد بتاريخ فريد لتجنب الـ cache
            const timestamp = new Date().getTime();
            let faviconUrl = settings.favicon;

            // Helper to check if URL is a placeholder or empty
            const isPlaceholder = (url: string) => !url || url.includes('placehold.co');

            // Logic:
            // 1. Try settings.favicon. If it's a placeholder...
            // 2. Try settings.logo. If it's a placeholder...
            // 3. Fallback to /favicon.ico

            if (isPlaceholder(faviconUrl)) {
                if (settings.logo && !isPlaceholder(settings.logo)) {
                    faviconUrl = settings.logo;
                } else {
                    faviconUrl = '/favicon.svg';
                }
            }

            // Add timestamp to prevent caching
            // Only add timestamp if it's not a data URL (base64)
            if (!faviconUrl.startsWith('data:')) {
                faviconUrl = `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
            }

            // إضافة favicon بصيغ متعددة للتوافق مع جميع المتصفحات
            const sizes = ['16x16', '32x32', '48x48', '64x64'];

            sizes.forEach(size => {
                const link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/png';
                link.sizes = size;
                link.href = faviconUrl;
                document.head.appendChild(link);
            });

            // إضافة shortcut icon للمتصفحات القديمة
            const shortcutLink = document.createElement('link');
            shortcutLink.rel = 'shortcut icon';
            shortcutLink.type = 'image/png';
            shortcutLink.href = faviconUrl;
            document.head.appendChild(shortcutLink);

            console.log('🔵 Favicon updated:', faviconUrl);
        }
    }, [settings?.favicon, settings?.logo]);

    // هذا المكون لا يعرض شيء
    return null;
}
