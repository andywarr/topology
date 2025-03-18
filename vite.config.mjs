import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  loader: { ".js": "jsx" },
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  root: ".",
  build: {
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
