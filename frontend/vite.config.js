import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "/", // Change to '/your-repo-name/' if using a custom GitHub repo path
  server: {
    open: true,
    port: 3001,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  closeBundle: () => {
    const indexPath = resolve(__dirname, 'dist/index.html');
    const notFoundPath = resolve(__dirname, 'dist/404.html');
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, notFoundPath);
      console.log('✔ 404.html created for GitHub Pages SPA routing');
    }
  },
})
