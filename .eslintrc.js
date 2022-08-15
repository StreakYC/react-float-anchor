module.exports = {
  root: true,
  env: {
    browser: true,
    jest: true,
    node: true,
    es6: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
  ],
  settings: {
    react: {
      version: "18.0",
    },
  },
  rules: {
    "react/no-unescaped-entities": ["off"],
    "@typescript-eslint/no-explicit-any": ["off"],
    "@typescript-eslint/no-non-null-assertion": ["off"],
    "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
    "no-var": ["error"],
  },
};
