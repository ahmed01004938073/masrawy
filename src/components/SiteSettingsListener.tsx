import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const SiteSettingsListener = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Create BroadcastChannel
        const channel = new BroadcastChannel('site_settings_channel');

        // Listen for messages
        channel.onmessage = (event) => {
            if (event.data === 'updated') {
                console.log('Site settings updated in another tab, invalidating queries...');
                // Invalidate queries to trigger re-fetch
                queryClient.invalidateQueries({ queryKey: ['site-settings'] });
            }
        };

        return () => {
            channel.close();
        };
    }, [queryClient]);

    return null;
};

export default SiteSettingsListener;
