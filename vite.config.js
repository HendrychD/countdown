import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'
import postcss from 'postcss'
import cascadeLayers from '@csstools/postcss-cascade-layers'

// Polyfill @layer via postcss-cascade-layers (adds specificity wrappers)
// and replace color-mix(currentcolor) which can't be statically resolved
function cssCompatPlugin() {
  return {
    name: 'css-compat',
    enforce: 'post',
    async generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && file.fileName.endsWith('.css')) {
          // 1. Polyfill @layer with proper specificity adjustments
          const result = await postcss([cascadeLayers()]).process(file.source, { from: undefined })
          let css = result.css
          // 2. Replace color-mix() that uses currentcolor (can't resolve at build time)
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
      targets: ['chrome >= 80', 'defaults'],
    }),
    cssCompatPlugin(),
  ],
})
