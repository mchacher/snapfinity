// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import App from './App';

afterEach(() => {
  cleanup();
  // happy-dom's Storage may lack clear(); remove just our key, guarded.
  try {
    localStorage.removeItem('snapfinity.seenLanding');
  } catch {
    /* storage unavailable in this env — App falls back to showing the landing anyway */
  }
});

describe('App', () => {
  it('shows the landing on first visit', () => {
    render(<App />);
    expect(screen.getByText('Snapfinity')).toBeTruthy();
    // FR is the default language.
    expect(screen.getByText('Commencer')).toBeTruthy();
    expect(screen.getByText('Transforme une photo en bac Gridfinity sur-mesure')).toBeTruthy();
  });

  it('enters the workspace after Commencer', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Commencer'));
    // The workspace shell: tabs + the calibration section (default language FR).
    expect(screen.getByText('Aperçu 3D')).toBeTruthy();
    expect(screen.getByText('Calibrage')).toBeTruthy();
  });
});
