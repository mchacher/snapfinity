// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from './App';

afterEach(cleanup);

describe('App', () => {
  it('renders the workspace shell', () => {
    render(<App />);
    expect(screen.getByText('Snapfinity')).toBeTruthy();
    // tabs render (default language FR); the Outline tab is active → its left-panel section
    expect(screen.getByText('Aperçu 3D')).toBeTruthy();
    expect(screen.getByText('Calibration')).toBeTruthy();
  });
});
