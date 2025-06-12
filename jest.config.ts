module.exports = {
  "jest.autoRun": {
  "watch": false,
  "onSave": "off"},
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 20000,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js"],
  testMatch: ["**/src/**/*.test.ts", "**/__tests__/**/*.test.ts"],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
