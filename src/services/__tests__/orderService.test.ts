import { searchOrders } from '../orderService';
import { safeFetch } from '@/utils/apiErrorHandler';

// Mock the safeFetch function
jest.mock('@/utils/apiErrorHandler');

describe('orderService', () => {
    describe('searchOrders', () => {
        it('should return empty array for empty query', async () => {
            const result = await searchOrders('');
            expect(result).toEqual([]);
        });

        it('should return empty array for whitespace query', async () => {
            const result = await searchOrders('   ');
            expect(result).toEqual([]);
        });

        it('should call API with trimmed and encoded query', async () => {
            const mockOrders = [
                { id: '1', orderNumber: 'ORD-123', customerName: 'Test User' },
            ];

            (safeFetch as jest.Mock).mockResolvedValue({
                data: mockOrders,
                success: true,
            });

            const result = await searchOrders('  ORD-123  ');

            expect(safeFetch).toHaveBeenCalledWith(
                expect.stringContaining('search?q=ord-123')
            );
            expect(result).toEqual(mockOrders);
        });

        it('should handle API errors gracefully', async () => {
            (safeFetch as jest.Mock).mockResolvedValue({
                error: 'Network error',
                success: false,
            });

            const result = await searchOrders('test');
            expect(result).toEqual([]);
        });
    });
});
