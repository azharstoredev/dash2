import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    outDir: "dist/server",
    lib: {
      entry: path.resolve(__dirname, "server/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "express",
        "cors",
        "dotenv",
        "multer",
        "@supabase/supabase-js",
        "zod",
        "path",
        "fs",
        "crypto",
        /^node:/,
      ],
      output: {
        format: "es",
      },
    },
    target: "node18",
    ssr: true,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
