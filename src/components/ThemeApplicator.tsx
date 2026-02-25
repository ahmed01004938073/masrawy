import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSiteSettings } from '@/services/siteSettingsService';

// Function to convert hex to HSL for Shadcn UI
const hexToHSL = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin;
    let h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return `${h} ${s}% ${l}%`;
};

const ThemeApplicator = () => {
    const { data: settings } = useQuery({
        queryKey: ['site-settings'],
        queryFn: getSiteSettings,
        staleTime: 0, // تحديث فوري (بدون كاش)
    });

    useEffect(() => {
        if (settings) {
            const root = document.documentElement;

            if (settings.primaryColor) {
                root.style.setProperty('--primary', hexToHSL(settings.primaryColor));
            }

            if (settings.secondaryColor) {
                root.style.setProperty('--secondary', hexToHSL(settings.secondaryColor));
            }

            // You can add more variables here if needed
            if (settings.accentColor) {
                root.style.setProperty('--accent', hexToHSL(settings.accentColor));
            }
        }
    }, [settings]);

    return null;
};

export default ThemeApplicator;
