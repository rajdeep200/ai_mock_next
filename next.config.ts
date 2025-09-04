import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Strip console.* only in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] } // keep error/warn if you want
        : false,
  },
};

export default nextConfig;
