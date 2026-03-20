import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CrayonCard } from './CrayonCard';
import React from 'react';

describe('CrayonCard', () => {
  it('renders children correctly', () => {
    render(
      <CrayonCard>
        <div data-testid="test-child">Hello Crayon</div>
      </CrayonCard>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Hello Crayon')).toBeInTheDocument();
  });

  it('applies the correct classes for different color variants', () => {
    const { rerender, container } = render(
      <CrayonCard colorVariant="pink">
        <div>Pink Card</div>
      </CrayonCard>
    );
    
    let card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-crayon-pink/20');

    rerender(
      <CrayonCard colorVariant="yellow">
        <div>Yellow Card</div>
      </CrayonCard>
    );
    card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-crayon-yellow/20');

    rerender(
      <CrayonCard colorVariant="blue">
        <div>Blue Card</div>
      </CrayonCard>
    );
    card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-crayon-blue/20');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CrayonCard className="custom-class">
        <div>Custom Class Card</div>
      </CrayonCard>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });
});
