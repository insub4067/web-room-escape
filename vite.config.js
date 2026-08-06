import { defineConfig } from 'vite'

export default defineConfig({
  // Relative base so the build works both at a domain root and under a
  // GitHub Pages project subpath (/web-room-escape/).
  base: './',
  server: {
    host: true,
  },
})
