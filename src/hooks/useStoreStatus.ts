import { useState, useEffect } from 'react';
import { isStoreOpen, getSiteSettings } from '@/services/siteSettingsService';

export const useStoreStatus = () => {
  const [storeOpen, setStoreOpen] = useState(true);
  const [settings, setSettings] = useState<any>(null); // Initialize as null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStoreStatus = async () => {
      try {
        const currentSettings = await getSiteSettings();
        const isOpen = await isStoreOpen();

        setSettings(currentSettings);
        setStoreOpen(isOpen);
      } catch (e) {
        console.error("Failed to check store status", e);
      } finally {
        setLoading(false);
      }
    };

    // Check immediately
    checkStoreStatus();

    // Check every 90 seconds (Optimized for 500k+ users)
    const interval = setInterval(checkStoreStatus, 90000);

    // Listen for storage changes (when settings are updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'siteSettings') {
        checkStoreStatus();
      }
    };

    // Listen for custom broadcast channel
    const channel = new BroadcastChannel('site_settings_channel');
    channel.onmessage = (event) => {
      if (event.data === 'updated') {
        checkStoreStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      channel.close();
    };
  }, []);

  return {
    storeOpen,
    settings,
    loading,
    refresh: async () => {
      const currentSettings = await getSiteSettings();
      const isOpen = await isStoreOpen();
      setSettings(currentSettings);
      setStoreOpen(isOpen);
    }
  };
};
