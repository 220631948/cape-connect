/**
 * @file src/components/dashboard/DashboardHeader.tsx
 * @description Neumorphic header for the GIS Dashboard.
 */

import React from 'react';
import SearchOverlay from '../search/SearchOverlay';
import { Theme } from '../../assets/tokens/themes';
import type { ImpersonationState } from '../admin/impersonation-types';

interface DashboardHeaderProps {
  colors: Theme;
  headerShadow: any;
  onSearchSelect: (result: any) => void;
  impersonationState?: ImpersonationState | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  colors,
  headerShadow,
  onSearchSelect,
  impersonationState,
}) => {
  const impersonating = Boolean(impersonationState?.is_impersonating);

  return (
    <header
      className="p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-crayon-blue bg-capetown-card shadow-lg w-full"
      style={headerShadow}
    >
      <div className="w-full sm:w-auto flex justify-between items-center sm:block">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black m-0 mb-1 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm m-0 text-white/60">
            Cape Town GIS Platform Analytics
          </p>
        </div>
        
        {/* Mascot badge moved here for mobile layout */}
        <div
          className={`sm:hidden flex items-center gap-2 py-1 px-2 rounded-xl border-2 ${
            impersonating ? 'border-crayon-coral bg-crayon-coral/10' : 'border-crayon-blue bg-white/5'
          }`}
        >
          <span className="text-xl animate-bounce" aria-hidden="true">🐢</span>
          <div className="flex flex-col">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                impersonating ? 'text-crayon-coral' : 'text-crayon-blue'
              }`}
            >
              {impersonating ? 'Impersonating' : 'Online'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full sm:w-auto sm:flex-1 max-w-full sm:max-w-[400px]">
        <SearchOverlay onSelect={onSearchSelect} colors={colors} />
      </div>

      {/* Mascot badge (top-right on desktop) */}
      <div
        className={`hidden sm:flex items-center gap-2 py-2 px-3 rounded-xl border-2 ${
          impersonating ? 'border-crayon-coral bg-crayon-coral/10' : 'border-crayon-blue bg-white/5'
        }`}
      >
        <span className="text-2xl animate-bounce" aria-hidden="true">🐢</span>
        <div className="flex flex-col">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              impersonating ? 'text-crayon-coral' : 'text-crayon-blue'
            }`}
          >
            {impersonating ? 'Impersonating' : 'Online'}
          </span>
          {impersonating && (
            <span className="text-[10px] text-gray-300">
              {impersonationState?.target_user?.name || impersonationState?.target_user?.email}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
