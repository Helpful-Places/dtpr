import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  define: {
    // boardgame.io's client pulls in code that probes process.env
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
