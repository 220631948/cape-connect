import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mocking next/link and next/navigation as per instructions
vi.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode, href: string }) => {
      return React.createElement('a', { href }, children);
    },
  };
});

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      pathname: '/',
      query: {},
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  };
});

import React from 'react';
