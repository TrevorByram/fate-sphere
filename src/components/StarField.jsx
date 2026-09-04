import { useMemo } from 'react';
import './StarField.css';

const STAR_COUNT = 60;

/**
 * Purely decorative drifting stars behind the ball. Positions are generated once
 * per mount so the layout stays stable across re-renders.
 */
export function StarField({ count = STAR_COUNT }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 6,
        duration: 3 + Math.random() * 5,
      })),
    [count],
  );

  return (
    <div className="star-field" aria-hidden="true" data-testid="star-field">
      {stars.map((star) => (
        <span
          key={star.id}
          className="star-field__star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
