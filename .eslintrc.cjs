/* ESLint configuration for Node + TypeScript project with a small browser client under frontend/.
 * Type-aware rules are enabled only for TS sources to avoid parsing JS/config files with TS program.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    // Do not set `project` at root; enable it only for TS files via overrides
  },
  env: {
    node: true,
    es2020: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts']
      },
      // If you later add path aliases in tsconfig, consider enabling typescript resolver
      // typescript: { project: './tsconfig.json' },
    },
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    // General best practices
    eqeqeq: ['error', 'smart'],
    curly: ['error', 'multi-line'],
    'no-console': 'warn', // allow during server dev, but warn to keep output intentional

    // Import hygiene
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/newline-after-import': 'warn',
    'import/no-duplicates': 'warn',

    // JS rules do not include TS plugin rules at root
    // Disable base rules replaced by TS versions (has effect for TS files via override)
    'no-unused-vars': 'off',
    'no-redeclare': 'off',
  },
  overrides: [
    // Enable type-aware rules for TS files only
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      extends: ['plugin:@typescript-eslint/recommended-type-checked'],
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }],
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],
        'no-useless-catch': 'off',
        'no-empty': ['error', { allowEmptyCatch: true }],
      },
    },
    // Browser client JS under frontend/
    {
      files: ['frontend/**/*.js'],
      env: { browser: true, node: false },
      parser: null, // plain JS
      parserOptions: { project: false },
      plugins: ['import'],
      extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
      rules: {
        'no-console': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-empty': ['error', { allowEmptyCatch: true }],
      },
    },
    // Tests (Node test runner)
    {
      files: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
      env: { node: true, es2020: true },
      parser: null,
      parserOptions: { project: false },
      rules: {
        'no-console': 'off',
      },
    },
    // Tooling and config files
    {
      files: ['*.cjs', '*.js'],
      excludedFiles: ['frontend/**/*.js', 'tests/**/*.test.js', 'tests/**/*.spec.js'],
      env: { node: true },
      parser: null,
      parserOptions: { project: false },
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
