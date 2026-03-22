-- Migration: Add delivery_status column to tenant_invitations
-- Bug 1.8: No way to audit whether invited user received the email link

ALTER TABLE tenant_invitations
  ADD COLUMN IF NOT EXISTS delivery_status text
    CHECK (delivery_status IN ('pending', 'sent', 'failed'))
    DEFAULT 'pending';

COMMENT ON COLUMN tenant_invitations.delivery_status IS
  'Email delivery outcome: pending (not yet attempted), sent (email dispatched), failed (delivery error).';
