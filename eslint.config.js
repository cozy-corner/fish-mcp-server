import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        Buffer: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly'
      }
    },
    rules: {
      // Prettier との競合を避ける
      'prettier/prettier': 'error',
      
      // TypeScript 固有のルール
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // 一般的なルール
      'no-console': 'error', // MCP サーバーでは console 出力を禁止
      'prefer-const': 'error'
    }
  },
  prettierConfig,
  {
    ignores: ['dist/**/*', 'node_modules/**/*', '**/*.js', '**/*.d.ts']
  }
];