import type { NextConfig } from "next";
import { remoteImagePatterns } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    /* La liste vit dans `src/lib/image-hosts.ts` parce que le code applicatif en
       a besoin lui aussi : il écarte les images hébergées ailleurs AVANT de les
       confier à next/image, plutôt que de laisser une image cassée à l'écran. */
    remotePatterns: [...remoteImagePatterns],
  },
};

export default nextConfig;
