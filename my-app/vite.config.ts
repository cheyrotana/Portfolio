import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev only: the Retro theme's 3D room (and the images in public/) are built once when the page loads, so a
// hot update can't show an edit to them. Reload the page instead, so a change always shows straight away.
function reloadOn3d(): Plugin {
  const watch = /([\\/]RetroRoom\.tsx|[\\/]retroRoomBus\.ts|[\\/]public[\\/].+)$/
  return {
    name: 'reload-on-3d',
    apply: 'serve',
    handleHotUpdate({ file, server }) {
      if (!watch.test(file)) return
      server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), reloadOn3d()],
})
