// Every uploaded photo is stored in these widths as `<key>-<width>.webp`
export const IMAGE_WIDTHS = [400, 800, 1600] as const;

// pattern to test if the generated key is correct.
// should look like: "posts/59ea1a92-acd2-4c45-bf11-7c1b3ca3f3a8"
export const IMAGE_KEY_PATTERN = /^posts\/[0-9a-f-]{36}$/;
