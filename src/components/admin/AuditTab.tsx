'use client';

import React from 'react';
import type { AuditEvent } from './UserManagementPanel';

const EVENT_EMOJI: Record<string, string> = {
  login: '🔑',
  logout: '👋',
  role_change: '🔄',
  user_invite: '📧',
  user_remove: '❌',
  tenant_create: '🏗️',
  feature_create: '✏️',
  feature_delete: '🗑️',
  impersonation_started: '🕵️',
  impersonation_action: '🧭',
  impersonation_ended: '↩️',
};

interface AuditTabProps {
  events: AuditEvent[];
}

export const AuditTab: React.FC<AuditTabProps> = ({ events }) => {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-1 max-h-[300px] overflow-y-auto">
      {events.map((evt) => (
        <div key={evt.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
          <span className="text-sm mt-0.5">{EVENT_EMOJI[evt.event_type] || '📋'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white">{evt.event_type.replace(/_/g, ' ')}</div>
            <div className="text-[10px] text-gray-500 truncate">
              {JSON.stringify(evt.details)}
            </div>
          </div>
          <div className="text-[10px] text-gray-500 whitespace-nowrap">{formatTime(evt.created_at)}</div>
        </div>
      ))}
      {events.length === 0 && (
        <div className="py-6 text-center text-gray-500 text-xs">No events recorded yet</div>
      )}
    </div>
  );
};
