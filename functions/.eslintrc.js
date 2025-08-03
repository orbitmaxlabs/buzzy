module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "script", // CommonJS modules in Node.js
  },
  extends: [
    "eslint:recommended",
    "google",
    "plugin:node/recommended",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", { "allowTemplateLiterals": true }],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {
    // Define any custom global variables here, if needed
    module: "readonly",
  require: "readonly",
  exports: "readonly",
  },
};
