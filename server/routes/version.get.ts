// Which build is running: only answers on the local network; everyone else gets a plain 404, as if it didn't exist
const startedAt = new Date().toISOString();

export default defineEventHandler((event) => {
  if (!isLocalNetworkClient(event)) {
    throw createError({ statusCode: 404, statusMessage: "Page not found" });
  }

  // Never stored by a cache or proxy, which could otherwise hand it to people outside the network
  setResponseHeader(event, "Cache-Control", "no-store");

  const { commit, version, builtAt } = useRuntimeConfig(event).build;
  return {
    version: version || null,
    commit: commit || null,
    builtAt,
    startedAt,
    node: process.version,
  };
});
