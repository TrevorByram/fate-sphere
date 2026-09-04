import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StarField } from './StarField.jsx';

describe('<StarField />', () => {
  it('renders the requested number of stars', () => {
    render(<StarField count={12} />);
    expect(screen.getByTestId('star-field').children).toHaveLength(12);
  });

  it('is hidden from assistive technology', () => {
    render(<StarField count={3} />);
    expect(screen.getByTestId('star-field')).toHaveAttribute('aria-hidden', 'true');
  });

  it('positions every star within the viewport bounds', () => {
    render(<StarField count={40} />);
    for (const star of screen.getByTestId('star-field').children) {
      const left = Number.parseFloat(star.style.left);
      const top = Number.parseFloat(star.style.top);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(100);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top).toBeLessThanOrEqual(100);
    }
  });

  it('renders nothing when asked for zero stars', () => {
    render(<StarField count={0} />);
    expect(screen.getByTestId('star-field').children).toHaveLength(0);
  });
});
