// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["nuxt-auth-utils"],
  css: ["~/assets/scss/main.scss"],
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
