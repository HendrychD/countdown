import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'

// Replace color-mix() for old browsers (LG TV WebOS) — @layer is supported
function cssCompatPlugin() {
  return {
    name: 'css-compat',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && file.fileName.endsWith('.css')) {
          let css = file.source
          css = css.replace(/color-mix\(in\s+\w+,\s*red,\s*red\)/g, 'red')
          css = css.replace(/color-mix\(in\s+\w+,\s*currentcolor\s+50%,\s*transparent\)/g, 'currentcolor')
          file.source = css
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/countdown/',
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['chrome >= 53', 'defaults'],
    }),
    cssCompatPlugin(),
  ],
  build: {
    cssTarget: 'chrome53',
  },
})
