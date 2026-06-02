// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from './App';

afterEach(cleanup);

describe('App', () => {
  it('renders the workspace shell', () => {
    render(<App />);
    expect(screen.getByText('Snapfinity')).toBeTruthy();
    // sections render (default language FR)
    expect(screen.getByText('Général')).toBeTruthy();
  });
});
