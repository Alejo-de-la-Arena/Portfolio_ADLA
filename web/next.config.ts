import type { NextConfig } from "next";
const config: NextConfig = {
  cacheComponents: true,
  partialPrefetching: false,
  experimental: { globalNotFound: true },
};
export default config;
