import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HomeHero } from './HomeHero';
import React from 'react';

describe('HomeHero', () => {
  it('renders the main headline', () => {
    render(<HomeHero />);
    
    expect(screen.getByText(/TRACE THE/i)).toBeInTheDocument();
    expect(screen.getByText(/PULSE/i)).toBeInTheDocument();
    expect(screen.getByText(/OF THE/i)).toBeInTheDocument();
    expect(screen.getByText(/MOTHER CITY/i)).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<HomeHero />);
    
    expect(screen.getByText(/Cape Town's definitive spatial intelligence platform/i)).toBeInTheDocument();
  });

  it('contains Link buttons with correct hrefs', () => {
    render(<HomeHero />);
    
    const exploreButton = screen.getByRole('link', { name: /Explore Map/i });
    const loginButton = screen.getByRole('link', { name: /Tenant Login/i });
    
    expect(exploreButton).toHaveAttribute('href', '/dashboard');
    expect(loginButton).toHaveAttribute('href', '/login');
  });
});
