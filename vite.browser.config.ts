import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pluginApi } from './src/dev/plugin-api'

export default defineConfig({
  root: 'src/renderer',
  plugins: [react(), pluginApi()],
  server: {
    host: '127.0.0.1',
    port: 43123,
    strictPort: true,
  },
})
