import { Star } from "lucide-react";

interface StarRatingProps {
    salesCount: number;
    rating?: number; // New optional prop from backend
}

const StarRating = ({ salesCount, rating: backendRating }: StarRatingProps) => {
    // Logic: 0-2 (0), 2-5 (2), 5-10 (3), 10-15 (4), >15 (5)
    let rating = backendRating !== undefined ? backendRating : 0;

    // Fallback if backend didn't provide rating (legacy)
    if (backendRating === undefined) {
        if (salesCount > 15) rating = 5;
        else if (salesCount >= 10) rating = 4;
        else if (salesCount >= 5) rating = 3;
        else if (salesCount >= 2) rating = 2;
        else rating = 0;
    }

    if (rating === 0) return null;

    return (
        <div
            className="flex items-center gap-1.5"
            dir="rtl"
            title={backendRating !== undefined ? `التقييم: ${rating} نجوم` : `Rated based on ${salesCount} sales`}
        >
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        className={`${i < rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-100 text-gray-200"
                            }`}
                    />
                ))}
            </div>

            <span className="hidden md:inline text-[10px] text-gray-500 font-bold font-cairo">
                تقييم المنتج
            </span>
        </div>
    );
};

export default StarRating;
