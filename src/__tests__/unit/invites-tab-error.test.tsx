import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvitesTab } from '../../components/admin/InvitesTab';
import React from 'react';

describe('InvitesTab Component', () => {
  const mockInvitations = [];
  const mockOnInvite = vi.fn();
  const mockOnClearError = vi.fn();

  it('renders the invitation form', () => {
    render(
      <InvitesTab 
        invitations={mockInvitations} 
        onInvite={mockOnInvite} 
      />
    );

    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /send invite/i })).toBeDefined();
  });

  it('displays error message when provided', () => {
    render(
      <InvitesTab 
        invitations={mockInvitations} 
        onInvite={mockOnInvite} 
        error="This user is already a member"
      />
    );

    expect(screen.getByText(/already a member/i)).toBeDefined();
  });

  it('calls onClearError when the clear button is clicked', () => {
    render(
      <InvitesTab 
        invitations={mockInvitations} 
        onInvite={mockOnInvite} 
        error="Some error"
        onClearError={mockOnClearError}
      />
    );

    const clearButton = screen.getByLabelText('✕');
    fireEvent.click(clearButton);

    expect(mockOnClearError).toHaveBeenCalled();
  });
});
