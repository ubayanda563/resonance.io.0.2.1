import React, { memo, useState } from 'react';
import { Star } from 'lucide-react';
import { trackAPI } from '../services/api';

const StarRating = memo(({ trackId, initialRating = 0, size = 14, readonly = false }) => {
  const [rating, setRating]     = useState(initialRating);
  const [hovered, setHovered]   = useState(0);
  const [saving, setSaving]     = useState(false);

  const handleRate = async (stars) => {
    if (readonly || saving) return;
    setSaving(true);
    setRating(stars);
    try {
      await trackAPI.updateTrack(trackId, { user_rating: stars });
    } catch (e) {
      console.error('Rating failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const display = hovered || rating;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); handleRate(star); }}
          onMouseEnter={() => !readonly && setHovered(star)}
          disabled={readonly || saving}
          className="transition-transform hover:scale-110 disabled:cursor-default"
          style={{ background: 'none', border: 'none', padding: 0, cursor: readonly ? 'default' : 'pointer' }}
        >
          <Star
            size={size}
            fill={star <= display ? '#C49A28' : 'none'}
            stroke={star <= display ? '#C49A28' : '#55555E'}
          />
        </button>
      ))}
    </div>
  );
});

StarRating.displayName = 'StarRating';
export default StarRating;
