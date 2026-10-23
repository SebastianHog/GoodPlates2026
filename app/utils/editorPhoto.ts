// A photo in the post editor: already uploaded (has a key), uploading, or failed
export interface EditorPhoto {
  id: string;
  key: string;
  // What the editor shows: the uploaded image, or a local preview while uploading
  preview: string;
  status: "uploading" | "done" | "error";
  // Only set for photos picked in this session, so a failed upload can be retried
  file?: File;
}

export function photoFromKey(key: string): EditorPhoto {
  return { id: key, key, preview: imageSources(key).src, status: "done" };
}
