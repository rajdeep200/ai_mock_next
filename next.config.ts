import type { NextConfig } from "next";
import createMDX from '@next/mdx'

const withMdx = createMDX({
  extension: /\.mdx?$/,
})

const nextConfig: NextConfig = {
  compiler: {
    removeConsole:
      process.env.KEEP_LOGS === "1"
        ? false
        : process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
} satisfies NextConfig;

export default withMdx(nextConfig);
