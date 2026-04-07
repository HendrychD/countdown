import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'

// Strip @layer wrappers and color-mix() for old browsers (LG TV WebOS)
function cssCompatPlugin() {
  return {
    name: 'css-compat',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && file.fileName.endsWith('.css')) {
          let css = file.source
          // Remove @layer wrappers but keep contents
          css = css.replace(/@layer\s+[\w-]+\s*\{/g, '')
          // Remove matching closing braces (outermost layer braces)
          // We do this by tracking brace depth
          css = stripLayerBraces(css)
          // Replace color-mix fallbacks
          css = css.replace(/color-mix\(in\s+\w+,\s*red,\s*red\)/g, 'red')
          css = css.replace(/color-mix\(in\s+\w+,\s*currentcolor\s+50%,\s*transparent\)/g, 'currentcolor')
          file.source = css
        }
      }
    },
  }
}

function stripLayerBraces(css) {
  // Simple approach: remove all @layer declarations and rebalance braces
  let result = ''
  let depth = 0
  let layerDepths = []
  let i = 0

  while (i < css.length) {
    // Check for @layer
    if (css.slice(i, i + 6) === '@layer') {
      const openBrace = css.indexOf('{', i)
      if (openBrace !== -1) {
        // Skip the @layer ... { part
        layerDepths.push(0)
        i = openBrace + 1
        continue
      }
    }

    if (css[i] === '{') {
      if (layerDepths.length > 0) {
        layerDepths[layerDepths.length - 1]++
      }
      result += css[i]
    } else if (css[i] === '}') {
      if (layerDepths.length > 0) {
        if (layerDepths[layerDepths.length - 1] === 0) {
          // This closing brace matches the @layer opening
          layerDepths.pop()
          i++
          continue
        }
        layerDepths[layerDepths.length - 1]--
      }
      result += css[i]
    } else {
      result += css[i]
    }
    i++
  }

  return result
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
