const {resolve, join} = require("path");
const {sync} = require("glob");
const htmlEntries = sync(resolve(__dirname, "src", "*.html"));

export default {
  root: resolve(__dirname, "src"),
  base: "./",
  publicDir: resolve(__dirname, "src", "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    assetsDir: "assets",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      input: htmlEntries,
      output: {
        entryFileNames: () => {
          return join("assets", "js", htmlEntries.length === 1 ? "[name].[hash].js" : "ignore.js");
        },
        chunkFileNames: join("assets", "js", "[name].[hash].js"),
        assetFileNames: join("assets", "css", "[name].[hash].[ext]"),
        manualChunks: {},
      },
    },
  },
};
