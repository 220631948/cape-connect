'use client';

import React from 'react';
import type { Role, TenantUser } from './UserManagementPanel';

const ROLE_CONFIG: Record<Role, { label: string; color: string; emoji: string }> = {
  viewer:     { label: 'Viewer',     color: '#6B7280', emoji: '👁️' },
  analyst:    { label: 'Analyst',    color: '#3B82F6', emoji: '📊' },
  power_user: { label: 'Power User', color: '#F59E0B', emoji: '⚡' },
  admin:      { label: 'Admin',      color: '#EF4444', emoji: '👑' },
};

interface UsersTabProps {
  users: TenantUser[];
  onRoleChange: (userId: string, role: Role) => Promise<void>;
  onImpersonate: (user: TenantUser) => void;
  disableImpersonation?: boolean;
  currentUserId?: string | null;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  onRoleChange,
  onImpersonate,
  disableImpersonation = false,
  currentUserId = null,
}) => {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 px-2 text-gray-400 font-semibold">User</th>
            <th className="text-left py-2 px-2 text-gray-400 font-semibold">Role</th>
            <th className="text-left py-2 px-2 text-gray-400 font-semibold">Joined</th>
            <th className="text-right py-2 px-2 text-gray-400 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-3 px-2">
                <div className="font-semibold text-white">{user.full_name || user.email}</div>
                <div className="text-gray-500 text-[10px]">{user.email}</div>
              </td>
              <td className="py-3 px-2">
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
                  style={{
                    background: `${ROLE_CONFIG[user.role].color}20`,
                    color: ROLE_CONFIG[user.role].color,
                    border: `1px solid ${ROLE_CONFIG[user.role].color}40`,
                  }}
                >
                  {ROLE_CONFIG[user.role].emoji} {ROLE_CONFIG[user.role].label}
                </span>
              </td>
              <td className="py-3 px-2 text-gray-400">{formatTime(user.created_at)}</td>
              <td className="py-3 px-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <select
                    value={user.role}
                    onChange={(e) => onRoleChange(user.id, e.target.value as Role)}
                    className="bg-capetown-card border border-white/20 rounded-lg px-2 py-1 text-[10px] text-white cursor-pointer"
                    style={{ outline: 'none' }}
                    aria-label={`Change role for ${user.full_name || user.email}`}
                  >
                    {(Object.keys(ROLE_CONFIG) as Role[]).map((key) => (
                      <option key={key} value={key}>
                        {ROLE_CONFIG[key].emoji} {ROLE_CONFIG[key].label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onImpersonate(user)}
                    disabled={disableImpersonation || currentUserId === user.id}
                    className="rounded-lg border border-crayon-coral/60 bg-crayon-coral/10 px-2 py-1 text-[10px] font-bold text-crayon-coral disabled:opacity-40"
                    aria-label={`Impersonate ${user.full_name || user.email}`}
                  >
                    Login As
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-gray-500">No users found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
