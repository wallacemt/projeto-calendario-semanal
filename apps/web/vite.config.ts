import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    // ponytail: WSL2 + projeto num drive Windows (/mnt/e) — o watcher nativo
    // (inotify) não recebe eventos do DrvFs, então HMR fica mudo sem isso.
    // Custo é CPU de polling; sobe se ficar pesado.
    watch: { usePolling: true, interval: 300 },
  },
})
