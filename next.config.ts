import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  customWorkerSrc: "worker",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
        handler: "NetworkOnly",
        method: "GET",
        options: { cacheName: "chat-api-network-only" },
      },
      {
        urlPattern: ({ url }) =>
          url.hostname === "fsqzztoanzlkoygfcaru.supabase.co",
        handler: "NetworkOnly",
        method: "GET",
        options: { cacheName: "supabase-data-network-only" },
      },
      {
        urlPattern: ({ request, url }) =>
          url.origin === self.location.origin &&
          request.headers.get("RSC") === "1",
        handler: "NetworkOnly",
        method: "GET",
        options: { cacheName: "next-rsc-network-only" },
      },
      {
        urlPattern: ({ request }) => request.destination === "script",
        handler: "CacheFirst",
        method: "GET",
        options: {
          cacheName: "static-scripts",
          expiration: { maxEntries: 64, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: ({ request }) =>
          request.destination === "style" || request.destination === "font",
        handler: "StaleWhileRevalidate",
        method: "GET",
        options: {
          cacheName: "static-styles-fonts",
          expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: ({ request }) => request.destination === "image",
        handler: "StaleWhileRevalidate",
        method: "GET",
        options: {
          cacheName: "static-images",
          expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "app-shell-pages",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 16, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  turbopack: {},
};

export default withPWA(nextConfig);
