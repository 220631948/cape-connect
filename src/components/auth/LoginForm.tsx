/**
 * @file src/components/auth/LoginForm.tsx
 * @description Neumorphic login form component.
 */

import React, { useState } from 'react';

interface LoginFormProps {
  colors: any;
  insetShadowStyle: any;
  shadowStyle: any;
  theme: string;
  onLogin?: (email: string, password: string) => void;
  onPoseChange: (pose: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  colors,
  insetShadowStyle,
  shadowStyle,
  theme,
  onLogin,
  onPoseChange,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onPoseChange('thinking');
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    onPoseChange('celebrating');
    onLogin?.(email, password);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '14px',
    border: `2px solid ${colors.inputBorder}`,
    borderRadius: '12px',
    background: colors.input,
    color: colors.text,
    ...insetShadowStyle,
    boxSizing: 'border-box' as const,
    outline: 'none',
    transition: 'all 0.3s ease',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          style={inputStyle}
          onFocus={(e) => theme !== 'high-contrast' && (e.currentTarget.style.borderColor = colors.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = colors.inputBorder)}
        />
      </div>

      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          style={inputStyle}
          onFocus={(e) => theme !== 'high-contrast' && (e.currentTarget.style.borderColor = colors.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = colors.inputBorder)}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '14px 16px',
          fontSize: '15px',
          fontWeight: 700,
          background: colors.accent,
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          ...(isLoading ? { opacity: 0.8, ...insetShadowStyle } : { ...shadowStyle }),
          transition: 'all 0.2s ease',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {isLoading ? 'Signing In...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
