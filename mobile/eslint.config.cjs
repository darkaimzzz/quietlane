const {defineConfig}=require('eslint/config');
const expo=require('eslint-config-expo/flat');
const resolver=require.resolve('eslint-import-resolver-typescript',{paths:[require.resolve('eslint-config-expo/flat')]});
module.exports=defineConfig([expo,{ignores:['dist/**','dist-ios/**','release/**','node_modules/**']},{settings:{'import/resolver':resolver}},{files:['tests/**/*.ts'],rules:{'@typescript-eslint/no-explicit-any':'off'}}]);
