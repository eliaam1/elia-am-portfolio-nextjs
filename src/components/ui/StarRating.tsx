import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  interactive?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onChange, interactive = false }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleClick = (value: number) => {
    if (interactive && onChange) onChange(value);
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (interactive) setHoverRating(null);
  };

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, idx) => {
        const starValue = idx + 1;
        const isActive = hoverRating !== null ? starValue <= hoverRating : starValue <= rating;

        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive}
            className={cn(
              "p-0.5 rounded-sm focus:outline-none transition-all duration-200",
              interactive ? "cursor-pointer active:scale-90" : "cursor-default"
            )}
            aria-label={`Rate ${starValue} stars out of 5`}
          >
            <Star
              className={cn(
                "w-4 h-4 transition-colors duration-200",
                isActive
                  ? "text-app-accent fill-app-accent"
                  : "text-app-text-secondary/25 fill-transparent"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
