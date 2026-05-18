import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // FIX incarcare lenta + reload-uri: MUI icons sunt importate per-fisier
  // (`@mui/icons-material/X`). Vite le descopera progresiv pe masura ce navigam,
  // declansand re-optimizare + reload (vezi log: "optimized dependencies changed").
  // Cu entries scanam TOATE .tsx la pornire, deci toate iconurile sunt prinse intr-un
  // singur pre-bundle. Include forteaza @mui/icons-material in optimize chiar daca
  // scanner-ul ar rata vreuna.
  optimizeDeps: {
    entries: ['./index.html', './src/**/*.{ts,tsx}'],
    include: [
      '@mui/icons-material',
      '@mui/material',
      '@mui/material/styles',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
  server: {
    // Salveaza state-ul UI cand Vite trebuie totusi sa repreocesa deps —
    // evita pierderea formularelor / a tab-ului curent.
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx'],
    },
    // Docker Desktop Windows nu propaga inotify events din host (Windows) in
    // container (Linux), deci HMR nativ nu prinde schimbarile facute din IDE.
    // Polling la 1s rezolva — costul CPU e neglijabil pt un proiect de marimea
    // asta. Daca rulezi Vite nativ pe Linux/Mac, poti scoate "watch".
    watch: {
      usePolling: true,
      interval: 1000,
    },
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
})
