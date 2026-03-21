import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FeatureGrid } from './FeatureGrid';
import React from 'react';

describe('FeatureGrid', () => {
  it('renders all three feature cards', () => {
    render(<FeatureGrid />);

    expect(screen.getByText('Map Every Value')).toBeInTheDocument();
    expect(screen.getByText('Trace the Skies')).toBeInTheDocument();
    expect(screen.getByText('Overlay Insight')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FeatureGrid />);

    expect(screen.getByText(/Trace the economic contours of the urban landscape/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualize the invisible corridors of our airspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Combine diverse datasets for multi-dimensional analysis/i)).toBeInTheDocument();
  });

  it('renders "Learn More" indicators', () => {
    render(<FeatureGrid />);

    const learnMoreLinks = screen.getAllByText(/Learn More →/i);
    expect(learnMoreLinks).toHaveLength(3);
  });
});
