import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 最小構成の Vite 設定。R3F は SSR を使わないので追加設定は不要。
// base: 本番ビルドのみ GitHub Pages のサブパス配信に合わせる（dev/preview は "/" のまま）。
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/hiroshimai-3d-lp/" : "/",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}));
