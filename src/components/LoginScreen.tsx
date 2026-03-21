/**
 * @file src/components/LoginScreen.tsx
 * @description Neumorphic login screen component.
 */

import React, { useState } from 'react';
import LoginForm from './auth/LoginForm';
import { themes, ThemeName } from '../assets/tokens/themes';

interface LoginScreenProps {
  theme?: ThemeName;
  onLogin?: (email: string, password: string) => void;
  showMascot?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  theme = 'light',
  onLogin,
  showMascot = true,
}) => {
  const [mascotPose, setMascotPose] = useState('default');
  const mascotReactions: Record<string, string> = {
    default: '🐢 Ready to explore?',
    thinking: '🐢 Hmm, checking your data...',
    celebrating: '🐢 Welcome back, friend!',
  };

  const colors = themes[theme];
  const shadowStyle = {
    boxShadow: theme === 'high-contrast' ? `2px 2px 0 ${colors.inputBorder}` : `14px 14px 20px ${colors.shadow}, -5px -5px 15px ${colors.shadowInset}`,
  };
  const insetShadowStyle = {
    boxShadow: theme === 'high-contrast' ? `inset 1px 1px 0 ${colors.inputBorder}` : `inset 2px 2px 5px ${colors.shadow}, inset -2px -2px 5px ${colors.shadowInset}`,
  };

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif', color: colors.text, position: 'relative', overflow: 'hidden' }}>
      {showMascot && (
        <div style={{ position: 'absolute', top: '20px', right: '30px', opacity: 0.9 }}>
          <div style={{ fontSize: '64px', animation: 'float 3s ease-in-out infinite' }}>🐢</div>
          <p style={{ fontSize: '12px', color: colors.accent, marginTop: '8px', fontWeight: 600, textAlign: 'center' }}>
            {mascotReactions[mascotPose]}
          </p>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '420px', padding: '48px 40px', background: colors.surface, borderRadius: '24px', ...shadowStyle, position: 'relative', zIndex: 10 }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>Cape Town GIS Platform</p>
        </div>

        <LoginForm
          colors={colors}
          insetShadowStyle={insetShadowStyle}
          shadowStyle={shadowStyle}
          theme={theme}
          onLogin={onLogin}
          onPoseChange={setMascotPose}
        />

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <a href="#" style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
          <span style={{ color: colors.textSecondary, margin: '0 8px' }}>•</span>
          <a href="#" style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}>Sign up</a>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
};

export default LoginScreen;
