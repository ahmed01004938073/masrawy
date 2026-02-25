
import { useQuery } from '@tanstack/react-query';
import { getSiteSettings } from '@/services/siteSettingsService';
import { formatPriceWithSeparators } from '@/utils/formatPrice';

/**
 * Custom hook to format prices using site-wide separator settings.
 * Pulls settings from React Query for caching and automatic updates.
 */
export const usePriceFormatter = () => {
    const { data: settings } = useQuery({
        queryKey: ['site-settings'],
        queryFn: getSiteSettings,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const thousand = settings?.thousandSeparator || ',';
    const decimal = settings?.decimalSeparator || '.';
    const currencySymbol = settings?.currencySymbol || 'ج.م';
    const position = settings?.currencyPosition || 'after';

    const formatPrice = (amount: number | string | undefined | null) => {
        return formatPriceWithSeparators(amount, thousand, decimal);
    };

    const formatPriceWithSymbol = (amount: number | string | undefined | null) => {
        const formatted = formatPrice(amount);
        return position === 'before'
            ? `${currencySymbol} ${formatted}`
            : `${formatted} ${currencySymbol}`;
    };

    return {
        formatPrice,
        formatPriceWithSymbol,
        settings
    };
};
