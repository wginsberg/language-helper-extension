import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: "src",
  outDir: "build",
  manifest: {
    permissions: ["contextMenus"],
    name: "AI Language Helper",
  },
});
