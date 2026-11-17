import type { NextConfig } from "next";

const config: NextConfig = {
  // Let phones on your Wi-Fi open the dev server (http://192.168.x.x:3000) during `npm run dev`.
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*"],
};

export default config;
