// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["nuxt-auth-utils", "@nuxtjs/i18n"],
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
  css: ["@fontsource-variable/literata/opsz.css", "@fontsource-variable/figtree/wght.css", "~/assets/scss/main.scss"],
  // Baseline hardening on every response. CSP keeps 'unsafe-inline' because Nuxt ships an inline
  // bootstrap script and importmap; it still blocks external/injected scripts, framing and plugins.
  // HSTS has no includeSubDomains on purpose: other *.sebhog.com services must not be forced onto it.
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Strict-Transport-Security": "max-age=31536000",
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self'",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
      },
    },
  },
  runtimeConfig: {
    // Set via NUXT_MONGODB_URI in .env, server-only
    mongodbUri: "",
    // Sessions expire after 30 days so a leaked cookie cannot be used forever (nuxt-auth-utils)
    session: { maxAge: 60 * 60 * 24 * 30 },
    // Comma-separated proxy IPs whose X-Forwarded-For is trusted (NUXT_TRUSTED_PROXY_IPS).
    // Empty keeps the old behaviour of trusting any private/loopback source.
    trustedProxyIps: "",
    // Set via NUXT_S3_* in .env, server-only (Garage, see deploy/garage)
    s3: {
      endpoint: "",
      region: "garage",
      bucket: "goodplates",
      accessKeyId: "",
      secretAccessKey: "",
    },
    public: {
      // TODO: Change to garage url later on
      imageBaseUrl: "/images",
      // The site's own origin, used to reject cross-site writes (NUXT_PUBLIC_SITE_URL).
      // Empty disables the Origin check and relies on the JSON content-type check alone.
      siteUrl: "",
    },
  },
});
