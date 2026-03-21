/**
 * @file src/components/dashboard/InvitationBanner.tsx
 * @description Neon-styled notification banner for pending invitations.
 */

import React from 'react';
import { Theme } from '../../assets/tokens/themes';

export interface Invitation {
  id: string;
  tenant_id: string;
  role: string;
  tenants: {
    name: string;
  };
}

interface InvitationBannerProps {
  invitations: Invitation[];
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
  colors: Theme;
}

export const InvitationBanner: React.FC<InvitationBannerProps> = ({
  invitations,
  onAccept,
  onDecline,
  colors,
}) => {
  if (invitations.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      {invitations.map((invite) => (
        <div
          key={invite.id}
          className="flex flex-col md:flex-row items-center justify-between p-5 rounded-2xl border-2 border-crayon-pink bg-black/60 backdrop-blur-md shadow-[0_0_20px_rgba(255,97,239,0.2)] animate-in fade-in slide-in-from-top-4 duration-500"
          style={{
            borderRadius: '15px 255px 15px 225px / 225px 15px 255px 15px'
          }}
        >
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="w-12 h-12 flex items-center justify-center bg-crayon-pink/20 rounded-full text-2xl shadow-[0_0_10px_rgba(255,97,239,0.4)]">
              ✉️
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">
                New Command Invite
              </h3>
              <p className="text-sm text-gray-300">
                You've been requested to join <span className="text-crayon-blue font-bold underline decoration-crayon-blue/30">{invite.tenants.name}</span> as <span className="text-crayon-pink font-bold">{invite.role}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onDecline(invite.id)}
              className="px-5 py-2 text-xs font-bold rounded-lg border-2 border-crayon-pink/50 text-crayon-pink hover:bg-crayon-pink hover:text-black transition-all active:scale-95 cursor-pointer uppercase"
            >
              Decline
            </button>
            <button
              onClick={() => onAccept(invite.id)}
              className="px-8 py-2 text-xs font-bold rounded-lg bg-crayon-blue text-black hover:bg-white hover:shadow-[0_0_20px_rgba(0,209,255,0.6)] transition-all active:scale-95 cursor-pointer uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Accept Access
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvitationBanner;
