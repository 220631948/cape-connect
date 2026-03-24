'use client';

import React from 'react';

interface InvitationErrorBannerProps {
    error: string | null;
    onDismiss: () => void;
}

const InvitationErrorBanner: React.FC<InvitationErrorBannerProps> = ({ error, onDismiss }) => {
    if (!error) return null;

    return (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-md shadow-lg pointer-events-auto flex items-center justify-between gap-3 backdrop-blur-sm z-50">
            <span className="text-sm font-medium">{error}</span>
            <button 
                onClick={onDismiss} 
                className="hover:bg-black/20 p-1 rounded-full transition-colors text-white"
                aria-label="Dismiss error"
            >
                ✕
            </button>
        </div>
    );
};

export default InvitationErrorBanner;
