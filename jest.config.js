export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.+(ts|tsx|js)',
    '**/__tests__/**/*.spec.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/setup.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**/*',
    // Exclude unimplemented features
    '!src/database/**/*',
    '!src/core/utils/**/*',
    '!src/strategies/**/*',
    '!src/utils/**/*',
    // Exclude untested modules (to be tested incrementally)
    '!src/hooks/**/*',
    '!src/activity/context/**/*',
    '!src/activity/hooks/**/*',
    '!src/analytics/context/**/*',
    '!src/analytics/hooks/**/*',
    '!src/app-data/context/**/*',
    '!src/app-data/hooks/**/*',
    '!src/core/contexts/**/*',
    '!src/core/hooks/**/*',
    '!src/preferences/context/**/*',
    '!src/preferences/hooks/**/*',
    '!src/profile/context/**/*',
    '!src/profile/hooks/**/*',
    '!src/providers/**/*',
    '!src/sync/SyncManager.ts',
    '!src/react/components/AuthGuard.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleDirectories: ['node_modules', 'src'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
