import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages はリポジトリ名のサブパス(https://<owner>.github.io/group-formation-simulator/)で配信されるため
  // base is fixed to '/group-formation-simulator/' for GitHub Pages. Change it to '/' if moving to a custom domain.
  // 開発サーバー(npm run dev / dev:host)もこの base 配下(http://localhost:5173/group-formation-simulator/)で動く。
  base: '/group-formation-simulator/',
})
