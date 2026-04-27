import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: browser direct calls to api.openai.com are blocked by CORS; proxy via same origin.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/openai-api": {
        target: "https://api.openai.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/openai-api/, "")
      },
      "/openrouter-api": {
        target: "https://openrouter.ai",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/openrouter-api/, "")
      }
    }
  },
  preview: {
    proxy: {
      "/openai-api": {
        target: "https://api.openai.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/openai-api/, "")
      },
      "/openrouter-api": {
        target: "https://openrouter.ai",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/openrouter-api/, "")
      }
    }
  }
});
