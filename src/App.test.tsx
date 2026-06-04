// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import App from './App';

afterEach(cleanup);

describe('App', () => {
  it('shows the landing on every visit', () => {
    render(<App />);
    expect(screen.getByText('Snapfinity')).toBeTruthy();
    // FR is the default language.
    expect(screen.getByText('Commencer')).toBeTruthy();
    expect(screen.getByText(/^Transforme une photo en bac Gridfinity sur/)).toBeTruthy();
  });

  it('enters the workspace and returns home via the logo', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Commencer'));
    // Workspace shell (default language FR): tabs + the détourage panel's selection subsection
    // (titled by the current step — no photo yet → "Créer la sélection").
    expect(screen.getByText('Aperçu 3D')).toBeTruthy();
    expect(screen.getByText('Créer la sélection')).toBeTruthy();
    // The header logo brings us back to the landing.
    fireEvent.click(screen.getByLabelText("Retour à l'accueil"));
    expect(screen.getByText(/^Transforme une photo en bac Gridfinity sur/)).toBeTruthy();
  });
});
