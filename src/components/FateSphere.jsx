import { useCallback, useEffect, useRef, useState } from 'react';
import { rollAnswer } from '../lib/rollAnswer.js';
import './FateSphere.css';

const SHAKE_MS = 900;

/**
 * The ball itself. Renders the configured starting answer until it is first
 * rolled, then shows whichever weighted answer came up.
 */
export function FateSphere({ initialAnswer, answers, random = Math.random }) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [hasRolled, setHasRolled] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const timeoutRef = useRef(null);

  const roll = useCallback(() => {
    if (isShaking) return;

    const next = rollAnswer(answers, random);
    if (!next) return;

    setIsShaking(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAnswer(next);
      setHasRolled(true);
      setIsShaking(false);
    }, SHAKE_MS);
  }, [answers, isShaking, random]);

  // Avoid a state update if the ball unmounts mid-shake.
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      roll();
    }
  };

  return (
    <div className="fate-sphere-stage">
      <button
        type="button"
        className={`fate-sphere${isShaking ? ' is-shaking' : ''}`}
        onClick={roll}
        onKeyDown={onKeyDown}
        aria-label="Fate Sphere. Activate to roll a new answer."
        data-testid="fate-sphere"
        data-rolled={hasRolled}
      >
        <span className="fate-sphere__gloss" aria-hidden="true" />
        <span className="fate-sphere__window">
          <span className="fate-sphere__triangle">
            <span
              className="fate-sphere__answer"
              data-tone={answer.tone}
              data-testid="fate-sphere-answer"
            >
              {isShaking ? '' : answer.text}
            </span>
          </span>
        </span>
      </button>

      <p aria-live="polite" role="status" className="visually-hidden">
        {isShaking ? 'Shaking the sphere…' : answer.text}
      </p>

      <p className="fate-sphere-hint">
        {isShaking ? 'Shaking…' : 'Click the ball to ask again'}
      </p>
    </div>
  );
}
