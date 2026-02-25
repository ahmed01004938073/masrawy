
/**
 * Formats a price with custom thousand and decimal separators.
 * 
 * @param amount The numeric amount to format
 * @param thousand The character to use as a thousand separator (default: ',')
 * @param decimal The character to use as a decimal separator (default: '.')
 * @returns Formatted price string
 */
export const formatPriceWithSeparators = (
    amount: number | string | undefined | null,
    thousand: string = ',',
    decimal: string = '.'
): string => {
    const num = Number(amount) || 0;
    const isInt = num % 1 === 0;

    // Use fixed precision: 0 for integers, 2 for floats
    const parts = num.toFixed(isInt ? 0 : 2).split('.');

    // Add thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);

    // Join with decimal separator
    return parts.join(decimal);
};
