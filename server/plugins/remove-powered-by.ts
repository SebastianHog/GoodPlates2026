// Nitro adds "x-powered-by: Nuxt" to every response; drop it so the stack isn't advertised
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("beforeResponse", (event) => {
    removeResponseHeader(event, "x-powered-by");
  });
});
