import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/cloudsurfer-aero/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.join(root, "src"),
    },
  },
});
