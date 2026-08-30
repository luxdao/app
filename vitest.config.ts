import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // A run that finds nothing is a failure, not a pass.
    passWithNoTests: false,
    testTimeout: 60_000,
  },
})
