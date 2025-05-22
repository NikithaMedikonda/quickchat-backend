module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 20000,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js"],
  testMatch: ["**/src/**/*.test.ts"],
};
