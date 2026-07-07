// Root ESLint config — applied to all packages
// Architectural boundary: no file outside packages/api-clients may import
// upstream providers (jikan, anidb, consumet) directly.
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn"
  },
  overrides: [
    {
      // Applied everywhere EXCEPT the api-clients package itself
      files: ["apps/**/*.{ts,tsx}", "packages/transformers/**/*.ts", "packages/db/**/*.ts", "packages/types/**/*.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["*consumet*", "*jikan*", "*anidb*", "*anime-facts*"],
                message: "External provider clients must only be imported inside packages/api-clients. Use the exported interfaces from @omozoku/api-clients instead."
              }
            ]
          }
        ]
      }
    }
  ],
  env: {
    node: true,
    es2022: true
  }
};
