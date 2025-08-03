module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "script", // Required for CommonJS (Node.js)
  },
  extends: [
    "eslint:recommended",
    "google",
    "plugin:node/recommended"
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
    module: "readonly",
    require: "readonly",
    exports: "readonly"
  },
};
