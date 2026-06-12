import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Em produção (GitHub Pages) o app é servido em /pm-ti/.
// Em dev local, base = '/' (default).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/pm-ti/' : '/',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
}))
