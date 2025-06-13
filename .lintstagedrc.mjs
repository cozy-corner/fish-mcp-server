export default {
  'src/**/*.ts': [
    'eslint --fix',
    'prettier --write',
    'git add',
    'eslint --max-warnings=0',
    () => 'tsc --noEmit',
    () => 'npm test'
  ]
};