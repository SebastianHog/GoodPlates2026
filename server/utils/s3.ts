import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

let client: S3Client | undefined;

function getS3(): S3Client {
  if (!client) {
    const { s3 } = useRuntimeConfig();
    if (!s3.endpoint || !s3.accessKeyId || !s3.secretAccessKey) {
      throw new Error("NUXT_S3_ENDPOINT, NUXT_S3_ACCESS_KEY_ID and NUXT_S3_SECRET_ACCESS_KEY must be set");
    }
    client = new S3Client({
      endpoint: s3.endpoint,
      region: s3.region,
      // Garage serves buckets by path, not by subdomain
      forcePathStyle: true,
      credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey },
    });
  }

  return client;
}

function bucket(): string {
  return useRuntimeConfig().s3.bucket;
}

export async function pingStorage(): Promise<void> {
  await getS3().send(new HeadBucketCommand({ Bucket: bucket() }));
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  await getS3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys are never reused, so files can be cached forever
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function getObject(key: string) {
  return await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
}

export async function deleteObject(key: string): Promise<void> {
  await getS3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

// Deletes every size of these photos. A file that fails to delete only takes up space, so this never throws
export async function deletePhotos(keys: string[], context: string): Promise<void> {
  const results = await Promise.allSettled(
    keys.flatMap((key) => IMAGE_WIDTHS.map((width) => deleteObject(`${key}-${width}.webp`))),
  );
  const failed = results.filter((outcome) => outcome.status === "rejected").length;
  if (failed) console.warn(`Could not delete ${failed} photo files of ${context}`);
}
