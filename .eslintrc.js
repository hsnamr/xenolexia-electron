module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
  rules: {
    // React
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript
    'react/jsx-uses-react': 'off',
    'react/jsx-filename-extension': ['warn', {extensions: ['.tsx', '.jsx']}],
    'react/jsx-props-no-spreading': 'off',
    'react/require-default-props': 'off',

    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',

    // Import
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@components/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@screens/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@stores/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@services/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@types/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '@navigation/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['react', 'type'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-duplicates': 'warn',

    // General
    'no-console': ['warn', {allow: ['warn', 'error']}],
    'no-debugger': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',

    // Prettier
    'prettier/prettier': [
      'warn',
      {
        endOfLine: 'auto',
      },
    ],
  },
  overrides: [
    // Test files
    {
      files: [
        '**/__tests__/**/*',
        '**/*.test.*',
        '**/*.spec.*',
        '**/jest.setup.js',
        '**/jest.config.js',
      ],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off',
        'no-console': 'off',
      },
    },
    // Config files
    {
      files: ['*.config.js', '*.config.ts', '.eslintrc.js', 'playwright.config.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    '*.lock',
    'electron/**/*.js',
    'dist/',
    'release/',
  ],
};
