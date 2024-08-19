module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
    '^.+\\.js$': 'babel-jest', // Use Babel for JavaScript files
  },
  moduleNameMapper: {
    '^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
    '^\\$plugins/(.*)$': '<rootDir>/src/lib/plugins/$1',
    // '^webextension-polyfill\\?client$': '<rootDir>/__mocks__/webextension-polyfill.js', // Testing moving the client away
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(webextension-polyfill)/)', // Ignore node_modules except webextension-polyfill
    '<rootDir>../../node_modules/(?!(webextension-polyfill)/)', // Ignore node_modules except webextension-polyfill
  ],
};


// {
//   "scripts": {
//     "test": "jest"
//   },
//   "jest": {
//     "preset": "ts-jest",
//     "testEnvironment": "node",
//     "moduleNameMapper": {
//       "^\\$lib/(.*)": "<rootDir>/src/lib/$1",
//       "^\\$plugins/(.*)": "<rootDir>/src/plugins/$1"
//     }
//   },
//   "devDependencies": {
//     "@types/jest": "^27.0.3",
//     "jest": "^27.4.5",
//     "ts-jest": "^27.1.2"
//   }
// }
