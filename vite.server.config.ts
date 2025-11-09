import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const plugins = [tsconfigPaths()];

  if (mode !== 'production') {
    plugins.push(
      ...VitePluginNode({
        adapter: 'express',
        appPath: './server/index.ts',
        tsCompiler: 'esbuild',
        exportName: 'app',
        initAppOnBoot: true,
        reloadAppOnFileChange: true,
      }),
    );
  }

  return {
    server: {
      port: 5173,
    },
    plugins,
  };
});
