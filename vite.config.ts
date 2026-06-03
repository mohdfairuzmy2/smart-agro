import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
/** GitHub Pages: https://mohdfairuzmy2.github.io/smart-agro/ */
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
