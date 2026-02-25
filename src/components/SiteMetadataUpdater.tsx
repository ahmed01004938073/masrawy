import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSiteSettings } from '@/services/siteSettingsService';

const SiteMetadataUpdater = () => {
    const { data: settings } = useQuery({
        queryKey: ['site-settings'],
        queryFn: getSiteSettings,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    useEffect(() => {
        if (settings) {
            // Update page title
            document.title = settings.siteName || "متجر الكتروني";

            // Update favicon
            const favicon = document.getElementById('favicon') as HTMLLinkElement;
            if (favicon && settings.favicon) {
                favicon.href = settings.favicon;
            }
        }
    }, [settings]);

    return null; // This component doesn't render anything
};

export default SiteMetadataUpdater;
