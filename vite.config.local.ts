import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
    port: 9000,
    strictPort: true,
    hmr: false, // تعطيل إعادة التحميل التلقائي
    watch: {
      usePolling: false,
    },
  },
  plugins: [
    react({
      fastRefresh: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
