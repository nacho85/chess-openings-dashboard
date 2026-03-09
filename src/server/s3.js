import { S3Client } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-provider-ini";

const region = process.env.REGION || process.env.APP_AWS_REGION;
const isProd = process.env.NODE_ENV === "production";
const profile = (process.env.AWS_PROFILE || "personal").trim();

export const s3 = new S3Client({
  region,
  ...(isProd
    ? {}
    : {
        credentials: fromIni({ profile }),
      }),
});