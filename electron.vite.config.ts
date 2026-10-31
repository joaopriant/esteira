import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') },
        // Com "type": "module" o electron-vite emite o preload como ESM (.mjs).
        // sandbox: true só executa preload em CommonJS, e o .cjs não herda o type do pacote.
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs',
          chunkFileNames: '[name].cjs',
          inlineDynamicImports: true,
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: { '@shared': resolve('src/shared') },
    },
    plugins: [react()],
  },
})
