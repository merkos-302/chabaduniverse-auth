import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// External dependencies (peer dependencies and runtime dependencies)
const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
  'react/jsx-runtime',
];

// Common plugins configuration
const plugins = [
  resolve(),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.build.json',
    declaration: false, // We handle declarations separately
    declarationMap: false,
    outDir: undefined, // Let Rollup handle output
  }),
];

export default [
  // ESM build
  {
    input: {
      index: 'src/index.ts',
      react: 'src/react/index.ts',
      adapters: 'src/adapters/index.ts',
    },
    output: {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    external,
    plugins,
  },

  // CommonJS build
  {
    input: {
      index: 'src/index.ts',
      react: 'src/react/index.ts',
      adapters: 'src/adapters/index.ts',
    },
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
      exports: 'named',
    },
    external,
    plugins,
  },

  // Type definitions bundle
  {
    input: {
      index: 'dist/types/index.d.ts',
      react: 'dist/types/react/index.d.ts',
      adapters: 'dist/types/adapters/index.d.ts',
    },
    output: {
      dir: 'dist/types',
      format: 'esm',
    },
    plugins: [dts()],
  },
];
