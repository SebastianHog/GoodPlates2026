// src and srcset for a post image, so the browser picks the smallest size that looks sharp
export function imageSources(image: string): { src: string; srcset?: string } {
  const { imageBaseUrl } = useRuntimeConfig().public;
  const url = (width: number) => `${imageBaseUrl}/${image}-${width}.webp`;

  return {
    src: url(800),
    srcset: IMAGE_WIDTHS.map((width) => `${url(width)} ${width}w`).join(", "),
  };
}
