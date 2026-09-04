import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { FateSphere } from './FateSphere.jsx';

const initialAnswer = { text: 'Ask me anything', tone: 'neutral' };
const answers = [
  { text: 'Absolutely', chance: 50, tone: 'positive' },
  { text: 'No chance', chance: 50, tone: 'negative' },
];

const renderBall = (props = {}) =>
  render(
    <FateSphere initialAnswer={initialAnswer} answers={answers} random={() => 0} {...props} />,
  );

const ball = () => screen.getByTestId('fate-sphere');
const answerText = () => screen.getByTestId('fate-sphere-answer');

/**
 * userEvent deadlocks against fake timers here (its internal delay never
 * resolves), so these tests drive the component with fireEvent inside act().
 */
const click = () => act(() => { fireEvent.click(ball()); });

/** Advance past the shake animation and flush the resulting state update. */
const finishShake = () => act(() => { vi.advanceTimersByTime(1000); });

describe('<FateSphere />', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => { vi.runOnlyPendingTimers(); });
    vi.useRealTimers();
  });

  it('shows the configured starting answer before any roll', () => {
    renderBall();
    expect(answerText()).toHaveTextContent('Ask me anything');
    expect(ball()).toHaveAttribute('data-rolled', 'false');
  });

  it('shows a rolled answer after clicking, using the injected RNG', () => {
    renderBall({ random: () => 0 });

    click();
    finishShake();

    expect(answerText()).toHaveTextContent('Absolutely');
    expect(ball()).toHaveAttribute('data-rolled', 'true');
  });

  it('selects the second answer when the RNG lands in its bucket', () => {
    renderBall({ random: () => 0.9 });

    click();
    finishShake();

    expect(answerText()).toHaveTextContent('No chance');
  });

  it('clears the text and marks itself shaking while rolling', () => {
    renderBall();

    click();
    expect(ball()).toHaveClass('is-shaking');
    expect(answerText()).toHaveTextContent('');

    finishShake();
    expect(ball()).not.toHaveClass('is-shaking');
  });

  it('ignores extra clicks while a roll is already in progress', () => {
    const random = vi.fn(() => 0);
    renderBall({ random });

    click();
    click();
    click();
    finishShake();

    expect(random).toHaveBeenCalledTimes(1);
  });

  it('can be rolled again after the previous roll finishes', () => {
    const random = vi.fn(() => 0);
    renderBall({ random });

    click();
    finishShake();
    click();
    finishShake();

    expect(random).toHaveBeenCalledTimes(2);
  });

  it('rolls when activated with the Enter key', () => {
    renderBall({ random: () => 0.9 });

    act(() => { fireEvent.keyDown(ball(), { key: 'Enter' }); });
    finishShake();

    expect(answerText()).toHaveTextContent('No chance');
  });

  it('rolls when activated with the Space key', () => {
    renderBall({ random: () => 0 });

    act(() => { fireEvent.keyDown(ball(), { key: ' ' }); });
    finishShake();

    expect(answerText()).toHaveTextContent('Absolutely');
  });

  it('ignores unrelated key presses', () => {
    const random = vi.fn(() => 0);
    renderBall({ random });

    act(() => { fireEvent.keyDown(ball(), { key: 'a' }); });
    finishShake();

    expect(random).not.toHaveBeenCalled();
    expect(answerText()).toHaveTextContent('Ask me anything');
  });

  it('applies the tone of the answer for styling', () => {
    renderBall({ random: () => 0 });

    expect(answerText()).toHaveAttribute('data-tone', 'neutral');

    click();
    finishShake();

    expect(answerText()).toHaveAttribute('data-tone', 'positive');
  });

  it('keeps showing the starting answer when there is nothing to roll', () => {
    renderBall({ answers: [] });

    click();
    finishShake();

    expect(answerText()).toHaveTextContent('Ask me anything');
    expect(ball()).toHaveAttribute('data-rolled', 'false');
  });

  it('exposes an accessible label and a live region', () => {
    renderBall();
    expect(screen.getByRole('button', { name: /fate sphere/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Ask me anything');
  });

  it('announces the shake and then the result to screen readers', () => {
    renderBall({ random: () => 0 });

    click();
    expect(screen.getByRole('status')).toHaveTextContent('Shaking the sphere');

    finishShake();
    expect(screen.getByRole('status')).toHaveTextContent('Absolutely');
  });

  it('does not update state after unmounting mid-shake', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = renderBall();

    click();
    unmount();
    act(() => { vi.advanceTimersByTime(1000); });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
