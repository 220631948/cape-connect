/**
 * @file src/components/admin/UserManagementPanel.tsx
 * @description Tenant admin panel — user management, role assignment, invitations.
 * @compliance POPIA: User data is tenant-scoped. Role changes are audited.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CrayonCard } from '../ui/CrayonCard';
import { UsersTab } from './UsersTab';
import { InvitesTab } from './InvitesTab';
import { AuditTab } from './AuditTab';
import { ImpersonationModal } from './ImpersonationModal';
import type { ImpersonationState, StartImpersonationPayload } from './impersonation-types';

// Exported types used by sub-components
export type Role = 'viewer' | 'analyst' | 'power_user' | 'admin';

export interface TenantUser {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  tenant_id: string;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  details: Record<string, unknown>;
  created_at: string;
  user_id: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  viewer:     'View maps and data',
  analyst:    'View + search + filter',
  power_user: 'Analyst + draw tools + analysis',
  admin:      'Full access + user management',
};

const ROLE_COLORS: Record<Role, string> = {
  viewer:     '#6B7280',
  analyst:    '#3B82F6',
  power_user: '#F59E0B',
  admin:      '#EF4444',
};

type Tab = 'users' | 'invites' | 'audit';

export const UserManagementPanel: React.FC = () => {
  const [users, setUsers]           = useState<TenantUser[]>([]);
  const [auditLog, setAuditLog]     = useState<AuditEvent[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [impersonationState, setImpersonationState] = useState<ImpersonationState | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [impersonationError, setImpersonationError] = useState<string | null>(null);
  const [impersonationLoading, setImpersonationLoading] = useState(false);
  const [impersonationModalOpen, setImpersonationModalOpen] = useState(false);
  const [impersonationTarget, setImpersonationTarget] = useState<TenantUser | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>('users');

  useEffect(() => {
    const refresh = () => { loadData(); };
    loadData();
    window.addEventListener('impersonation:changed', refresh);
    return () => window.removeEventListener('impersonation:changed', refresh);
  }, []);

  const loadImpersonationState = async () => {
    const response = await fetch('/api/admin/impersonation-state', { cache: 'no-store' });
    if (!response.ok) return null;
    const json = await response.json();
    setImpersonationState(json as ImpersonationState);
    return json as ImpersonationState;
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, invitesRes, auditRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/invite'),
        fetch('/api/admin/audit?limit=20'),
        loadImpersonationState(),
      ]);
      if (usersRes.ok)   setUsers((await usersRes.json()).data ?? []);
      if (invitesRes.ok) setInvitations((await invitesRes.json()).data ?? []);
      if (auditRes.ok)   setAuditLog((await auditRes.json()).data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Role change failed');
    }
  };

  const handleInvite = async (email: string, role: Role) => {
    setInviteError(null);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          // Bug 1.12 Fix: display conflict error strictly in the form, not as a banner
          setInviteError(json.error || 'User is already a member of this workspace.');
          return;
        }
        throw new Error(json.error);
      }
      await loadData();
    } catch (err: unknown) {
      // General errors remain global
      setError(err instanceof Error ? err.message : 'Invite failed');
    }
  };

  const handleOpenImpersonation = (user: TenantUser) => {
    setImpersonationTarget(user);
    setImpersonationError(null);
    setImpersonationModalOpen(true);
  };

  const handleConfirmImpersonation = async (payload: StartImpersonationPayload) => {
    setImpersonationLoading(true);
    setImpersonationError(null);
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Impersonation failed');

      setImpersonationModalOpen(false);
      setImpersonationTarget(null);
      await loadData();
      window.dispatchEvent(new CustomEvent('impersonation:changed'));
    } catch (err: unknown) {
      setImpersonationError(err instanceof Error ? err.message : 'Impersonation failed');
    } finally {
      setImpersonationLoading(false);
    }
  };

  const tabBtn = (tab: Tab, label: string): React.CSSProperties => ({
    padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
    border: 'none', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.05em',
    background: activeTab === tab ? 'rgba(0,209,255,0.15)' : 'transparent',
    color: activeTab === tab ? '#00D1FF' : '#9CA3AF',
    transition: 'all 0.2s',
  });

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  return (
    <CrayonCard colorVariant="blue" className="lg:col-span-2">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-base font-bold m-0 text-white">👥 User Management</h2>
        <div className="flex gap-1">
          {([['users', `Users (${users.length})`], ['invites', `Invites (${pendingCount})`], ['audit', 'Audit Log']] as [Tab, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabBtn(tab, label)}>{label}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading... 🐢</div>
      ) : (
        <>
          {activeTab === 'users'   && (
            <UsersTab
              users={users}
              onRoleChange={handleRoleChange}
              onImpersonate={handleOpenImpersonation}
              currentUserId={impersonationState?.current_user_id}
              disableImpersonation={Boolean(impersonationState?.is_impersonating)}
            />
          )}
          {activeTab === 'invites' && (
            <InvitesTab 
              invitations={invitations} 
              onInvite={handleInvite} 
              error={inviteError}
              onClearError={() => setInviteError(null)}
            />
          )}
          {activeTab === 'audit'   && <AuditTab   events={auditLog} />}
        </>
      )}

      {impersonationState?.is_impersonating && (
        <div className="mt-3 rounded-lg border border-crayon-coral/40 bg-crayon-coral/10 px-3 py-2 text-[11px] text-crayon-coral">
          Impersonation is active. Stop current session in the top banner before starting another one.
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-3">
        {(Object.keys(ROLE_DESCRIPTIONS) as Role[]).map((r) => (
          <span key={r} className="text-[10px] text-gray-500">
            <span style={{ color: ROLE_COLORS[r] }}>⦁ {r}</span>: {ROLE_DESCRIPTIONS[r]}
          </span>
        ))}
      </div>

      <ImpersonationModal
        open={impersonationModalOpen}
        targetUser={impersonationTarget}
        loading={impersonationLoading}
        error={impersonationError}
        onCancel={() => {
          setImpersonationModalOpen(false);
          setImpersonationTarget(null);
          setImpersonationError(null);
        }}
        onConfirm={handleConfirmImpersonation}
      />
    </CrayonCard>
  );
};

export default UserManagementPanel;
