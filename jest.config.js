module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/browser-extension'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'browser-extension/**/*.js',
    '!browser-extension/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000
};
