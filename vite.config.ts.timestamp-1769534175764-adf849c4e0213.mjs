// vite.config.ts
import { defineConfig } from "file:///C:/Users/ahmed/Desktop/dashmkhzny23amzoon/afleet/afleet-85-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ahmed/Desktop/dashmkhzny23amzoon/afleet/afleet-85-main/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/Users/ahmed/Desktop/dashmkhzny23amzoon/afleet/afleet-85-main/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\ahmed\\Desktop\\dashmkhzny23amzoon\\afleet\\afleet-85-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 9e3,
    strictPort: false,
    hmr: true,
    // تفعيل إعادة التحميل التلقائي
    watch: {
      usePolling: true
      // للتأكد من عمل المراقبة
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        rewrite: (path2) => path2
      }
    }
  },
  plugins: [
    react(),
    // تفعيل componentTagger لتحسين التطوير
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhaG1lZFxcXFxEZXNrdG9wXFxcXGRhc2hta2h6bnkyM2Ftem9vblxcXFxhZmxlZXRcXFxcYWZsZWV0LTg1LW1haW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFobWVkXFxcXERlc2t0b3BcXFxcZGFzaG1raHpueTIzYW16b29uXFxcXGFmbGVldFxcXFxhZmxlZXQtODUtbWFpblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWhtZWQvRGVza3RvcC9kYXNobWtoem55MjNhbXpvb24vYWZsZWV0L2FmbGVldC04NS1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcImxvY2FsaG9zdFwiLFxuICAgIHBvcnQ6IDkwMDAsXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgaG1yOiB0cnVlLCAvLyBcdTA2MkFcdTA2NDFcdTA2MzlcdTA2NEFcdTA2NDQgXHUwNjI1XHUwNjM5XHUwNjI3XHUwNjJGXHUwNjI5IFx1MDYyN1x1MDY0NFx1MDYyQVx1MDYyRFx1MDY0NVx1MDY0QVx1MDY0NCBcdTA2MjdcdTA2NDRcdTA2MkFcdTA2NDRcdTA2NDJcdTA2MjdcdTA2MjZcdTA2NEFcbiAgICB3YXRjaDoge1xuICAgICAgdXNlUG9sbGluZzogdHJ1ZSwgLy8gXHUwNjQ0XHUwNjQ0XHUwNjJBXHUwNjIzXHUwNjQzXHUwNjJGIFx1MDY0NVx1MDY0NiBcdTA2MzlcdTA2NDVcdTA2NDQgXHUwNjI3XHUwNjQ0XHUwNjQ1XHUwNjMxXHUwNjI3XHUwNjQyXHUwNjI4XHUwNjI5XG4gICAgfSxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGhcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgLy8gXHUwNjJBXHUwNjQxXHUwNjM5XHUwNjRBXHUwNjQ0IGNvbXBvbmVudFRhZ2dlciBcdTA2NDRcdTA2MkFcdTA2MkRcdTA2MzNcdTA2NEFcdTA2NDYgXHUwNjI3XHUwNjQ0XHUwNjJBXHUwNjM3XHUwNjQ4XHUwNjRBXHUwNjMxXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJiBjb21wb25lbnRUYWdnZXIoKSxcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlgsU0FBUyxvQkFBb0I7QUFDMVosT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLEtBQUs7QUFBQTtBQUFBLElBQ0wsT0FBTztBQUFBLE1BQ0wsWUFBWTtBQUFBO0FBQUEsSUFDZDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsU0FBUyxDQUFDQSxVQUFTQTtBQUFBLE1BQ3JCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQTtBQUFBLElBRU4sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsRUFDNUMsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
