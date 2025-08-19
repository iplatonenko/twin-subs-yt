import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: "src/main.tsx",
      userscript: {
        icon: "https://raw.githubusercontent.com/iplatonenko/twin-subs-yt/main/assets/logo.svg",
        namespace: "iplatonenko",
        name: "Twin Subs YT",
        match: ["https://www.youtube.com/watch*"],
        grant: ["GM_getValue", "GM_setValue", "GM_xmlhttpRequest"],
        connect: ["api.openai.com"],
        updateURL:
          "https://raw.githubusercontent.com/iplatonenko/twin-subs-yt/dist/twin-subs-yt.user.js",
        downloadURL:
          "https://raw.githubusercontent.com/iplatonenko/twin-subs-yt/dist/twin-subs-yt.user.js",
      },
    }),
  ],
});
