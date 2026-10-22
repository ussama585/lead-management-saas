import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { compile } from 'sass'
import { writeFileSync } from 'node:fs'

// Compile the retained page styles before Vite reads their CSS imports.
for (const name of ['global', 'leads', 'sales-data']) {
  const source = fileURLToPath(new URL(`./src/assets/styles/legacy/${name}.scss`, import.meta.url))
  const destination = fileURLToPath(new URL(`./src/assets/styles/legacy/${name}.generated.css`, import.meta.url))
  writeFileSync(destination, compile(source, { style: 'expanded' }).css + '\n')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: { include: ['lucide-react'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['src/**/*.test.{js,jsx}'], pool: 'threads', maxWorkers: 1 },
})
