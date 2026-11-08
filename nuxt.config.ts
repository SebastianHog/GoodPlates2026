import { execSync } from "node:child_process";

// Which code a build is, shown on /version. The Docker build gets these from CI as build args; locally, ask git
function gitCommit(): string {
  if (process.env.GIT_COMMIT) return process.env.GIT_COMMIT;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["nuxt-auth-utils", "@nuxtjs/i18n", "nuxt-security"],
  // Texts live in i18n/locales/<code>.json; the browser's language is picked when we have it
  i18n: {
    defaultLocale: "en",
    strategy: "no_prefix",
    locales: [
      { code: "en", language: "en", name: "English", file: "en.json" },
      { code: "sv", language: "sv", name: "Svenska", file: "sv.json" },
      { code: "tr", language: "tr", name: "Türkçe", file: "tr.json" },
      { code: "es", language: "es", name: "Español", file: "es.json" },
      { code: "nl", language: "nl", name: "Nederlands", file: "nl.json" },
      { code: "fi", language: "fi", name: "Suomi", file: "fi.json" },
    ],
  },
  // Self-hosted variable fonts: Literata for recipe and page titles, Figtree for everything else
  css: [
    "@fontsource-variable/literata/opsz.css",
    "@fontsource-variable/figtree/wght.css",
    "~/assets/scss/main.scss",
  ],
  // Security headers on every response (nuxt-security). Its other features are off: the app has its own
  // rate limits and body size limits, and recipe text may contain characters its XSS filter rejects
  security: {
    rateLimiter: false,
    requestSizeLimiter: false,
    xssValidator: false,
    corsHandler: false,
    removeLoggers: false,
    headers: {
      // Only scripts from this site run; inline ones need the per-page nonce Nuxt adds
      contentSecurityPolicy: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'strict-dynamic'", "'nonce-{{nonce}}'"],
        "script-src-attr": ["'none'"],
        // Vue sets inline styles
        "style-src": ["'self'", "'unsafe-inline'"],
        // blob: for previews of photos picked in the editor
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'"],
        "connect-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'none'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"],
        "upgrade-insecure-requests": true,
      },
      strictTransportSecurity: { maxAge: 31536000, includeSubdomains: true },
      xFrameOptions: "DENY",
      referrerPolicy: "strict-origin-when-cross-origin",
      crossOriginOpenerPolicy: "same-origin",
      // Nothing is loaded from other sites, so this would only add a way to break things
      crossOriginEmbedderPolicy: false,
      // Turns off what the site never uses; wake lock (recipe pages), sharing and the clipboard stay allowed
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
        "display-capture": [],
        payment: [],
        usb: [],
      },
    },
  },
  // The dev server's hot reload needs inline scripts and a websocket, so the CSP only applies to builds
  $development: {
    security: {
      headers: { contentSecurityPolicy: false, strictTransportSecurity: false },
    },
  },
  routeRules: {
    // Link previews and other sites may show recipe photos
    "/images/**": {
      security: { headers: { crossOriginResourcePolicy: "cross-origin" } },
    },
  },
  runtimeConfig: {
    session: {
      // sec, min, hour, day
      maxAge: 60 * 60 * 24 * 7,
    },
    // Fixed when the app is built, server-only (see /version)
    build: {
      commit: gitCommit(),
      version: process.env.BUILD_VERSION ?? "",
      builtAt: new Date().toISOString(),
    },
    // Set via NUXT_MONGODB_URI in .env, server-only
    mongodbUri: "",
    // Set via NUXT_S3_* in .env, server-only (Garage, see deploy/garage)
    s3: {
      endpoint: "",
      region: "garage",
      bucket: "goodplates",
      accessKeyId: "",
      secretAccessKey: "",
    },
    public: {
      // The site's public address, e.g. https://goodplates.sebhog.com, for absolute links in link previews.
      // Set via NUXT_PUBLIC_SITE_URL; without it the address of the request is used
      siteUrl: "",
      // TODO: Change to garage url later on
      imageBaseUrl: "/images",
    },
  },
});
