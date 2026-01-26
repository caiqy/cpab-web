import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        // The Go backend embeds assets from cpab-api/internal/webui/dist.
        // Keep the output aligned so `go:embed dist/*` always has files.
        outDir: '../cpab-api/internal/webui/dist',
        emptyOutDir: true,
    },
})
