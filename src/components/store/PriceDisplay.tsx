import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSiteSettings } from '@/services/siteSettingsService';

interface PriceDisplayProps {
    amount: number;
    className?: string;
    showSymbol?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ amount, className, showSymbol = true }) => {
    const { data: settings } = useQuery({
        queryKey: ['site-settings'],
        queryFn: getSiteSettings,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const currencySymbol = settings?.currencySymbol || 'جنيه';
    const position = settings?.currencyPosition || 'after';

    // Ensure amount is a number
    const numAmount = Number(amount) || 0;

    const thousand = settings?.thousandSeparator || ',';
    const decimal = settings?.decimalSeparator || '.';

    // Format amount: remove .00 if it's an integer, otherwise use 2 decimal places
    const formatWithSeparators = (num: number, thousand: string, decimal: string) => {
        const isInt = num % 1 === 0;
        const parts = num.toFixed(isInt ? 0 : 2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
        return parts.join(decimal);
    };

    const formattedAmount = formatWithSeparators(numAmount, thousand, decimal);

    if (!showSymbol) {
        return <span className={className}>{formattedAmount}</span>;
    }

    return (
        <span className={className} dir="ltr">
            {position === 'before' ? (
                <>
                    <span className="text-[0.9em]">{currencySymbol}</span>
                    {formattedAmount}
                </>
            ) : (
                <>
                    {formattedAmount}
                    <span className="text-[0.8em] mr-1">{currencySymbol}</span>
                </>
            )}
        </span>
    );
};

export default PriceDisplay;
