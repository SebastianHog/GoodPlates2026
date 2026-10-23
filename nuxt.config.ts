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
  runtimeConfig: {
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
      // TODO: Change to garage url later on
      imageBaseUrl: "/images",
    },
  },
});
