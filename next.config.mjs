import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const baseConfig = {};

const nextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(baseConfig);

export default nextConfig;
