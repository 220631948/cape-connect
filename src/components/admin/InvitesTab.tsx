'use client';

import React, { useState } from 'react';
import type { Role, Invitation } from './UserManagementPanel';

const ROLE_CONFIG: Record<Role, { label: string; emoji: string }> = {
  viewer:     { label: 'Viewer',     emoji: '👁️' },
  analyst:    { label: 'Analyst',    emoji: '📊' },
  power_user: { label: 'Power User', emoji: '⚡' },
  admin:      { label: 'Admin',      emoji: '👑' },
};

interface InvitesTabProps {
  invitations: Invitation[];
  onInvite: (email: string, role: Role) => Promise<void>;
}

export const InvitesTab: React.FC<InvitesTabProps> = ({ invitations, onInvite }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [loading, setLoading] = useState(false);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await onInvite(email, role);
    setEmail('');
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 flex-wrap">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          aria-label="Email address to invite"
          required
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-capetown-dark border border-white/20 text-white text-xs placeholder:text-gray-500"
          style={{ outline: 'none' }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="px-3 py-2 rounded-lg bg-capetown-dark border border-white/20 text-white text-xs cursor-pointer"
          style={{ outline: 'none' }}
          aria-label="Role for invited user"
        >
          {(Object.keys(ROLE_CONFIG) as Role[]).map((key) => (
            <option key={key} value={key}>{ROLE_CONFIG[key].emoji} {ROLE_CONFIG[key].label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-crayon-blue text-black text-xs font-bold cursor-pointer hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? 'Sending...' : '📧 Send Invite'}
        </button>
      </form>
      <div className="space-y-2">
        {invitations.map((inv) => (
          <div key={inv.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
            <div>
              <div className="text-xs font-semibold text-white">{inv.email}</div>
              <div className="text-[10px] text-gray-500">
                {ROLE_CONFIG[inv.role as Role]?.emoji} {inv.role} • Expires {formatTime(inv.expires_at)}
              </div>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{
                background: inv.status === 'pending' ? '#F59E0B20' : inv.status === 'accepted' ? '#10B98120' : '#EF444420',
                color: inv.status === 'pending' ? '#F59E0B' : inv.status === 'accepted' ? '#10B981' : '#EF4444',
              }}
            >
              {inv.status.toUpperCase()}
            </span>
          </div>
        ))}
        {invitations.length === 0 && (
          <div className="py-6 text-center text-gray-500 text-xs">No invitations yet</div>
        )}
      </div>
    </div>
  );
};
