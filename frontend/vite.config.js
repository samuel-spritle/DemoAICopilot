import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the built assets load when FastAPI serves dist/ at the root.
export default defineConfig({
  plugins: [react()],
  base: './',
})
