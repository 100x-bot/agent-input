import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: './setup/jest-environment.ts',
  globalSetup: './setup/global-setup.ts',
  globalTeardown: './setup/global-teardown.ts',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  testTimeout: 30000,
  verbose: true,
  rootDir: __dirname,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: './tsconfig.json',
    }],
  },
};

export default config;
