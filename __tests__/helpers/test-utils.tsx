import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider, AuthProviderProps } from '../../src/react/AuthProvider';
import { MockAdapter } from './mock-adapter';
import { MemoryTokenStorage } from '../../src/core/TokenStorage';

/**
 * Custom render function with AuthProvider wrapper
 */
export function renderWithAuth(
  ui: React.ReactElement,
  options?: {
    adapter?: AuthProviderProps['config']['adapter'];
    renderOptions?: Omit<RenderOptions, 'wrapper'>;
  }
) {
  const mockAdapter = options?.adapter || new MockAdapter();
  const tokenStorage = new MemoryTokenStorage();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider config={{ adapter: mockAdapter, tokenStorage }}>
      {children}
    </AuthProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...options?.renderOptions }),
    mockAdapter: mockAdapter as MockAdapter,
    tokenStorage,
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition timeout');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Mock localStorage for tests
 */
export function mockLocalStorage() {
  const storage: Record<string, string> = {};

  const mockStorage = {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: jest.fn((index: number) => Object.keys(storage)[index] || null),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
}

/**
 * Clean up localStorage mock
 */
export function cleanupLocalStorage() {
  delete (window as any).localStorage;
}
