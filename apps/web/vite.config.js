import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  cacheDir: "/tmp/vite-web-cache",
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
