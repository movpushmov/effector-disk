import type { ViteDevServer } from 'vite';

let server: ViteDevServer | null = null;

export async function getViteDevServer() {
  if (!server) {
    const vite = await import('vite');

    server = await vite.createServer({
      server: { middlewareMode: true, hmr: true },
      appType: 'custom',
    });
  }

  return server;
}
