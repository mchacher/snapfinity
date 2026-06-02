// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Toggle } from './Toggle';

afterEach(cleanup);

describe('Toggle', () => {
  it('fires onChange exactly once per click (no <label> double-fire)', () => {
    const onChange = vi.fn();
    render(<Toggle label="Lip" checked={false} onChange={onChange} />);
    screen.getByRole('switch').click();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reflects the checked state via aria-checked', () => {
    const { rerender } = render(<Toggle label="Lip" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
    rerender(<Toggle label="Lip" checked onChange={() => {}} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });
});
