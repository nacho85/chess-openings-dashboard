import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { s3 } from "./s3";
import { unstable_cache } from "next/cache";

const Bucket = process.env.S3_BUCKET_NAME;
const Prefix = "openings/";

export const listOpeningsCached = unstable_cache(
  async () => {
    return await listOpenings();
  },
  ["openings-list"],
  {
    tags: ["openings"],
    revalidate: 300,
  }
);

function assertEnv() {
  if (!Bucket) throw new Error("Missing S3_BUCKET_NAME");
  if (!process.env.REGION && !process.env.APP_AWS_REGION) {
    throw new Error("Missing REGION");
  }
}

function keyForId(id) {
  return `${Prefix}${id}.json`;
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function normalizeOpening(opening) {
  if (!opening || typeof opening !== "object") return opening;

  return {
    ...opening,
    side: opening.side || "w",
  };
}

export async function listOpenings() {
  assertEnv();

  const listed = await s3.send(
    new ListObjectsV2Command({
      Bucket,
      Prefix,
    })
  );

  const keys = (listed.Contents || [])
    .map((item) => item.Key)
    .filter((key) => key && key.endsWith(".json"));

  const openings = await Promise.all(
    keys.map(async (Key) => {
      const res = await s3.send(
        new GetObjectCommand({
          Bucket,
          Key,
        })
      );

      const text = await streamToString(res.Body);
      return normalizeOpening(JSON.parse(text));
    })
  );

  return openings.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getOpening(id) {
  assertEnv();

  const listed = await s3.send(
    new ListObjectsV2Command({
      Bucket,
      Prefix,
    })
  );

  const keys = (listed.Contents || [])
    .map((item) => item.Key)
    .filter((key) => key && key.endsWith(".json"));

  for (const Key of keys) {
    const res = await s3.send(
      new GetObjectCommand({
        Bucket,
        Key,
      })
    );

    const text = await streamToString(res.Body);
    const opening = normalizeOpening(JSON.parse(text));

    if (opening?.id === id) {
      return {
        ...opening,
        _storageKey: Key,
      };
    }
  }

  throw new Error(`Opening not found: ${id}`);
}

export async function saveOpening(opening) {
  assertEnv();

  if (!opening?.id) throw new Error("Opening id is required");

  const Key = opening._storageKey || keyForId(opening.id);
  const { _storageKey, ...cleanOpening } = opening;

  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: JSON.stringify(cleanOpening, null, 2),
      ContentType: "application/json",
    })
  );

  return { ok: true };
}

export async function deleteOpening(id) {
  assertEnv();

  await s3.send(
    new DeleteObjectCommand({
      Bucket,
      Key: keyForId(id),
    })
  );

  return { ok: true };
}
