// The site's address (https://host), for links that must be absolute, like link preview images
export function useSiteOrigin(): string {
  const { siteUrl } = useRuntimeConfig().public;
  if (siteUrl) return new URL(siteUrl).origin;

  // Behind a reverse proxy the request arrives as plain http, so trust the proxy's headers
  return useRequestURL({ xForwardedHost: true, xForwardedProto: true }).origin;
}
