import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
      entryRoot: 'src',
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'vue/index': resolve(__dirname, 'src/vue/index.ts'),
        'html/index': resolve(__dirname, 'src/html/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', '@vue/server-renderer', /^@dtpr\/api($|\/)/],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (info) => {
          if (info.name === 'style.css') return 'vue/styles.css'
          return 'assets/[name][extname]'
        },
      },
    },
    cssCodeSplit: false,
    emptyOutDir: true,
  },
})
