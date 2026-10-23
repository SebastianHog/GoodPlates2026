// Every uploaded photo is stored in these widths as `<key>-<width>.webp`
export const IMAGE_WIDTHS = [400, 800, 1600] as const;

// Keys look like `posts/<uuid>`; older posts store a plain path such as /fakeData/images/jam.webp
export const IMAGE_KEY_PATTERN = /^posts\/[0-9a-f-]{36}$/;
